"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DayloraIcon } from "./DayloraIcons";
import { ProductItem, LOW_STOCK_THRESHOLD, RATINGS_MAP } from "./dayloraData";

interface DayloraProductCardProps {
  product: ProductItem;
  isDeal?: boolean;
  onAddToCart?: (p: ProductItem) => void;
}

export function DayloraProductCard({
  product,
  isDeal = false,
  onAddToCart,
}: DayloraProductCardProps) {
  const [added, setAdded] = useState(false);

  const save = product.wasPrice
    ? Math.round(((product.wasPrice - product.price) / product.wasPrice) * 100)
    : 0;

  const isOut = product.stock === 0;
  const isLow = !isOut && product.stock <= LOW_STOCK_THRESHOLD;

  const ratingInfo = RATINGS_MAP[product.imgKey];

  const handleAdd = () => {
    if (isOut) return;
    setAdded(true);
    if (onAddToCart) onAddToCart(product);
    setTimeout(() => {
      setAdded(false);
    }, 1400);
  };

  const formattedPrice = "$" + product.price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedWasPrice = product.wasPrice
    ? "$" + product.wasPrice.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : null;

  const formattedSavings = product.wasPrice
    ? "$" + (product.wasPrice - product.price).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : null;

  return (
    <article className={`card ${isOut ? "is-out" : ""}`}>
      <Link
        href={product.href || `/catalog?product=${encodeURIComponent(product.id)}`}
        className="card-media"
        aria-label={product.name}
      >
        <DayloraIcon name={product.icon} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="media-img"
          src={`/daylora/${product.imgKey}.jpg`}
          alt={product.name}
          loading="lazy"
        />
        {product.badge ? (
          <span className="badge badge-new">{product.badge}</span>
        ) : isDeal && save > 0 ? (
          <span className="badge badge-sale">Save {save}%</span>
        ) : null}
      </Link>

      <div className="card-body">
        <span className="brand">{product.brand}</span>
        <Link
          href={product.href || `/catalog?product=${encodeURIComponent(product.id)}`}
          className="name"
        >
          {product.name}
        </Link>
        <span className="variant">{product.variant}</span>

        {ratingInfo && (
          <div
            className="rating"
            aria-label={`Rated ${ratingInfo[0]} out of 5, ${ratingInfo[1]} reviews`}
          >
            <span
              className="stars"
              style={{ ["--pct" as string]: `${(ratingInfo[0] / 5) * 100}%` }}
              aria-hidden="true"
            />
            <b aria-hidden="true">{ratingInfo[0].toFixed(1)}</b>
            <span aria-hidden="true">({ratingInfo[1]})</span>
          </div>
        )}

        <div className="price-row">
          <span className="price">{formattedPrice}</span>
          {formattedWasPrice && (
            <span className="was">
              <span className="sr-only">Was </span>
              {formattedWasPrice}
            </span>
          )}
        </div>

        {save > 0 && !isDeal && (
          <span className="save">Save {save}%</span>
        )}
        {save > 0 && isDeal && formattedSavings && (
          <span className="save">You save {formattedSavings}</span>
        )}

        <span
          className={`stock ${isOut ? "out" : isLow ? "low" : "in"}`}
        >
          {isOut
            ? "Out of stock"
            : isLow
            ? `Only ${product.stock} left`
            : "In stock"}
        </span>

        <button
          className={`add ${added ? "added" : ""}`}
          disabled={isOut}
          onClick={handleAdd}
          aria-label={isOut ? "Out of stock" : `Add ${product.name} to cart`}
        >
          {isOut ? "Out of stock" : added ? "Added ✓" : "Add to cart"}
        </button>
      </div>
    </article>
  );
}
