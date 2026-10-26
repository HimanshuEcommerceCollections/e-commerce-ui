"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import publicProductService from "@/services/public/product.service";
import type { ProductDetailResponse, ProductVariantResponse } from "@/types/api/product.types";
import { useCartStore, MAX_LINE_QTY } from "@/store/useCartStore";
import { getApiErrorMessage } from "@/lib/apiError";
import { track } from "@/lib/analytics";
import { useStoreConfig } from "@/hooks/useStoreConfig";
import { DayloraIcon } from "../DayloraIcons";
import { Stars } from "../DayloraRating";
import { SaveHeart } from "../DayloraSaveHeart";
import { ShopIconSprite } from "./ShopIcons";
import { colorHex, compareSizes, stockState, usd } from "./catalog";
import { catalogHref } from "./departments";
import { toCard, type CardModel } from "./storefrontCards";
import { PlpCard } from "./PlpCard";
import {
  ChokingWarning,
  NutritionPanel,
  PdpReviews,
  SizeGuideTables,
  needsChokingWarning,
  packCount,
  parseNutrition,
  toSteps,
} from "./pdpExtras";

/**
 * Product detail page (design 03; FR-ST-06/07/13, NFR-04).
 *
 * The server renders it with the product already loaded (and its SEO
 * metadata). Choosing a colour, size or option updates price, images, SKU,
 * stock and the address bar in place (FR-ST-07): every variant arrives with
 * the product, so nothing is fetched or reloaded.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uniq = (vals: (string | null | undefined)[]) => Array.from(new Set(vals.filter((v): v is string => !!v)));

function addBusinessDays(from: Date, n: number) {
  const d = new Date(from);
  while (n > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() % 6) n--;
  }
  return d;
}
const fmtDay = (d: Date) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

/** Fit advice under the sizes (design copy), from the Fit attribute. */
function fitTip(fit: string | undefined, type: string | null) {
  if (fit === "Slim") return "Slim fit. Between sizes? Size up.";
  if (fit === "Regular")
    return type === "Jackets & coats" ? "Regular fit. Between sizes? Size up for layering." : "Regular fit. True to size.";
  if (fit === "Relaxed") return "Relaxed fit. Between sizes? Size down for a closer fit.";
  return null;
}

/** Return conditions by department (design). */
function returnNote(dept: string | null | undefined) {
  if (dept === "clothing") return { short: "Unworn, with tags attached", long: "Items must be unworn with tags attached." };
  if (dept === "grocery" || dept === "beauty")
    return { short: "Unopened items only", long: "For hygiene and safety, only unopened items can be returned." };
  return { short: "In original condition and packaging", long: "Items must be in original condition and packaging." };
}

/** "Gender: Men\nFit: Regular" → rows. */
function specRows(text: string | null): [string, string][] {
  if (!text) return [];
  return text
    .split(/\n+/)
    .map((l) => l.split(/:\s*/))
    .filter((p) => p.length >= 2 && p[0].trim() && p.slice(1).join(":").trim())
    .map((p) => [p[0].trim(), p.slice(1).join(": ").trim()]);
}

