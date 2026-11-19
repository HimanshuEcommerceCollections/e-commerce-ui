"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { DayloraIcon } from "./DayloraIcons";
import { usd } from "./shop/catalog";
import { catalogHref } from "./shop/departments";
import type { CardModel } from "./shop/storefrontCards";

/** Name on the price tag, without the pack or size suffix: "Cookware Set, 10-Piece" → "Cookware Set". */
const tagName = (name: string) => name.replace(/,.*$/, "");

/** Tiles in the bento: the shoppable product, deals, new arrivals. */
const TILES = 3;

interface DayloraHeroProps {
  /** The shoppable product on the main tile; null while loading or when the catalog has none. */
  product: CardModel | null;
  /** Biggest saving across deals, for the promo pill ("Up to 50% off"). */
  maxDealPct: number;
  loading: boolean;
}

/** Hero (FR-ST-01): one message, one primary CTA, shoppable photo bento. */
export function DayloraHero({ product, maxDealPct, loading }: DayloraHeroProps) {
  const [imgFailed, setImgFailed] = useState(false);
  // Phones swipe the bento as banners (CSS); the dots follow the visible one.
  const bentoRef = useRef<HTMLDivElement>(null);
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    const el = bentoRef.current;
    if (!el) return;
    let frame = 0;
    const paint = () => {
      const first = el.firstElementChild as HTMLElement | null;
      const step = (first?.offsetWidth || el.clientWidth) + 12;
      setSlide(Math.min(Math.round(el.scrollLeft / step), TILES - 1));
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(paint);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", onScroll);
    };
  }, []);
  // The house photo stands in only when the catalog has no featured photo to show.
  const mainImage = loading ? null : product?.image && !imgFailed ? product.image : "/daylora/hero.jpg";

  return (
    <section className="hero" data-note="FR-ST-01 · Hero banner (static · 1 message · 1 primary CTA)">
      <div className="daylora-container">
        <div className="hero-wrap">
          <div className="hero-copy">
            <span className="t-eyebrow">Fall favorites are here</span>
            <h1 className="t-display">
              Everything you need, <em>every day.</em>
            </h1>
            <p>Over 1,000 everyday essentials — from headphones to cookware — at prices that make sense.</p>
            <div className="hero-ctas">
              <Link href="/catalog" className="btn btn-primary">
                Start shopping
              </Link>
            </div>
          </div>

          <div className="bento" ref={bentoRef}>
            <Link
              href={product?.href ?? "/catalog"}
              className="tile tile-main"
              aria-label={product ? `${product.name}, ${usd(product.price)}` : "Shop the catalog"}
            >
              <DayloraIcon name={product?.icon ?? "audio"} />
              {mainImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="media-img" src={mainImage} alt="" onError={() => setImgFailed(true)} />
              )}
              {product && (
                <span className="tag">
                  <span className="tag-dot" aria-hidden="true">
                    <DayloraIcon name="cart" />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <b>{tagName(product.name)}</b>
                    <span>
                      {usd(product.price)}
                      {product.was && <s>{usd(product.was)}</s>}
                    </span>
                  </span>
                </span>
              )}
            </Link>

            <Link href={catalogHref({ deals: true })} className="tile tile-promo tile-deals">
              <DayloraIcon name="tag" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="media-img" src="/daylora/promo-deals.jpg" alt="" />
              <span className="tile-body">
                <span className="pill">{maxDealPct > 0 ? `Up to ${maxDealPct}% off` : "Daily deals"}</span>
                <strong>Deals of the day</strong>
                <span className="link">
                  Shop deals <DayloraIcon name="arrow" />
                </span>
              </span>
            </Link>

            <Link href={catalogHref({ new: true })} className="tile tile-promo tile-new">
              <DayloraIcon name="spark" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="media-img" src="/daylora/promo-new.jpg" alt="" />
              <span className="tile-body">
                <span className="pill">Just in</span>
                <strong>New arrivals</strong>
                <span className="link">
                  Explore new <DayloraIcon name="arrow" />
                </span>
              </span>
            </Link>
          </div>
          <div className="hero-dots" aria-hidden="true">
            {Array.from({ length: TILES }, (_, i) => (
              <i key={i} className={i === slide ? "on" : undefined} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
