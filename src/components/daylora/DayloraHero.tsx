import React from "react";
import Link from "next/link";
import { DayloraIcon } from "./DayloraIcons";

export function DayloraHero() {
  return (
    <section
      className="hero"
      data-note="FR-ST-01 · Hero banner (static · 1 message · 1 primary CTA)"
    >
      <div className="daylora-container">
        <div className="hero-wrap">
          <div className="hero-copy">
            <span className="t-eyebrow">Fall favorites are here</span>
            <h1 className="t-display">
              Everything you need, <em>every day.</em>
            </h1>
            <p>
              Over 1,000 everyday essentials — from headphones to cookware — at
              prices that make sense.
            </p>
            <div className="hero-ctas">
              <Link href="/catalog" className="btn btn-primary">
                Start shopping
              </Link>
            </div>
          </div>
          <div className="bento">
            <Link
              href="/catalog?category=electronics"
              className="tile tile-main"
              aria-label="Wireless Headphones Pro, $149.99"
            >
              <DayloraIcon name="audio" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="media-img"
                src="/daylora/hero.jpg"
                alt="Wireless Headphones Pro"
              />
              <span className="tag">
                <span className="tag-dot" aria-hidden="true">
                  <DayloraIcon name="cart" />
                </span>
                <span style={{ minWidth: 0 }}>
                  <b>Headphones Pro</b>
                  <span>
                    $149.99<s>$199.99</s>
                  </span>
                </span>
              </span>
            </Link>

            <a href="#deals" className="tile tile-promo tile-deals">
              <DayloraIcon name="tag" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="media-img"
                src="/daylora/promo-deals.jpg"
                alt="Deals of the week"
              />
              <span className="tile-body">
                <span className="pill">Up to 50% off</span>
                <strong>Deals of the week</strong>
                <span className="link">
                  Shop deals <DayloraIcon name="arrow" />
                </span>
              </span>
            </a>

            <a href="#new" className="tile tile-promo tile-new">
              <DayloraIcon name="spark" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="media-img"
                src="/daylora/promo-new.jpg"
                alt="New arrivals"
              />
              <span className="tile-body">
                <span className="pill">Just in</span>
                <strong>New arrivals</strong>
                <span className="link">
                  Explore new <DayloraIcon name="arrow" />
                </span>
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
