"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DayloraIcon } from "../DayloraIcons";
import { colorHex, usd } from "./catalog";
import { deptIcon } from "./departments";
import { DEPT_TINT, TYPE_ICON, type PlpItem } from "./plpModel";

/** Listing card (design pcard): photo or icon, badge, brand, name, price, stock, colour swatches. */
export function PlpCard({ x, colors, delay }: { x: PlpItem; colors: Set<string> | null; delay: number }) {
  const c = x.card;
  // With a colour filter on, show and link the variant in that colour.
  const v = colors
    ? x.p.variants.find((s) => s.color && colors.has(s.color) && s.stockQuantity > 0) ??
      x.p.variants.find((s) => s.color && colors.has(s.color))
    : undefined;
  const href = v ? `/product/${v.urlSlug ?? v.id}` : c.href;
  const image = v?.primaryImageUrl ?? c.image;
  const [failed, setFailed] = useState<string | null>(null);
  const showImg = !!image && failed !== image;
  const out = c.stockState === "out";
  const c0 = x.p.colors[0];
  const bg = showImg
    ? undefined
    : c0
      ? `color-mix(in srgb, ${colorHex(c0)} 18%, #F4F6F8)`
      : DEPT_TINT[x.dept ?? ""] ?? "#EEF1F4";
  const icon = (x.type && TYPE_ICON[x.type]) || deptIcon(x.dept);
  const sw = x.p.colors.length > 1 ? x.p.colors : [];
  const fromPrice = x.prices.length > 1;

  return (
    <article className={`pcard${out ? " is-out" : ""}`} style={{ "--d": `${delay}ms` } as React.CSSProperties}>
      <div className="p-media" style={bg ? { background: bg } : undefined}>
        <DayloraIcon name={icon} className="icon p-ph" />
        {showImg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="media-img" src={image!} alt="" loading="lazy" onError={() => setFailed(image)} />
        )}
        {x.isNew ? (
          <span className="badge badge-new">New</span>
        ) : c.savePct ? (
          <span className="badge badge-sale">Save {c.savePct}%</span>
        ) : null}
        {out && <span className="oos">Out of stock</span>}
      </div>
      <div
        className="p-sw"
        {...(sw.length ? { "aria-label": `${sw.length} colors: ${sw.join(", ")}` } : { "aria-hidden": true })}
      >
        {sw.slice(0, 4).map((col) => (
          <i key={col} style={{ background: colorHex(col) }} title={col} />
        ))}
        {sw.length > 4 && `+${sw.length - 4}`}
      </div>
      {x.brand && <span className="brand">{x.brand}</span>}
      <Link href={href} className="p-name">
        {x.p.name}
      </Link>
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
