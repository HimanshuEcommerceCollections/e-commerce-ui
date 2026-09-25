"use client";

import React, { useState } from "react";
import { DayloraSvgSprite } from "./DayloraIcons";
import { DayloraAnnouncementBar } from "./DayloraAnnouncement";
import { DayloraHeader } from "./DayloraHeader";
import { DayloraHero } from "./DayloraHero";
import { DayloraCategories } from "./DayloraCategories";
import { DayloraProductRail } from "./DayloraProductRail";
import { DayloraReviews } from "./DayloraReviews";
import { DayloraTrust } from "./DayloraTrust";
import { DayloraFooter } from "./DayloraFooter";
import { DayloraReviewTools } from "./DayloraReviewTools";
import {
  FEATURED_PRODUCTS,
  DEALS_PRODUCTS,
  NEW_ARRIVALS,
} from "./dayloraData";

export function DayloraHomePage() {
  const [cartCount, setCartCount] = useState(0);

  const handleAddToCart = () => {
    setCartCount((prev) => prev + 1);
  };

  return (
    <>
      <DayloraSvgSprite />
      <a className="skip" href="#main">
        Skip to content
      </a>

      {/* 1. ANNOUNCEMENT BAR */}
      <DayloraAnnouncementBar />

      {/* 2. HEADER & NAVIGATION */}
      <DayloraHeader cartCount={cartCount} />

      <main id="main">
        {/* 3. HERO BANNER */}
        <DayloraHero />

        {/* 4. SHOP BY CATEGORY */}
        <DayloraCategories />

        {/* 5. FEATURED PRODUCTS */}
        <DayloraProductRail
          title="Featured products"
          subtitle="Hand-picked favorites from every aisle"
          products={FEATURED_PRODUCTS}
          dataNote="FR-ST-01 · Featured products"
          onAddToCart={handleAddToCart}
        />

        {/* 6. DEALS */}
        <DayloraProductRail
          id="deals"
          eyebrow="Limited time"
          title="Deals of the week"
          viewAllText="View all deals"
          products={DEALS_PRODUCTS}
          isDeal={true}
          isBand={true}
          dataNote="FR-ST-01 · Deals (price vs. was-price only — no promo engine in P0)"
          onAddToCart={handleAddToCart}
        />

        {/* 7. NEW ARRIVALS */}
        <DayloraProductRail
          id="new"
          title="New arrivals"
          subtitle="Just added to the store"
          products={NEW_ARRIVALS}
          dataNote="FR-ST-01 · New arrivals"
          onAddToCart={handleAddToCart}
        />

        {/* CUSTOMER REVIEWS (P1) */}
        <DayloraReviews />

        {/* 9. TRUST & SERVICE */}
        <DayloraTrust />
      </main>

      {/* 10. FOOTER */}
      <DayloraFooter />

      {/* REVIEW TOOLS */}
      <DayloraReviewTools />
    </>
  );
}
