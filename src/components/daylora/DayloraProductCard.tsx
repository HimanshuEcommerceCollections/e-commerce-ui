"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { DayloraIcon } from "./DayloraIcons";
import { usd } from "./shop/catalog";
import type { CardModel } from "./shop/storefrontCatalog";

/** Resolves true when the item went into the cart. */
export type AddToCart = (p: CardModel) => Promise<boolean>;

/**
 * The card's call to action (FR-ST-13): out of stock is disabled, products
 * with several variants go to the PDP to choose, single-SKU products add
 * straight to the cart.
 */
export function CardAction({ product, onAdd }: { product: CardModel; onAdd: AddToCart }) {
  const [state, setState] = useState<"idle" | "adding" | "added">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);

  if (product.stockState === "out") {
    return (
      <button className="add" disabled aria-label={`${product.name} is out of stock`}>
        Out of stock
      </button>
    );
  }
  if (product.variantCount > 1) {
    return (
      <Link
        href={product.href}
        className="add"
        style={{ display: "grid", placeItems: "center" }}
        aria-label={`${product.chooseLabel} for ${product.name}`}
      >
        {product.chooseLabel}
      </Link>
    );
  }
  const add = async () => {
    if (state !== "idle") return;
    setState("adding");
    const ok = await onAdd(product);
    if (!ok) {
      setState("idle");
      return;
    }
    setState("added");
    timer.current = setTimeout(() => setState("idle"), 1400);
  };
  return (
    <button
      className={`add${state === "added" ? " added" : ""}`}
      onClick={add}
      aria-busy={state === "adding"}
      aria-label={`Add ${product.name} to cart`}
    >
      {state === "added" ? "Added ✓" : state === "adding" ? "Adding…" : "Add to cart"}
    </button>
  );
}

function Media({ product }: { product: CardModel }) {
  const [failed, setFailed] = useState(false);
  return (
    <>
      <DayloraIcon name={product.icon} />
      {product.image && !failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="media-img" src={product.image} alt={product.name} loading="lazy" onError={() => setFailed(true)} />
      )}
    </>
  );
}

interface DayloraProductCardProps {
  product: CardModel;
  onAdd: AddToCart;
  /** Show the "New" badge (new arrivals rail). */
  showNew?: boolean;
}

/** Rail card: brand, name, variant summary, price/was/save, stock line, action. */
export function DayloraProductCard({ product, onAdd, showNew = false }: DayloraProductCardProps) {
  const isOut = product.stockState === "out";
  return (
    <article className={`card${isOut ? " is-out" : ""}`}>
      <Link href={product.href} className="card-media" aria-label={product.name} tabIndex={-1}>
        <Media product={product} />
        {showNew && product.isNew ? <span className="badge badge-new">New</span> : null}
      </Link>
      <div className="card-body">
        {product.brand && <span className="brand">{product.brand}</span>}
        <Link href={product.href} className="name">
          {product.name}
        </Link>
        {product.variant && <span className="variant">{product.variant}</span>}
        <div className="price-row">
          <span className="price">
            {product.variantCount > 1 && <span className="sr-only">From </span>}
            {usd(product.price)}
          </span>
          {product.was && (
            <span className="was">
              <span className="sr-only">Was </span>
              {usd(product.was)}
            </span>
          )}
        </div>
        {product.savePct > 0 && <span className="save">Save {product.savePct}%</span>}
        <span className={`stock ${product.stockState}`}>{product.stockLabel}</span>
        <CardAction product={product} onAdd={onAdd} />
      </div>
    </article>
  );
}

/** Deals of the day card: wide photo, discount badge, big sale price (design v2). */
export function DayloraDealCard({ product, onAdd }: { product: CardModel; onAdd: AddToCart }) {
  const isOut = product.stockState === "out";
  return (
    <article className={`deal${isOut ? " is-out" : ""}`}>
      <Link href={product.href} className="d-media" aria-label={product.name} tabIndex={-1}>
        <Media product={product} />
        {product.savePct > 0 && <span className="d-badge">{product.savePct}% off</span>}
      </Link>
      <div className="d-body">
        {product.brand && <span className="brand">{product.brand}</span>}
        <Link href={product.href} className="name">
          {product.name}
        </Link>
        <div className="d-price">
          <span className="price">{usd(product.price)}</span>
          {product.was && (
            <span className="was">
              <span className="sr-only">Was </span>
              {usd(product.was)}
            </span>
          )}
        </div>
        {product.was && <span className="save">You save {usd(product.was - product.price)}</span>}
        {product.stockState === "low" && <span className="stock low">{product.stockLabel}</span>}
        <CardAction product={product} onAdd={onAdd} />
      </div>
    </article>
  );
}
