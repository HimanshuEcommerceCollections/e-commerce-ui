"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { getApiErrorMessage } from "@/lib/apiError";
import { track } from "@/lib/analytics";
import { DayloraIcon } from "./DayloraIcons";
import { DayloraHero } from "./DayloraHero";
import { DayloraCategories } from "./DayloraCategories";
import { DayloraProductRail } from "./DayloraProductRail";
import { DayloraDeals } from "./DayloraDeals";
import { DayloraTrust } from "./DayloraTrust";
import type { AddToCart } from "./DayloraProductCard";
import type { ListingProduct } from "./shop/catalog";
import { catalogHref, deptIcon, useDepartments } from "./shop/departments";
import { bestDiscount, loadStorefrontCatalog, toCardModel } from "./shop/storefrontCatalog";

const FEATURED_SIZE = 5;
const DEALS_SIZE = 3;
const NEW_SIZE = 6;

const iconOf = (p: ListingProduct) => deptIcon(p.variants[0]?.categorySlug);

/**
 * Featured: products staff flagged as featured, best sellers first; topped up
 * with the store's best sellers when fewer than five are flagged.
 */
function pickFeatured(all: ListingProduct[]): ListingProduct[] {
  const inStock = all.filter((p) => p.stock > 0);
  const byPop = (a: ListingProduct, b: ListingProduct) => b.popularity - a.popularity || a.rank - b.rank;
  const flagged = inStock.filter((p) => p.featured).sort(byPop).slice(0, FEATURED_SIZE);
  if (flagged.length >= FEATURED_SIZE) return flagged;
  const rest = inStock.filter((p) => !p.featured).sort(byPop);
  return [...flagged, ...rest].slice(0, FEATURED_SIZE);
}

/** Homepage content (FR-ST-01); the shell (header, nav, footer) comes from the storefront layout. */
export function DayloraHomePage() {
  const departments = useDepartments();
  const addToCart = useCartStore((s) => s.add);
  const [products, setProducts] = useState<ListingProduct[] | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    let live = true;
    loadStorefrontCatalog()
      .then((all) => live && setProducts(all))
      .catch(() => live && setProducts([]));
    return () => {
      live = false;
      clearTimeout(toastTimer.current);
    };
  }, []);

  const rails = useMemo(() => {
    const all = products ?? [];
    const featured = pickFeatured(all);
    const onSale = all.filter((p) => p.onSale && p.stock > 0).sort((a, b) => bestDiscount(b) - bestDiscount(a));
    const fresh = [...all].sort((a, b) => b.createdAt - a.createdAt).slice(0, NEW_SIZE);
    const heroPick = featured.find((p) => p.image && p.onSale) ?? featured.find((p) => p.image) ?? null;
    return {
      hero: heroPick ? toCardModel(heroPick, iconOf(heroPick)) : null,
      maxDealPct: onSale.length ? Math.round(bestDiscount(onSale[0]) * 100) : 0,
      featured: featured.map((p) => toCardModel(p, iconOf(p))),
      deals: onSale.slice(0, DEALS_SIZE).map((p) => toCardModel(p, iconOf(p), { dealPrice: true })),
      fresh: fresh.map((p) => toCardModel(p, iconOf(p))),
    };
  }, [products]);
  const loading = products === null;

  const showToast = (ok: boolean, text: string) => {
    setToast({ ok, text });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  /** Single-SKU cards add straight to the cart, for guests and customers alike (FR-ST-09). */
  const onAdd: AddToCart = useCallback(
    async (p) => {
      try {
        await addToCart(p.skuId, 1);
        track("ADD_TO_CART", { productId: p.skuId, value: p.price, currency: "USD", properties: { source: "home" } });
        showToast(true, p.name);
        return true;
      } catch (e) {
        showToast(false, getApiErrorMessage(e, "We couldn't add that to your cart. Please try again."));
        return false;
      }
    },
    [addToCart],
  );

  return (
    <main id="main">
      {/* 3. HERO BANNER */}
      <DayloraHero product={rails.hero} maxDealPct={rails.maxDealPct} loading={loading} />

      {/* 4. SHOP BY DEPARTMENT */}
      <DayloraCategories departments={departments} />

      {/* 5. FEATURED PRODUCTS */}
      <DayloraProductRail
        title="Featured products"
        subtitle="Hand-picked favorites from every aisle"
        viewAllHref={catalogHref({ sort: "pop" })}
        products={rails.featured}
        loading={loading}
        emptyText="Featured products will appear here soon."
        variant="feat"
        dataNote="FR-ST-01 · Featured products"
        onAdd={onAdd}
      />

      {/* 6. DEALS OF THE DAY — only when some price is below its MRP */}
      {(loading || rails.deals.length > 0) && <DayloraDeals deals={rails.deals} loading={loading} onAdd={onAdd} />}

      {/* 7. NEW ARRIVALS */}
      <DayloraProductRail
        id="new"
        title="New arrivals"
        subtitle="Just added to the store"
        viewAllHref={catalogHref({ new: true })}
        products={rails.fresh}
        loading={loading}
        emptyText="New products are on their way. Check back soon."
        showNew
        dataNote="FR-ST-01 · New arrivals"
        onAdd={onAdd}
      />

      {/* 9. TRUST & SERVICE */}
      <DayloraTrust />

      {/* Add-to-cart confirmation */}
      <div className={`toast${toast ? " show" : ""}`} role="status" aria-live="polite">
        <DayloraIcon name={toast?.ok === false ? "alert" : "check"} />
        <p>
          {toast &&
            (toast.ok ? (
              <>
                <b>Added to cart</b>
                <br />
                {toast.text}
              </>
            ) : (
              toast.text
            ))}
        </p>
        {toast?.ok !== false && <Link href="/cart" tabIndex={toast ? 0 : -1}>View cart</Link>}
      </div>
    </main>
  );
}