export function DayloraProduct({ requested, initial }: { requested: string; initial: ProductDetailResponse | null }) {
  const config = useStoreConfig();
  const addToCartStore = useCartStore((s) => s.add);

  const [root, setRoot] = useState<ProductDetailResponse | null>(initial);
  const [loadError, setLoadError] = useState<{ notFound: boolean; message: string } | null>(null);
  const [reload, setReload] = useState(0);

  // The server couldn't reach the API: load it here instead.
  useEffect(() => {
    if (root) return;
    let live = true;
    setLoadError(null);
    (UUID.test(requested) ? publicProductService.getById(requested) : publicProductService.getBySlug(requested))
      .then((res) => live && res.data.data && setRoot(res.data.data))
      .catch((err) => {
        if (!live) return;
        const status = (err as { response?: { status?: number } }).response?.status;
        setLoadError({ notFound: status === 404, message: getApiErrorMessage(err, "We couldn't load this product.") });
      });
    return () => {
      live = false;
    };
  }, [requested, reload, root]);

  const variants: ProductVariantResponse[] = useMemo(() => root?.variants ?? [], [root]);
  const colors = useMemo(() => uniq(variants.map((v) => v.color)), [variants]);
  const sizes = useMemo(() => uniq(variants.map((v) => v.size)).sort(compareSizes), [variants]);
  // Variants that differ by neither colour nor size (e.g. pack sizes) get an "Option" picker.
  const options = useMemo(
    () => (colors.length <= 1 && sizes.length <= 1 && variants.length > 1 ? uniq(variants.map((v) => v.variantName ?? v.sku)) : []),
    [colors, sizes, variants],
  );
  const needsSize = sizes.length > 1;

  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [option, setOption] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [sizeError, setSizeError] = useState(false);

  // Start on the SKU the URL names: its colour always, its size only when the link carries
  // ?size= (a shopper's own choice; listing links leave the size open).
  const inited = useRef(false);
  useEffect(() => {
    if (!root || inited.current) return;
    inited.current = true;
    const me = root.variants.find((v) => v.id === root.id);
    // ?color= from a colour-filtered listing card opens on that colour.
    const urlColor = new URLSearchParams(window.location.search).get("color");
    const pickedColor = urlColor ? colors.find((c) => c.toLowerCase() === urlColor.toLowerCase()) : undefined;
    setColor(pickedColor ?? me?.color ?? root.color ?? colors[0] ?? null);
    setOption(me ? me.variantName ?? me.sku : null);
    const urlSize = new URLSearchParams(window.location.search).get("size");
    if (!needsSize) setSize(sizes[0] ?? null);
    else if (urlSize && me?.size === urlSize && me.stockQuantity > 0) setSize(urlSize);
    track("PRODUCT_VIEW", { productId: root.id, value: root.price, currency: "USD", properties: { sku: root.sku } });
  }, [root, colors, sizes, needsSize]);

  const inColor = useMemo(() => variants.filter((v) => !colors.length || v.color === color), [variants, colors, color]);
  const variantForSize = useCallback((s: string) => inColor.find((v) => v.size === s), [inColor]);

  /** The SKU the shopper has fully picked. */
  const resolved = useMemo(() => {
    if (options.length) return variants.find((v) => (v.variantName ?? v.sku) === option) ?? null;
    return inColor.find((v) => !sizes.length || v.size === size) ?? null;
  }, [options, variants, option, inColor, sizes, size]);
  /** The SKU whose photos are shown: the picked one, else the colour's first. */
  const display = resolved ?? inColor.find((v) => v.id === root?.id) ?? inColor[0] ?? variants[0] ?? null;

  // FR-ST-07 + NFR-04: keep the address bar on the chosen SKU's clean slug.
  useEffect(() => {
    if (!resolved) return;
    const path = `/product/${resolved.urlSlug ?? resolved.id}${needsSize && resolved.size ? `?size=${encodeURIComponent(resolved.size)}` : ""}`;
    if (window.location.pathname + window.location.search !== path) window.history.replaceState(null, "", path);
  }, [resolved, needsSize]);

  /* ---- Gallery ---- */
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const images = useMemo(() => {
    if (!root || !display) return [];
    const own = display.imageUrls?.length ? display.imageUrls : display.primaryImageUrl ? [display.primaryImageUrl] : [];
    const fallback = display.id === root.id ? root.images.map((i) => i.url) : [];
    const extra = [root.parent.lifestyleImageUrl, root.parent.infographicUrl];
    return uniq([...(own.length ? own : fallback), ...extra]).filter((u) => !failed.has(u));
  }, [root, display, failed]);
  const [idx, setIdx] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const imageKey = images.join("|");
  useEffect(() => {
    setIdx(0);
    trackRef.current?.scrollTo({ left: 0 });
  }, [imageKey]);
  const go = (i: number) => {
    const t = trackRef.current;
    if (!t) return;
    t.scrollTo({ left: Math.max(0, Math.min(images.length - 1, i)) * t.clientWidth, behavior: "smooth" });
  };
  const onTrackScroll = () => {
    const t = trackRef.current;
    if (!t) return;
    const i = Math.round(t.scrollLeft / t.clientWidth);
    if (i !== idx) setIdx(i);
  };
  const zoomable = () => window.matchMedia("(hover:hover) and (min-width:1024px)").matches;
  const onZoomMove = (e: React.MouseEvent) => {
    const slide = (e.target as HTMLElement).closest(".slide");
    if (!slide || !zoomable()) return;
    const img = slide.querySelector("img");
    if (!img) return;
    const r = slide.getBoundingClientRect();
    img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
    slide.classList.add("zoom");
  };
  const onZoomLeave = () => trackRef.current?.querySelectorAll(".slide.zoom").forEach((s) => s.classList.remove("zoom"));

  /* ---- Lightbox + size guide dialogs ---- */
  const lightRef = useRef<HTMLDialogElement>(null);
  const guideRef = useRef<HTMLDialogElement>(null);
  const [lightIdx, setLightIdx] = useState(0);
  /** The uploaded size chart didn't load: the built-in tables stand in. */
  const [chartFailed, setChartFailed] = useState(false);
  const openLight = (i: number) => {
    setLightIdx(i);
    lightRef.current?.showModal();
  };
  const backdropClose = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) e.currentTarget.close();
  };

  /* ---- Quantity ---- */
  const stock = resolved?.stockQuantity ?? 0;
  const maxQty = Math.max(1, Math.min(MAX_LINE_QTY, stock || MAX_LINE_QTY));
  useEffect(() => {
    setQty((q) => Math.min(q, maxQty));
  }, [maxQty]);

  /* ---- Delivery estimate (FR-ST-06), client-only to avoid a date mismatch ---- */
  const [eta, setEta] = useState("");
  const standard = config?.shippingOptions.find((o) => o.method === "STANDARD");
  const express = config?.shippingOptions.find((o) => o.method === "EXPRESS");
  useEffect(() => {
    const min = standard?.minDays ?? 3, max = standard?.maxDays ?? 5;
    setEta(`${fmtDay(addBusinessDays(new Date(), min))} – ${fmtDay(addBusinessDays(new Date(), max))}`);
  }, [standard?.minDays, standard?.maxDays]);

  /* ---- Accordions: all open on desktop, only the first on phones ---- */
  const detailsRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!root || !window.matchMedia("(max-width:767px)").matches) return;
    detailsRef.current?.querySelectorAll("details").forEach((d, i) => {
      if (i > 0) d.open = false;
    });
  }, [root]);

  /* ---- Mobile sticky add-to-cart once the main button scrolls away ---- */
  const addRef = useRef<HTMLButtonElement>(null);
  const [stickyShown, setStickyShown] = useState(false);
  useEffect(() => {
    const el = addRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([en]) => setStickyShown(!en.isIntersecting && en.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, [root]);

  /* ---- "More in …" rail: same section/type first, in stock (GET /api/products/:id/related) ---- */
  const [rail, setRail] = useState<CardModel[]>([]);
  const parentId = root?.parent.id;
  useEffect(() => {
    if (!parentId) return;
    let live = true;
    publicProductService
      .getRelated(parentId, 4)
      .then((res) => live && setRail((res.data.data ?? []).map(toCard)))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [parentId]);
  const railSameType = !!root?.parent.productType && rail.some((c) => c.productType === root.parent.productType);

  /* ---- Add to cart ---- */
  const [adding, setAdding] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  const sizeOptRef = useRef<HTMLFieldSetElement>(null);

  /* ---- Not loaded / failed ---- */
  if (loadError) {
    return (
      <main id="main" className="pdp">
        <div className="daylora-container">
          <div className="pdp-grid">
            <div className="nf-page" role="alert">
              <span className="empty-ic">
                <DayloraIcon name={loadError.notFound ? "search" : "alert"} />
              </span>
              <h1>{loadError.notFound ? "We can't find that product" : "This product didn't load"}</h1>
              <p>
                {loadError.notFound
                  ? "It may have sold out or the link may be out of date. Try searching, or browse all departments."
                  : loadError.message}
              </p>
              {loadError.notFound ? (
                <Link className="btn btn-primary" href="/catalog">
                  Browse all departments
                </Link>
              ) : (
                <button className="btn btn-primary" onClick={() => setReload((r) => r + 1)}>
                  Try again
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }
  if (!root || !display) {
    return (
      <main id="main" className="pdp" aria-busy="true">
        <div className="daylora-container">
          <div className="pdp-grid">
            <div className="gallery">
              <div className="skel" style={{ aspectRatio: "3/4", borderRadius: 16 }} />
            </div>
            <div className="buy">
              <div className="skel" style={{ height: 20, width: "30%" }} />
              <div className="skel" style={{ height: 36, width: "80%" }} />
              <div className="skel" style={{ height: 32, width: "25%" }} />
              <div className="skel" style={{ height: 56 }} />
            </div>
          </div>
        </div>
      </main>
    );
  }

  const parent = root.parent;
  const dept = root.category;
  const sub = parent.subcategory;
  const type = parent.productType;
  const sizeOut = (s: string) => {
    const v = variantForSize(s);
    return !v || v.stockQuantity <= 0;
  };
  const allSizesOut = needsSize && sizes.every(sizeOut);
  const someSizesOut = needsSize && sizes.some(sizeOut);
  const state = resolved ? stockState(resolved.stockQuantity, resolved.lowStockThreshold ?? config?.lowStockThreshold) : null;
  const soldOut = state === "out" || allSizesOut || variants.every((v) => v.stockQuantity <= 0);

  const prices = inColor.map((v) => v.price);
  const minPrice = Math.min(...prices), maxPrice = Math.max(...prices);
  const price = resolved?.price ?? minPrice;
  const priced = resolved ?? inColor.find((v) => v.price === minPrice) ?? display;
  const was = priced.mrp && priced.mrp > price ? priced.mrp : null;
  const savePct = was ? Math.round(((was - price) / was) * 100) : 0;
  // Packs: what one unit costs ("$2.33 each").
  const units = options.length && resolved ? packCount(resolved.variantName) : 1;
  const priceNote =
    !resolved && maxPrice > minPrice
      ? `Up to ${usd(maxPrice)} depending on size`
      : units > 1
        ? `${usd(Math.round((price / units) * 100) / 100)} each`
        : "";

  const what = resolved?.size && needsSize ? ` in ${resolved.size}` : options.length && resolved ? ` in ${option}` : colors.length > 1 ? ` in ${color}` : "";
  const stockText = soldOut
    ? state === "out" && !allSizesOut
      ? `Out of stock${what}`
      : colors.length > 1 && !variants.every((v) => v.stockQuantity <= 0)
        ? "Out of stock in this color"
        : "Out of stock · check back soon"
    : state === "low"
      ? `Only ${resolved!.stockQuantity} left${what}. Order soon`
      : state === "in"
        ? "In stock · ships in 1–2 business days"
        : someSizesOut
          ? colors.length > 1
            ? "Some sizes are sold out in this color"
            : "Some sizes are sold out"
          : "Select a size to see availability";
  const stockClass = soldOut ? "out" : state ?? "idle";

  const pickColor = (c: string) => {
    setColor(c);
    setCartError(null);
    const v = variants.find((x) => x.color === c && x.size === size);
    if (needsSize && (!v || v.stockQuantity <= 0)) setSize(null);
  };

  const addToCart = async () => {
    if (needsSize && !size) {
      setSizeError(true);
      const o = sizeOptRef.current;
      o?.scrollIntoView({ behavior: "smooth", block: "center" });
      o?.querySelector<HTMLInputElement>("input:not(:disabled)")?.focus({ preventScroll: true });
      return;
    }
    if (!resolved || soldOut || adding) return;
    setAdding(true);
    setCartError(null);
    try {
      await addToCartStore(resolved.id, qty);
      track("ADD_TO_CART", {
        productId: resolved.id,
        value: Math.round(resolved.price * qty * 100) / 100,
        currency: "USD",
        properties: { sku: resolved.sku, quantity: qty },
      });
      const bits = [colors.length > 1 ? resolved.color : null, needsSize ? resolved.size : null, options.length ? option : null].filter(Boolean);
      setToast(`${parent.name}${bits.length ? `, ${bits.join(", ")}` : ""} × ${qty}`);
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 3200);
    } catch (err) {
      setCartError(getApiErrorMessage(err, "We couldn't add this to your cart. Please try again."));
    } finally {
      setAdding(false);
    }
  };

  const shown = resolved ?? display;
  const attrs = parent.attributes ?? {};
  const deptSlug = dept?.slug;
  /** Attribute keys already shown in a fixed row or panel, so the generic rows skip them. */
  const used = new Set<string>();
  const attr = (...keys: string[]) => {
    for (const k of keys) {
      const hit = Object.keys(attrs).find((a) => a.toLowerCase().replace(/[\s_-]+/g, "") === k.toLowerCase().replace(/[\s_-]+/g, ""));
      if (hit && attrs[hit]) {
        used.add(hit);
        return attrs[hit];
      }
    }
    return undefined;
  };
  const specMap = new Map<string, string>();
  const addSpec = (k: string, v: string | number | null | undefined) => {
    if (v != null && v !== "" && !specMap.has(k)) specMap.set(k, String(v));
  };
  const isBook = deptSlug === "books-stationery" && (/book/i.test(sub?.name ?? "") || !!attr("Author"));

  // Grocery: diet badges, and the label panel when the import carries nutrition data.
  const diet = deptSlug === "grocery" ? (attr("Dietary") ?? "").split(/\s*,\s*/).filter(Boolean) : [];
  const nutritionRaw = deptSlug === "grocery" ? attr("Nutrition", "Nutrition_Facts") : undefined;
  const nutrition = parseNutrition(nutritionRaw);
  const ingredients = deptSlug === "grocery" ? attr("Ingredients") : undefined;
  const age = Object.entries(attrs).find(([k]) => /^age([\s_-]?group)?$/i.test(k))?.[1];
  const choking = needsChokingWarning(deptSlug, type, age);

  if (deptSlug === "clothing") {
    // Fixed clothing rows (design), each when the catalog has it.
    addSpec("Gender", attr("Gender"));
    addSpec("Fit", attr("Fit"));
    addSpec("Material", shown.material ?? attr("Material"));
    addSpec("Care", attr("Care_Instructions", "Care"));
    addSpec("Origin", attr("Country_of_Origin", "Origin"));
    addSpec("What's included", parent.whatsIncluded);
  } else if (isBook) {
    addSpec("Author", attr("Author"));
    addSpec("Format", attr("Format"));
    addSpec("Pages", attr("Pages", "Page_Count", "Number_of_Pages"));
    addSpec("Publisher", attr("Publisher"));
    addSpec("Language", attr("Language"));
    addSpec("ISBN-13", attr("ISBN-13", "ISBN_13", "ISBN13", "ISBN"));
  }
  addSpec("Brand", parent.brand);
  Object.entries(attrs).forEach(([k, v]) => {
    if (used.has(k)) return;
    // Long label text has its own panel.
    if ((nutrition || ingredients) && /^(nutrition|nutrition_facts|ingredients)$/i.test(k)) return;
    addSpec(k.replace(/_/g, " "), v);
  });
  specRows(root.specifications).forEach(([k, v]) => addSpec(k, v));
  addSpec("Color", colors.length > 1 ? null : shown.color);
  addSpec("Size", needsSize ? null : shown.size);
  addSpec("Material", shown.material);
  addSpec("Pattern", shown.pattern);
  addSpec("Style", shown.style);
  addSpec("Dimensions", root.dimensions);
  addSpec("Weight", root.weight);
  addSpec("What's included", parent.whatsIncluded);
  addSpec("Warranty", parent.warranty);

  const freeOver = config?.freeShippingThreshold != null ? Number(config.freeShippingThreshold) : null;
  const returnDays = config?.returnWindowDays ?? 30;
  const ret = returnNote(dept?.slug);
  const description = parent.description ?? root.description;
  const skuLabel = resolved?.sku ?? parent.code;
  const addLabel = soldOut ? "Out of stock" : adding ? "Adding…" : "Add to cart";
  const tip = needsSize ? fitTip(attrs.Fit, type) : null;
  // Clothing with sizes always gets a size guide: the uploaded chart, else the built-in tables.
  const hasGuide = needsSize && deptSlug === "clothing";
  const women = /women/i.test(attrs.Gender ?? sub?.name ?? "");
  const optLabel = deptSlug === "grocery" ? "Pack size" : deptSlug === "beauty" ? "Size" : "Option";
  const singlePrice = variants.find((v) => packCount(v.variantName) === 1)?.price;
  /** Sub-label under a pack or size option: the saving per unit for packs, else its price when prices differ. */
  const optSub = (v: ProductVariantResponse | undefined) => {
    if (!v) return null;
    const n = packCount(v.variantName);
    if (n > 1 && singlePrice) {
      const save = Math.round((1 - v.price / (n * singlePrice)) * 100);
      return save > 0 ? { text: `Save ${save}%`, muted: false } : null;
    }
    return new Set(variants.map((x) => x.price)).size > 1 ? { text: usd(v.price), muted: true } : null;
  };
  const steps = parent.usageInstructions && deptSlug === "beauty" ? toSteps(parent.usageInstructions) : null;
  const ratingCount = root.ratingCount ?? parent.ratingCount ?? 0;
  const ratingAvg = Number(root.ratingAvg ?? parent.ratingAvg ?? 0);
  const openReviews = (e: React.MouseEvent) => {
    const el = document.getElementById("reviews") as HTMLDetailsElement | null;
    if (!el) return;
    e.preventDefault();
    el.open = true;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const railTitle =
    deptSlug === "clothing" && sub && type ? `${sub.name}'s ${type.toLowerCase()}` : (sub?.name ?? dept?.name ?? "this range").toLowerCase();
  const railHref = catalogHref({ dept: deptSlug, g: sub?.slug, type: railSameType && type ? type : undefined });

  return (
    <main id="main" className="pdp">
      <ShopIconSprite />
      <div className="daylora-container">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          {dept && (
            <>
              <DayloraIcon name="chev" />
              <Link href={catalogHref({ dept: dept.slug })}>{dept.name}</Link>
            </>
          )}
          {dept && sub && (
            <>
              <DayloraIcon name="chev" />
              <Link href={catalogHref({ dept: dept.slug, g: sub.slug })}>{sub.name}</Link>
            </>
          )}
          {dept && type && (
            <>
              <DayloraIcon name="chev" />
              <Link href={catalogHref({ dept: dept.slug, g: sub?.slug, type })}>{type}</Link>
            </>
          )}
          <DayloraIcon name="chev" />
          <span aria-current="page">{parent.name}</span>
        </nav>

        <div className="pdp-grid">
          {/* ============ GALLERY ============ */}
          <section className="gallery" aria-label="Product images">
            <div className={`gallery-wrap${images.length <= 1 && !hasGuide ? " single" : ""}${images.length <= 1 ? " one" : ""}`}>
              <div className="stage">
                <div
                  className="track"
                  ref={trackRef}
                  tabIndex={0}
                  aria-label="Product images, use arrow keys"
                  onScroll={onTrackScroll}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowRight") go(idx + 1);
                    if (e.key === "ArrowLeft") go(idx - 1);
                    if (e.key === "Enter" && images.length) openLight(idx);
                  }}
                  onMouseMove={onZoomMove}
                  onMouseLeave={onZoomLeave}
                >
                  {images.length ? (
                    images.map((url, i) => (
                      <div className="slide" key={url} onClick={() => openLight(i)}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`${parent.name}${images.length > 1 ? `, view ${i + 1} of ${images.length}` : ""}`}
                          loading={i ? "lazy" : "eager"}
                          onError={() => setFailed((prev) => new Set(prev).add(url))}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="slide ph" style={{ background: color ? `color-mix(in srgb, ${colorHex(color)} 18%, #F4F6F8)` : "#EEF1F4" }}>
                      <div className="ph-slide">
                        <DayloraIcon name="box" />
                      </div>
                    </div>
                  )}
                </div>
                <button className="stage-btn prev" aria-label="Previous image" onClick={() => go(idx - 1)}>
                  <DayloraIcon name="chev" />
                </button>
                <button className="stage-btn next" aria-label="Next image" onClick={() => go(idx + 1)}>
                  <DayloraIcon name="chev" />
                </button>
                <span className="counter" aria-live="polite">
                  {Math.min(idx + 1, Math.max(1, images.length))} / {Math.max(1, images.length)}
                </span>
                {images.length > 0 && (
                  <span className="zoom-hint" aria-hidden="true">
                    <DayloraIcon name="search" />
                    Hover to zoom
                  </span>
                )}
              </div>
              <div className="thumbs">
                {(images.length > 1 || hasGuide) &&
                  images.map((url, i) => (
                    <button key={url} className="thumb" aria-label={`Show image ${i + 1}`} aria-current={i === idx} onClick={() => go(i)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" />
                    </button>
                  ))}
                {hasGuide && (
                  <button className="thumb thumb-chart" aria-label="Open size chart" onClick={() => guideRef.current?.showModal()}>
                    <DayloraIcon name="ruler" />
                    Size chart
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* ============ BUY BOX ============ */}
          <section className="buy" aria-label="Purchase options">
            <div className="buy-head">
              {parent.brand && (
                <Link
                  href={`${catalogHref({ dept: deptSlug })}${deptSlug ? "&" : "?"}brand=${encodeURIComponent(parent.brand)}`}
                  className="brand-link"
                >
                  {parent.brand}
                </Link>
              )}
              <h1>{parent.name}</h1>
              {ratingCount > 0 && (
                <div className="rating" role="group" aria-label={`Rated ${ratingAvg.toFixed(1)} out of 5`}>
                  <Stars avg={ratingAvg} />
                  <b>{ratingAvg.toFixed(1)}</b>
                  <a href="#reviews" onClick={openReviews}>
                    {ratingCount} review{ratingCount === 1 ? "" : "s"}
                  </a>
                </div>
              )}
            </div>

            <div className="pdp-price" aria-live="polite">
              <span className="now">
                {!resolved && maxPrice > minPrice && <span className="sr-only">From </span>}
                {usd(price)}
              </span>
              {was && (
                <span className="was-lg">
                  <span className="sr-only">Was </span>
                  {usd(was)}
                </span>
              )}
              {savePct > 0 && <span className="save-pill">Save {savePct}%</span>}
              {(priceNote || (config && !config.pricesIncludeTax)) && (
                <span className="note">{priceNote || "Plus tax at checkout"}</span>
              )}
            </div>

            <div className="opts">
              {colors.length > 1 ? (
                <fieldset className="opt">
                  <legend>
                    Color: <span>{color}</span>
                  </legend>
                  <div className="swatches">
                    {colors.map((c, i) => (
                      <React.Fragment key={c}>
                        <input type="radio" name="color" id={`c-${i}`} value={c} checked={color === c} onChange={() => pickColor(c)} />
                        <label className="swatch" htmlFor={`c-${i}`} title={c}>
                          <i style={{ background: colorHex(c) }} />
                          <span className="sr-only">{c}</span>
                        </label>
                      </React.Fragment>
                    ))}
                  </div>
                </fieldset>
              ) : colors.length === 1 ? (
                <p className="opt-static">
                  <b>Color:</b> {colors[0]}
                </p>
              ) : null}

              {needsSize && (
                <fieldset className={`opt${sizeError ? " has-error" : ""}`} ref={sizeOptRef}>
                  <legend>
                    Size: <span>{size ?? "Select a size"}</span>
                    {hasGuide && (
                      <a
                        href={parent.sizeChartUrl ?? "#size-guide"}
                        className="link"
                        onClick={(e) => {
                          e.preventDefault();
                          guideRef.current?.showModal();
                        }}
                      >
                        Size guide
                      </a>
                    )}
                  </legend>
                  <div className="sizes">
                    {sizes.map((s) => {
                      const out = sizeOut(s);
                      return (
                        <React.Fragment key={s}>
                          <input
                            type="radio"
                            name="size"
                            id={`s-${s}`}
                            value={s}
                            disabled={out}
                            checked={size === s}
                            onChange={() => {
                              setSize(s);
                              setSizeError(false);
                              setCartError(null);
                            }}
                          />
                          <label className="size" htmlFor={`s-${s}`}>
                            {s}
                            {out && <span className="sr-only">, out of stock</span>}
                          </label>
                        </React.Fragment>
                      );
                    })}
                  </div>
                  {tip && <p className="opt-hint">{tip}</p>}
                  <p className="opt-error" role="alert">
                    <DayloraIcon name="alert" />
                    Select a size to add this to your cart.
                  </p>
                </fieldset>
              )}

              {options.length > 0 && (
                <fieldset className="opt">
                  <legend>
                    {optLabel}: <span>{option}</span>
                  </legend>
                  <div className="sizes" id="vars">
                    {options.map((o, i) => {
                      const v = variants.find((x) => (x.variantName ?? x.sku) === o);
                      const out = !v || v.stockQuantity <= 0;
                      const small = optSub(v);
                      return (
                        <React.Fragment key={o}>
                          <input type="radio" name="option" id={`o-${i}`} value={o} checked={option === o} onChange={() => setOption(o)} />
                          <label className="size pack" htmlFor={`o-${i}`}>
                            {o}
                            {small && <small className={small.muted ? "m" : undefined}>{small.text}</small>}
                            {out && <span className="sr-only">, out of stock</span>}
                          </label>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </fieldset>
              )}
            </div>

            <p className={`stock-line ${stockClass}`} aria-live="polite">
              <span className="dot" aria-hidden="true" />
              <span>{stockText}</span>
            </p>

            <div className="cta-row">
              <div className="qty" role="group" aria-label="Quantity">
                <button aria-label="Decrease quantity" disabled={qty <= 1 || soldOut} onClick={() => setQty(qty - 1)}>
                  −
                </button>
                <output aria-live="polite">{qty}</output>
                <button aria-label="Increase quantity" disabled={qty >= maxQty || soldOut} onClick={() => setQty(qty + 1)}>
                  +
                </button>
              </div>
              <button ref={addRef} className="btn btn-primary btn-cart" disabled={soldOut || adding} onClick={addToCart}>
                {addLabel}
              </button>
              <SaveHeart productId={shown.id} name={parent.name} className="pdp-heart" />
            </div>
            {cartError && (
              <p className="opt-error" role="alert" style={{ display: "flex" }}>
                <DayloraIcon name="alert" />
                {cartError}
              </p>
            )}
            <p className="sku">
              SKU <code>{skuLabel}</code>
            </p>

            <div className="assure-box">
              <div className="assure-row">
                <DayloraIcon name="truck" />
                <div>
                  <strong>{freeOver != null ? "Free shipping" : "Standard shipping"}</strong>
                  <span>
                    {eta && (
                      <>
                        Arrives <b>{eta}</b>
                      </>
                    )}
                    {freeOver != null && (
                      <>
                        {" · "}
                        {price >= freeOver ? "this item ships free" : `orders ${usd(freeOver).replace(".00", "")}+`}
                      </>
                    )}
                  </span>
                </div>
              </div>
              <div className="assure-row">
                <DayloraIcon name="return" />
                <div>
                  <strong>Free {returnDays}-day returns</strong>
                  <span>{ret.short}</span>
                </div>
              </div>
              <div className="assure-row">
                <DayloraIcon name="shield" />
                <div>
                  <strong>Secure checkout</strong>
                  <span>We never store your card details</span>
                </div>
              </div>
            </div>
          </section>

          {/* ============ DETAILS ============ */}
          <section className="details" aria-label="Product details" ref={detailsRef}>
            {(description || parent.keyFeatures.length > 0 || diet.length > 0 || choking) && (
              <details className="acc" open>
                <summary>
                  Description
                  <DayloraIcon name="chev" />
                </summary>
                <div className="acc-body">
                  {diet.length > 0 && (
                    <div className="badges">
                      {diet.map((d) => (
                        <span key={d}>
                          <DayloraIcon name="check" />
                          {d}
                        </span>
                      ))}
                    </div>
                  )}
                  {description && <p>{description}</p>}
                  {parent.keyFeatures.length > 0 && (
                    <ul className="feat">
                      {parent.keyFeatures.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  )}
                  {choking && <ChokingWarning />}
                </div>
              </details>
            )}
            {specMap.size > 0 && (
              <details className="acc" open>
                <summary>
                  Specifications
                  <DayloraIcon name="chev" />
                </summary>
                <div className="acc-body">
                  <dl className="specs">
                    {Array.from(specMap.entries()).map(([k, v]) => (
                      <React.Fragment key={k}>
                        <dt>{k}</dt>
                        <dd>{v}</dd>
                      </React.Fragment>
                    ))}
                  </dl>
                </div>
              </details>
            )}
            {(nutrition || ingredients) && (
              <details className="acc">
                <summary>
                  Nutrition &amp; ingredients
                  <DayloraIcon name="chev" />
                </summary>
                <div className="acc-body">
                  {nutrition ? <NutritionPanel n={nutrition} /> : nutritionRaw && <p>{nutritionRaw}</p>}
                  {ingredients && (
                    <p>
                      <b>Ingredients:</b> {ingredients}
                    </p>
                  )}
                  <p className="opt-hint">Always check the package before use.</p>
                </div>
              </details>
            )}
            {parent.usageInstructions && (
              <details className="acc" open={!steps}>
                <summary>
                  {deptSlug === "clothing" ? "Care" : "How to use"}
                  <DayloraIcon name="chev" />
                </summary>
                <div className="acc-body">
                  {steps ? (
                    <>
                      <ol className="steps-list">
                        {steps.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ol>
                      <p className="opt-hint">For external use only. Stop use if irritation occurs.</p>
                    </>
                  ) : (
                    <p>{parent.usageInstructions}</p>
                  )}
                </div>
              </details>
            )}
            <details className="acc">
              <summary>
                Shipping &amp; returns
                <DayloraIcon name="chev" />
              </summary>
              <div className="acc-body">
                <dl className="specs">
                  {standard && (
                    <>
                      <dt>Standard</dt>
                      <dd>
                        {freeOver != null ? `Free on orders ${usd(freeOver)}+, otherwise ${usd(Number(standard.fee))}` : usd(Number(standard.fee))} ·{" "}
                        {standard.estimatedDelivery}
                      </dd>
                    </>
                  )}
                  {express && (
                    <>
                      <dt>Express</dt>
                      <dd>
                        {usd(Number(express.fee))} · {express.estimatedDelivery}
                      </dd>
                    </>
                  )}
                  <dt>Returns</dt>
                  <dd>
                    Free within {returnDays} days of delivery, from your order page. {ret.long}
                  </dd>
                  <dt>Refunds</dt>
                  <dd>To your original payment method, 5–7 business days after we receive the return.</dd>
                </dl>
              </div>
            </details>
            <PdpReviews
              key={parent.id}
              productId={parent.id}
              fallback={
                ratingCount && root.ratingDistribution
                  ? { average: ratingAvg, count: ratingCount, distribution: root.ratingDistribution }
                  : null
              }
            />
          </section>
        </div>

        {rail.length > 0 && (
          <section className="more-rail" aria-labelledby="moreH">
            <div className="rail-head">
              <h2 id="moreH">More in {railTitle}</h2>
              <Link href={railHref} className="link">
                See all
              </Link>
            </div>
            <div className="mgrid">
              {rail.map((c) => (
                <PlpCard key={c.id} c={c} colors={null} delay={0} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Size guide: the uploaded Size_Chart_URL, else the design's built-in tables */}
      {hasGuide && (
        <dialog ref={guideRef} id="size-guide" aria-labelledby="dlgTitle" onClick={backdropClose}>
          <div className="dlg-head">
            <h2 id="dlgTitle">
              Size guide{sub ? ` · ${type ? `${sub.name}'s ${type.toLowerCase()}` : sub.name}` : ""}
            </h2>
            <button className="icon-btn" aria-label="Close size guide" onClick={() => guideRef.current?.close()}>
              <DayloraIcon name="close" />
            </button>
          </div>
          <div className="dlg-body">
            {parent.sizeChartUrl && !chartFailed ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={parent.sizeChartUrl}
                  alt={`Size chart for ${parent.name}`}
                  style={{ width: "100%", height: "auto" }}
                  onError={() => setChartFailed(true)}
                />
                {tip && <p className="opt-hint">{tip}</p>}
              </>
            ) : (
              <SizeGuideTables sizes={sizes} women={women} fit={attrs.Fit} jackets={type === "Jackets & coats"} />
            )}
          </div>
        </dialog>
      )}

      {/* Lightbox */}
      <dialog ref={lightRef} className="lightbox" aria-label={`${parent.name} images`} onClick={backdropClose}>
        <div className="dlg-head">
          <h2>
            {parent.name}
            {images.length > 1 ? ` · ${lightIdx + 1} / ${images.length}` : ""}
          </h2>
          <button className="icon-btn" aria-label="Close image viewer" onClick={() => lightRef.current?.close()}>
            <DayloraIcon name="close" />
          </button>
        </div>
        <div className="lb-stage">
          {images[lightIdx] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={images[lightIdx]} alt={`${parent.name}, view ${lightIdx + 1} of ${images.length}`} />
          )}
          {images.length > 1 && (
            <>
              <button
                className="stage-btn prev"
                aria-label="Previous image"
                onClick={() => setLightIdx((i) => (i - 1 + images.length) % images.length)}
              >
                <DayloraIcon name="chev" />
              </button>
              <button className="stage-btn next" aria-label="Next image" onClick={() => setLightIdx((i) => (i + 1) % images.length)}>
                <DayloraIcon name="chev" />
              </button>
            </>
          )}
        </div>
      </dialog>

      {/* Add-to-cart confirmation */}
      <div className={`toast${toast ? " show" : ""}`} role="status" aria-live="polite">
        <DayloraIcon name="check" />
        <p>
          {toast && (
            <>
              <b>Added to cart</b>
              <br />
              {toast}
            </>
          )}
        </p>
        <Link href="/cart">View cart</Link>
      </div>

      {/* Mobile sticky add-to-cart */}
      <div className={`sticky-bar${stickyShown ? " show" : ""}`} aria-hidden={!stickyShown}>
        <div>
          <strong>{parent.name}</strong>
          <span>{usd(price)}</span>
        </div>
        <button className="btn btn-primary" tabIndex={stickyShown ? 0 : -1} disabled={soldOut || adding} onClick={addToCart}>
          {addLabel}
        </button>
      </div>
    </main>
  );
}
