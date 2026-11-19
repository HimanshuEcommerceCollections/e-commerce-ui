"use client";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import catalogImageService, { maxPhotoBytes, mb, type ImageUploadConfig } from "@/services/catalogImage.service";
import { Ico, errorText } from "./ui";

/** Image_1_URL … Image_10_URL in the catalog template. */
export const MAX_PHOTOS = 10;
export const MIN_PX = 1000;

/** One labelled box per angle (designs/seller/seller-portal-phase1, Nov 2026). The main photo is required. */
const SLOTS: { key: string; title: string; hint: string; required?: boolean }[] = [
  { key: "primary", title: "Main photo", hint: "Front view on a plain white background. Shoppers see this first.", required: true },
  { key: "secondary", title: "Second angle", hint: "Another angle or the back" },
  { key: "side", title: "Side view", hint: "Shows depth and profile" },
  { key: "detail", title: "Close-up", hint: "Texture, material or a key detail" },
  { key: "lifestyle", title: "In use", hint: "The product in a real setting" },
];

export interface Photo {
  slot: string;
  /** The stored (or linked) URL; empty while a file is still uploading. */
  url: string;
  /** Local preview of a file being uploaded. */
  preview?: string;
  state: "uploading" | "checking" | "ok" | "small" | "bad";
  progress?: number;
  dims?: string;
}

export interface Gallery {
  photos: Photo[];
  /** Extra boxes added beyond the five named ones. */
  extra: number;
}

export const EMPTY_GALLERY: Gallery = { photos: [], extra: 0 };

const slotList = (extra: number) => [
  ...SLOTS,
  ...Array.from({ length: extra }, (_, i) => ({ key: `extra${i + 1}`, title: `Extra photo ${i + 1}`, hint: "Packaging, size guide or another angle", required: false })),
];

/** The gallery in template order: the main photo first, then the other boxes in order. */
export function galleryUrls(g: Gallery): string[] {
  return slotList(g.extra)
    .map((s) => g.photos.find((p) => p.slot === s.key)?.url ?? "")
    .filter(Boolean);
}

/** A saved product's image URLs, one per box in order (edit mode). */
export function galleryFromUrls(urls: string[]): Gallery {
  const extra = Math.max(0, urls.length - SLOTS.length);
  const keys = slotList(extra).map((s) => s.key);
  return { extra, photos: urls.map((url, i) => ({ slot: keys[i], url, state: "checking" as const })) };
}

/** The photos' problem for the form's error summary, or undefined. */
export function galleryProblem(g: Gallery): string | undefined {
  if (!g.photos.some((p) => p.slot === "primary")) return "Add the main photo";
  if (g.photos.some((p) => p.state === "uploading" || p.state === "checking")) return "Wait a moment while we check your photos";
  if (g.photos.some((p) => p.state === "small")) return `Replace the photos smaller than ${MIN_PX} px on the longest side`;
  if (g.photos.some((p) => p.state === "bad")) return "One photo can't be opened. Replace or remove it.";
  return undefined;
}

const sizeState = (w: number, h: number): Photo["state"] => (Math.max(w, h) >= MIN_PX ? "ok" : "small");

/**
 * The photo boxes of "Add one product": upload per angle (straight to storage,
 * up to 10 MB), drag a photo onto any box, add extra boxes up to ten, or
 * paste a link to a photo the seller hosts.
 */
