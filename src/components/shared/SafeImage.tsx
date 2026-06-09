"use client";
import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { ImageOff } from "lucide-react";

type SafeImageProps = Omit<ImageProps, "src"> & { src?: string };

/**
 * next/image wrapper that renders a neutral placeholder instead of a broken box
 * when the image is missing (empty/undefined src) or fails to load. An empty src
 * skips next/image entirely, so it makes no request and logs no optimizer 404.
 * Fills its container — use inside a sized, position:relative wrapper (like `fill`).
 */
export default function SafeImage({ src, alt, ...props }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400"
      >
        <ImageOff size={28} />
      </div>
    );
  }

  return <Image src={src} alt={alt} {...props} onError={() => setFailed(true)} />;
}
