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
import { DayloraReviews } from "./DayloraReviews";
import type { AddToCart } from "./DayloraProductCard";
import { catalogHref, useDepartments } from "./shop/departments";
import { NEW_ARRIVALS, searchProducts, toCard, type CardModel } from "./shop/storefrontCards";

const FEATURED_SIZE = 5;
const DEALS_SIZE = 3;
const NEW_SIZE = 6;

interface Rails {
  featured: CardModel[];
  deals: CardModel[];
  fresh: CardModel[];
}

const none = () => ({ items: [] as never[] });

/**
 * The homepage rails, each one small server query (CONTRACT A1).
 * Featured: staff-flagged products, best sellers first, topped up with the
 * store's best sellers when fewer than five are flagged. Deals: biggest saving
 * first. New arrivals: the same rule as /catalog?new=1.
 */
async function loadRails(): Promise<Rails> {
  const [flagged, deals, fresh] = await Promise.all([
    searchProducts({ featured: 1, inStock: 1, sort: "pop", pageSize: FEATURED_SIZE }).catch(none),
    searchProducts({ onSale: 1, inStock: 1, sort: "discount", pageSize: DEALS_SIZE }).catch(none),
    searchProducts({ ...NEW_ARRIVALS, pageSize: NEW_SIZE }).catch(none),
  ]);
  let featured = flagged.items;
  if (featured.length < FEATURED_SIZE) {
    const top = await searchProducts({
      inStock: 1,
      sort: "pop",
      pageSize: FEATURED_SIZE,
      exclude: featured.map((p) => p.parentId),
    }).catch(none);
    featured = [...featured, ...top.items].slice(0, FEATURED_SIZE);
  }
  return { featured: featured.map(toCard), deals: deals.items.map(toCard), fresh: fresh.items.map(toCard) };
}

/** Homepage content (FR-ST-01); the shell (header, nav, footer) comes from the storefront layout. */
export function DayloraHomePage() {
  const departments = useDepartments();
  const addToCart = useCartStore((s) => s.add);
  const [data, setData] = useState<Rails | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    let live = true;
    loadRails()
      .then((r) => live && setData(r))
      .catch(() => live && setData({ featured: [], deals: [], fresh: [] }));
    return () => {
      live = false;
      clearTimeout(toastTimer.current);
    };
  }, []);

  const rails = useMemo(() => {
    const featured = data?.featured ?? [];
    const deals = data?.deals ?? [];
    return {
      hero: featured.find((p) => p.image && p.was) ?? featured.find((p) => p.image) ?? null,
      maxDealPct: deals[0]?.savePct ?? 0,
      featured,
      deals,
      fresh: data?.fresh ?? [],
    };
  }, [data]);
  const loading = data === null;

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

      {/* 8. WHAT OUR CUSTOMERS SAY — only once there are published reviews */}
      <DayloraReviews />

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