export function PhotoSlots({
  gallery,
  setGallery,
  onTouched,
  invalid,
}: {
  gallery: Gallery;
  setGallery: Dispatch<SetStateAction<Gallery>>;
  onTouched: () => void;
  invalid: boolean;
}) {
  const [cfg, setCfg] = useState<ImageUploadConfig | null>(null);
  const [link, setLink] = useState("");
  const [over, setOver] = useState<string | null>(null);
  const previews = useRef(new Set<string>());

  useEffect(() => {
    catalogImageService
      .config()
      .then(setCfg)
      .catch(() => undefined); // uploads unavailable: links still work
    const urls = previews.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  // Saved photos (edit mode) are checked in the browser for their size.
  useEffect(() => {
    gallery.photos.filter((p) => p.state === "checking" && p.url && !p.preview).forEach((p) => probe(p.slot, p.url));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- probe each newly loaded photo once
  }, [gallery.photos.map((p) => `${p.slot}:${p.url}:${p.state}`).join("|")]);

  const uploads = !!cfg?.enabled;
  const slots = slotList(gallery.extra);
  const update = (slot: string, patch: Partial<Photo>) =>
    setGallery((g) => ({ ...g, photos: g.photos.map((p) => (p.slot === slot ? { ...p, ...patch } : p)) }));
  const remove = (slot: string) => setGallery((g) => ({ ...g, photos: g.photos.filter((p) => p.slot !== slot) }));

  function probe(slot: string, url: string) {
    const im = new Image();
    im.onload = () => update(slot, { state: sizeState(im.naturalWidth, im.naturalHeight), dims: `${im.naturalWidth} × ${im.naturalHeight}` });
    im.onerror = () => update(slot, { state: "bad" });
    im.src = url;
  }

  async function upload(slot: string, file: File) {
    if (!cfg?.enabled) return;
    const problem = catalogImageService.precheck(file, cfg);
    if (problem) return void toast.error(problem);
    const preview = URL.createObjectURL(file);
    previews.current.add(preview);
    onTouched();
    setGallery((g) => ({ ...g, photos: [...g.photos.filter((p) => p.slot !== slot), { slot, url: "", preview, state: "uploading", progress: 0 }] }));
    try {
      const img = await catalogImageService.uploadPhoto(file, cfg, (progress) => update(slot, { progress }));
      const w = img.width ?? 0;
      const h = img.height ?? 0;
      // Still this file in this box? (It may have been replaced or removed meanwhile.)
      setGallery((g) => ({
        ...g,
        photos: g.photos.map((p) => (p.slot === slot && p.preview === preview ? { ...p, url: img.url, state: sizeState(w, h), dims: `${w} × ${h}`, progress: undefined } : p)),
      }));
    } catch (e) {
      toast.error(errorText(e, `Couldn't upload ${file.name}`));
      setGallery((g) => ({ ...g, photos: g.photos.filter((p) => !(p.slot === slot && p.preview === preview)) }));
    }
  }

  /** Several files: the chosen box first, then the empty boxes in order, adding extra boxes up to ten. */
  function uploadMany(files: File[], startSlot: string) {
    let extra = gallery.extra;
    const taken = new Set(gallery.photos.map((p) => p.slot));
    const order = [startSlot, ...slots.map((s) => s.key).filter((k) => k !== startSlot && !taken.has(k))];
    const targets: [string, File][] = [];
    for (const file of files.slice(0, MAX_PHOTOS)) {
      let key = order.shift();
      if (!key && SLOTS.length + extra < MAX_PHOTOS) key = `extra${++extra}`;
      if (!key) {
        toast.error(`Up to ${MAX_PHOTOS} photos`);
        break;
      }
      targets.push([key, file]);
    }
    if (extra !== gallery.extra) setGallery((g) => ({ ...g, extra }));
    targets.forEach(([key, file]) => void upload(key, file));
  }

  const pick = (slot: string, files: FileList | null) => {
    const list = Array.from(files ?? []);
    if (list.length > 1) uploadMany(list, slot);
    else if (list[0]) void upload(slot, list[0]);
  };

  /** A pasted link goes into the first empty box. */
  function addLink() {
    const u = link.trim();
    if (!/^https?:\/\/\S+\.\S+/.test(u)) return void toast.error("Paste a full image link starting with https://");
    if (gallery.photos.some((p) => p.url === u)) return void toast.error("That link is already added");
    let extra = gallery.extra;
    let key = slotList(extra).find((s) => !gallery.photos.some((p) => p.slot === s.key))?.key;
    if (!key && SLOTS.length + extra < MAX_PHOTOS) key = `extra${++extra}`;
    if (!key) return void toast.error(`Up to ${MAX_PHOTOS} photos`);
    onTouched();
    setGallery((g) => ({ extra, photos: [...g.photos, { slot: key!, url: u, state: "checking" }] }));
    setLink("");
  }

  const addSlot = () => {
    if (slots.length >= MAX_PHOTOS) return;
    setGallery((g) => ({ ...g, extra: g.extra + 1 }));
    setTimeout(() => document.querySelector(`[data-slot="extra${gallery.extra + 1}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }), 0);
  };

  const done = gallery.photos.filter((p) => p.state === "ok").length;
  const accept = cfg?.contentTypes.join(",") ?? "image/jpeg,image/png,image/webp";

  return (
    <>
      <div className="sp-slot-guide">
        <span>JPG, PNG or WebP</span>
        {uploads ? <span>Up to {mb(maxPhotoBytes(cfg!))} each</span> : null}
        <span>Up to {MAX_PHOTOS} photos</span>
        {uploads ? <span>Drag a photo onto any box</span> : null}
      </div>
      <div className={`sp-slots${invalid ? " sp-slots-bad" : ""}`} id="sp-photos" tabIndex={-1}>
        {slots.map((s, n) => {
          const p = gallery.photos.find((x) => x.slot === s.key);
          const primary = s.key === "primary" ? " sp-primary" : "";
          const input = uploads ? (
            <input
              type="file"
              id={`sp-f-${s.key}`}
              className="sp-sr"
              accept={accept}
              multiple
              aria-required={s.required ? true : undefined}
              onChange={(e) => {
                pick(s.key, e.target.files);
                e.target.value = "";
              }}
            />
          ) : null;
          const drop = uploads
            ? {
                onDragOver: (e: React.DragEvent) => {
                  e.preventDefault();
                  setOver(s.key);
                },
                onDragLeave: () => setOver((o) => (o === s.key ? null : o)),
                onDrop: (e: React.DragEvent) => {
                  e.preventDefault();
                  setOver(null);
                  pick(s.key, e.dataTransfer.files);
                },
              }
            : {};
          if (!p) {
            const body = (
              <>
                <span className="sp-num">{n + 1}</span>
                <span className="sp-slot-ic">
                  <Ico name={uploads ? "upload" : "image"} />
                </span>
                <b>
                  {s.title}
                  {s.required ? <span className="sp-req"> *</span> : null}
                </b>
                <small>{s.hint}</small>
              </>
            );
            return uploads ? (
              <label key={s.key} className={`sp-slot${primary}${over === s.key ? " sp-on" : ""}`} htmlFor={`sp-f-${s.key}`} data-slot={s.key} {...drop}>
                {body}
                {input}
              </label>
            ) : (
              <div key={s.key} className={`sp-slot sp-slot-off${primary}`} data-slot={s.key}>
                {body}
              </div>
            );
          }
          const bad = p.state === "small" || p.state === "bad";
          const src = p.preview ?? p.url;
          return (
            <div key={s.key} className={`sp-slot sp-filled${primary}${bad ? " sp-bad" : ""}${over === s.key ? " sp-on" : ""}`} data-slot={s.key} {...drop}>
              {/* eslint-disable-next-line @next/next/no-img-element -- seller photos and links from any host */}
              {p.state !== "bad" && src ? <img src={src} alt={`${s.title}`} /> : null}
              <span className="sp-slot-tag">{s.title}</span>
              <span className={`sp-slot-meta sp-${p.state}`}>
                {p.state === "uploading"
                  ? `Uploading… ${p.progress ?? 0}%`
                  : p.state === "checking"
                    ? "Checking size…"
                    : p.state === "ok"
                      ? `✓ ${p.dims} px`
                      : p.state === "small"
                        ? `Too small · ${p.dims} px`
                        : "Can't open this photo"}
              </span>
              <span className="sp-slot-acts">
                {uploads ? (
                  <label className="sp-sbtn" htmlFor={`sp-f-${s.key}`} title="Replace">
                    <Ico name="upload" />
                    <span className="sp-sr">Replace {s.title}</span>
                  </label>
                ) : null}
                <button type="button" className="sp-sbtn" title="Remove" aria-label={`Remove ${s.title}`} onClick={() => remove(s.key)}>
                  <Ico name="x" />
                </button>
              </span>
              {input}
            </div>
          );
        })}
      </div>
      <div className="sp-slot-foot">
        <button type="button" className="sp-btn sp-btn-sec sp-btn-sm" onClick={addSlot} disabled={slots.length >= MAX_PHOTOS}>
          <Ico name="plus" />
          Add more photos
        </button>
        <span className="sp-help" aria-live="polite">
          {done} of {slots.length} photos added
        </span>
      </div>
      <div className="sp-urlrow">
        <label className="sp-sr" htmlFor="sp-iurl">
          Image link
        </label>
        <input
          id="sp-iurl"
          className="sp-inp"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addLink();
            }
          }}
          placeholder={uploads ? "Or paste an image link (https://…)" : "Paste an image link (https://…)"}
        />
        <button className="sp-btn sp-btn-sec" type="button" onClick={addLink}>
          Add link
        </button>
      </div>
    </>
  );
}
