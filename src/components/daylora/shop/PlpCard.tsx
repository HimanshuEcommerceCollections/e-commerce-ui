"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DayloraIcon } from "../DayloraIcons";
import { CardRating } from "../DayloraRating";
import { SaveHeart } from "../DayloraSaveHeart";
import { colorHex, usd } from "./catalog";
import { DEPT_TINT, TYPE_ICON, itemToCard, type PlpItem } from "./plpModel";
import type { CardModel } from "./storefrontCards";

/** Listing card (design pcard): photo or icon, badge, heart, brand, name, rating, price, stock, colour swatches. */
export function PlpCard({
  c: card,
  x,
  colors,
  delay,
}: {
  c?: CardModel;
  /** Legacy input; prefer `c`. */
  x?: PlpItem;
  colors: Set<string> | null;
  delay: number;
}) {
  const c = card ?? itemToCard(x!);
  // With a colour filter on, show that colour's photo and open the PDP on it.
  const picked = colors ? c.colors.find((x) => colors.has(x.name)) : undefined;
  const href = picked ? `${c.href}?color=${encodeURIComponent(picked.name)}` : c.href;
  const image = picked?.imageUrl ?? c.image;
  const [failed, setFailed] = useState<string | null>(null);
  const showImg = !!image && failed !== image;
  const out = c.stockState === "out";
  const c0 = c.colors[0];
  const swatch = (x: CardModel["colors"][number]) => x.hex || colorHex(x.name);
  const bg = showImg
    ? undefined
    : c0
      ? `color-mix(in srgb, ${swatch(c0)} 18%, #F4F6F8)`
      : DEPT_TINT[c.departmentSlug ?? ""] ?? "#EEF1F4";
  const icon = (c.productType && TYPE_ICON[c.productType]) || c.icon;
  const sw = c.colors.length > 1 ? c.colors : [];
  const fromPrice = c.maxPrice > c.price;

  return (
    <article className={`pcard${out ? " is-out" : ""}`} style={{ "--d": `${delay}ms` } as React.CSSProperties}>
      <div className="p-media" style={bg ? { background: bg } : undefined}>
        <DayloraIcon name={icon} className="icon p-ph" />
        {showImg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="media-img" src={image!} alt="" loading="lazy" onError={() => setFailed(image)} />
        )}
        {c.isNew ? (
          <span className="badge badge-new">New</span>
        ) : c.savePct ? (
          <span className="badge badge-sale">Save {c.savePct}%</span>
        ) : null}
        {out && <span className="oos">Out of stock</span>}
      </div>
      <SaveHeart productId={c.skuId} name={c.name} />
      <div
        className="p-sw"
        {...(sw.length ? { "aria-label": `${sw.length} colors: ${sw.map((x) => x.name).join(", ")}` } : { "aria-hidden": true })}
      >
        {sw.slice(0, 4).map((col) => (
          <i key={col.name} style={{ background: swatch(col) }} title={col.name} />
        ))}
        {sw.length > 4 && `+${sw.length - 4}`}
      </div>
      {c.brand && <span className="brand">{c.brand}</span>}
      <Link href={href} className="p-name">
        {c.name}
      </Link>
      <CardRating avg={c.ratingAvg} count={c.ratingCount} />
      <div className="price-row">
        <span className="price">
          {fromPrice && <span className="sr-only">From </span>}
          {usd(c.price)}
        </span>
        {c.was && (
          <span className="was">
            <span className="sr-only">Was </span>
            {usd(c.was)}
          </span>
        )}
      </div>
      {c.savePct > 0 && <span className="save">Save {c.savePct}%</span>}
      {out ? (
        <span className="stock out">Out of stock</span>
      ) : c.stockState === "low" ? (
        <span className="stock low">{c.stockLabel}</span>
      ) : null}
    </article>
  );
}
