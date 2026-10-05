"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { useCartStore } from "@/store/useCartStore";
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
import { CATEGORIES, type ProductItem } from "./dayloraData";
import { groupByParent, loadAllSkus, type ListingProduct } from "./shop/catalog";
import { subcategoryOf } from "./shop/taxonomy";

const RAIL_SIZE = 6;

function toCard(p: ListingProduct): ProductItem {
  const lead = p.variants.find((v) => v.id === p.leadId) ?? p.variants[0];
  const variant =
    p.variants.length > 1
      ? [p.colors.length > 1 && `${p.colors.length} colors`, p.sizes.length > 1 && `${p.sizes.length} sizes`]
          .filter(Boolean)
          .join(" · ") || `${p.variants.length} options`
      : lead.variantName ?? [lead.color, lead.size].filter(Boolean).join(" · ");
  return {
    id: p.parentId,
    brand: p.brand ?? "",
    name: p.name,
    variant,
    price: p.minPrice,
    // FR-AD-05: MRP struck through when the price is below it.
    wasPrice: p.mrp,
    stock: p.stock,
    icon: CATEGORIES.find((c) => c.name === p.category || c.shortName === p.category)?.icon ?? "shirt",
    imgKey: "",
    imageUrl: p.image,
    badge: p.isNew ? "New" : null,
    href: p.href,
    skuId: lead.id,
    variantCount: p.variants.length,
  };
}

/**
 * Featured: products staff flagged as featured first (admin), then in-stock
 * products taking turns across subcategories so every aisle shows.
 */
function pickFeatured(products: ListingProduct[]): ListingProduct[] {
  const flagged = products.filter((x) => x.featured && x.stock > 0).slice(0, RAIL_SIZE);
  if (flagged.length >= RAIL_SIZE) return flagged;
  const groups = new Map<string, ListingProduct[]>();
  for (const p of products.filter((x) => x.stock > 0 && !x.featured)) {
    const key = p.subcategory ?? subcategoryOf(p.code)?.key ?? p.category ?? "";
    groups.set(key, [...(groups.get(key) ?? []), p]);
  }
  const lists = Array.from(groups.values());
  const out: ListingProduct[] = [...flagged];
  for (let i = 0; out.length < RAIL_SIZE && lists.some((l) => l[i]); i++) {
    for (const l of lists) if (l[i] && out.length < RAIL_SIZE) out.push(l[i]);
  }
  return out;
}

export function DayloraHomePage() {
  const router = useRouter();
  const { addItem } = useCart();
  const cartCount = useCartStore((s) => s.cart?.totalItems ?? 0);
  const [products, setProducts] = useState<ListingProduct[] | null>(null);

  useEffect(() => {
    let live = true;
    loadAllSkus()
      .then((skus) => live && setProducts(groupByParent(skus)))
      .catch(() => live && setProducts([]));
    return () => { live = false; };
  }, []);

  const rails = useMemo(() => {
    const all = products ?? [];
    return {
      featured: pickFeatured(all).map(toCard),
      // Biggest saving first.
      deals: all
        .filter((p) => p.onSale && p.stock > 0)
        .sort((a, b) => (b.mrp! - b.minPrice) / b.mrp! - (a.mrp! - a.minPrice) / a.mrp!)
        .slice(0, RAIL_SIZE)
        .map(toCard),
      fresh: [...all].sort((a, b) => b.createdAt - a.createdAt).slice(0, RAIL_SIZE).map(toCard),
    };
  }, [products]);
  const loading = products === null;

  /** Single-SKU cards add straight to the cart; signed-out shoppers go to sign in. */
  const handleAddToCart = async (p: ProductItem) => {
    if (!p.skuId) return false;
    if (!localStorage.getItem("accessToken")) {
      router.push("/login");
      return false;
    }
    try {
      await addItem({ productId: p.skuId, quantity: 1 });
      return true;
    } catch {
      router.push(p.href ?? "/catalog");
      return false;
    }
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
        {(loading || rails.featured.length > 0) && (
          <DayloraProductRail
            title="Featured products"
            subtitle="Hand-picked favorites from every aisle"
            products={rails.featured}
            loading={loading}
            dataNote="FR-ST-01 · Featured products"
            onAddToCart={handleAddToCart}
          />
        )}

        {/* 6. DEALS — shown once the catalog carries MRP, so a price can be below it */}
        {rails.deals.length > 0 && (
          <DayloraProductRail
            id="deals"
            eyebrow="Limited time"
            title="Deals of the week"
            viewAllText="View all deals"
            viewAllHref="/catalog?deals=1"
            products={rails.deals}
            isDeal={true}
            isBand={true}
            dataNote="FR-ST-01 · Deals (price vs. was-price only — no promo engine in P0)"
            onAddToCart={handleAddToCart}
          />
        )}

        {/* 7. NEW ARRIVALS */}
        {(loading || rails.fresh.length > 0) && (
          <DayloraProductRail
            id="new"
            title="New arrivals"
            subtitle="Just added to the store"
            viewAllHref="/catalog?new=1"
            products={rails.fresh}
            loading={loading}
            dataNote="FR-ST-01 · New arrivals"
            onAddToCart={handleAddToCart}
          />
        )}

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
