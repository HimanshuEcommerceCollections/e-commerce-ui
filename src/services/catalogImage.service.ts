import api from "@/lib/Axios";
import type { ApiResponse } from "@/types/api/common.types";

/** An image stored on our side (Vercel Blob for now); `url` goes wherever an image link goes. */
export interface StoredImage {
  url: string;
  storageKey: string;
  width: number | null;
  height: number | null;
  contentType: string | null;
  fileSizeBytes: number | null;
}

export interface ImageUploadConfig {
  /** False when the server has no storage configured: image links only. */
  enabled: boolean;
  /** Limit for uploads through the API. */
  maxFileSizeBytes: number;
  /** Set when the browser can upload straight to storage, with this (larger) limit. */
  directMaxFileSizeBytes: number | null;
  contentTypes: string[];
}

interface DirectUploadStart {
  method: "vercel-blob";
  pathname: string;
  clientToken: string;
  storageKey: string;
  url: string;
}

const BASE = "/api/catalog/images";

let configCache: Promise<ImageUploadConfig> | null = null;

/** The envelope's data; a success without data is treated as a failure. */
const dataOf = <T,>(r: { data: ApiResponse<T> }): T => {
  if (r.data.data == null) throw new Error(r.data.message || "Empty response");
  return r.data.data;
};

/** The largest photo this server takes. */
export const maxPhotoBytes = (cfg: ImageUploadConfig) => cfg.directMaxFileSizeBytes ?? cfg.maxFileSizeBytes;

export const mb = (bytes: number) => `${Math.round(bytes / 1024 / 1024)} MB`;

/** A photo's displayed size (EXIF rotation applied, as the server measures it). */
async function photoSize(file: File): Promise<{ width: number; height: number }> {
  if (typeof createImageBitmap === "function") {
    const bmp = await createImageBitmap(file);
    const size = { width: bmp.width, height: bmp.height };
    bmp.close();
    return size;
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve({ width: im.naturalWidth, height: im.naturalHeight });
      im.onerror = () => reject(new Error(`${file.name} can't be opened as an image.`));
      im.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Product image files for sellers and catalog staff (mounted on /api/catalog/images). */
const catalogImageService = {
  /** Whether uploads are on, and the limits. Fetched once per page load. */
  config(): Promise<ImageUploadConfig> {
    const pending =
      configCache ??
      api
        .get<ApiResponse<ImageUploadConfig>>(`${BASE}/config`)
        .then(dataOf)
        .catch((e) => {
          configCache = null;
          throw e;
        });
    configCache = pending;
    return pending;
  },

  /** A problem the server would reject, found before uploading; null when the file looks fine. */
  precheck(file: File, cfg: ImageUploadConfig): string | null {
    if (cfg.contentTypes.length && !cfg.contentTypes.includes(file.type)) return `${file.name}: use a JPG, PNG, WebP or GIF image.`;
    const max = maxPhotoBytes(cfg);
    if (file.size > max) return `${file.name} is larger than ${mb(max)}.`;
    return null;
  },

  /**
   * Uploads one photo. Straight to storage when the server allows it (photos
   * up to the larger limit, past the API's request size cap), else through
   * the API. `onProgress` gets 0–100.
   */
  async uploadPhoto(file: File, cfg: ImageUploadConfig, onProgress?: (percent: number) => void): Promise<StoredImage> {
    if (!cfg.directMaxFileSizeBytes) return this.upload(file, onProgress);
    const { width, height } = await photoSize(file);
    const start = await api
      .post<ApiResponse<DirectUploadStart>>(`${BASE}/direct`, { contentType: file.type, fileSizeBytes: file.size, width, height })
      .then(dataOf);
    // Loaded on demand: only pages that upload pay for the Blob client.
    const { put } = await import("@vercel/blob/client");
    await put(start.pathname, file, {
      access: "public",
      token: start.clientToken,
      contentType: file.type,
      onUploadProgress: (e) => onProgress?.(Math.round(e.percentage)),
    });
    return api.post<ApiResponse<StoredImage>>(`${BASE}/direct/complete`, { storageKey: start.storageKey }).then(dataOf);
  },

  /** Uploads through the API (up to `maxFileSizeBytes`). */
  upload(file: File, onProgress?: (percent: number) => void) {
    const form = new FormData();
    form.append("file", file);
    return api
      .post<ApiResponse<StoredImage>>(BASE, form, {
        // Overrides the instance's JSON default; the browser adds the multipart boundary.
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120_000,
        onUploadProgress: (e) => onProgress?.(e.total ? Math.round((e.loaded / e.total) * 100) : 0),
      })
      .then(dataOf);
  },

  /** Stores a copy of the image behind a link, so the product no longer depends on that host. */
  copyFromUrl(url: string) {
    return api.post<ApiResponse<StoredImage>>(`${BASE}/from-url`, { url }, { timeout: 60_000 }).then(dataOf);
  },
};

export default catalogImageService;
