"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import publicProductService from "@/services/public/product.service";
import type { FeaturedReview } from "@/types/api/product.types";
import { DayloraIcon } from "./DayloraIcons";
import { Stars } from "./DayloraRating";

interface Featured {
  reviews: FeaturedReview[];
  average: number;
  count: number;
}

/** GET /api/reviews/featured, as a list or as { reviews, average, count }. */
function normalize(data: unknown): Featured {
  if (Array.isArray(data)) {
    const reviews = data as FeaturedReview[];
    const avg = reviews.length ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length : 0;
    return { reviews, average: avg, count: reviews.length };
  }
  const d = (data ?? {}) as Partial<Featured> & { items?: FeaturedReview[] };
  return { reviews: d.reviews ?? d.items ?? [], average: Number(d.average ?? 0), count: d.count ?? 0 };
}

/** "What our customers say" (design 01): recent 4–5★ published reviews; hidden until there are any. */
export function DayloraReviews() {
  const [data, setData] = useState<Featured | null>(null);
  useEffect(() => {
    let live = true;
    publicProductService
      .getFeaturedReviews(3)
      .then((res) => live && setData(normalize(res.data.data)))
      .catch(() => live && setData(null));
    return () => {
      live = false;
    };
  }, []);

  if (!data || !data.reviews.length) return null;
  const avg = data.average;
  return (
    <section className="section reviews" data-note="C6 · Customer reviews">
      <div className="daylora-container">
        <div className="section-head">
          <div>
            <div className="rev-head">
              <h2 className="t-h2">What our customers say</h2>
            </div>
            <p>Real reviews from verified buyers</p>
          </div>
          {data.count > 0 && avg > 0 && (
            <div className="rev-summary">
              <Stars avg={avg} />
              <b>{avg.toFixed(1)}</b>
              <span>average rating</span>
            </div>
          )}
        </div>
        <div className="rail rev-grid">
          {data.reviews.map((r) => (
            <article className="rev" key={r.id}>
              <span className="rating" role="img" aria-label={`Rated ${r.rating} out of 5`}>
                <Stars avg={r.rating} />
              </span>
              <q>{r.title ? `${r.title}. ${r.body}` : r.body}</q>
              <div className="rev-who">
                {r.imageUrl && (
                  <span className="rev-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="media-img" src={r.imageUrl} alt="" loading="lazy" />
                  </span>
                )}
                <div>
                  <strong>{[r.author, r.location].filter(Boolean).join(" · ")}</strong>
                  <span>
                    Bought:{" "}
                    {r.productSlug ? <Link href={`/product/${r.productSlug}`}>{r.productName}</Link> : r.productName}
                  </span>
                  {r.verifiedBuyer !== false && (
                    <span className="verified">
                      <DayloraIcon name="shield" />
                      Verified buyer
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
