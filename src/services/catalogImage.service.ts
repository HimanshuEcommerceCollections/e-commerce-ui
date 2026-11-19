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
  maxFileSizeBytes: number;
  contentTypes: string[];
}

const BASE = "/api/catalog/images";

let configCache: Promise<ImageUploadConfig> | null = null;

/** The envelope's data; a success without data is treated as a failure. */
const dataOf = <T,>(r: { data: ApiResponse<T> }): T => {
  if (r.data.data == null) throw new Error(r.data.message || "Empty response");
  return r.data.data;
};

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
    if (file.size > cfg.maxFileSizeBytes) return `${file.name} is larger than ${Math.round(cfg.maxFileSizeBytes / 1024 / 1024)} MB.`;
    return null;
  },

  upload(file: File) {
    const form = new FormData();
    form.append("file", file);
    return api
      .post<ApiResponse<StoredImage>>(BASE, form, {
        // Overrides the instance's JSON default; the browser adds the multipart boundary.
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120_000,
      })
      .then(dataOf);
  },

  /** Stores a copy of the image behind a link, so the product no longer depends on that host. */
  copyFromUrl(url: string) {
    return api.post<ApiResponse<StoredImage>>(`${BASE}/from-url`, { url }, { timeout: 60_000 }).then(dataOf);
  },
};

export default catalogImageService;
