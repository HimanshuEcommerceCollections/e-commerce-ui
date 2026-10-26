import React from "react";
import { ratingLabel } from "./shop/storefrontCards";

/** Star bar filled to the average (the .stars mask in daylora.css). */
export function Stars({ avg, label }: { avg: number; label?: string }) {
  const style = { "--pct": `${Math.max(0, Math.min(5, avg)) * 20}%` } as React.CSSProperties;
  return label ? (
    <span className="stars" style={style} role="img" aria-label={label} />
  ) : (
    <span className="stars" style={style} aria-hidden="true" />
  );
}

/** Card rating row: stars, average and "(count)"; nothing until a product has reviews. */
export function CardRating({ avg, count }: { avg: number; count: number }) {
  if (!count) return null;
  return (
    <span className="rating" role="img" aria-label={ratingLabel(avg, count)}>
      <Stars avg={avg} />
      <b aria-hidden="true">{avg.toFixed(1)}</b>
      <span aria-hidden="true">({count})</span>
    </span>
  );
}
