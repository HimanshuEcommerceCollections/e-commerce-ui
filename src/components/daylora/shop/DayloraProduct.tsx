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
import { ShopIconSprite } from "./ShopIcons";
import { colorHex, compareSizes, stockState, usd } from "./catalog";
import { catalogHref } from "./departments";
import { loadStorefrontCatalog } from "./storefrontCatalog";
import { toItem, type PlpItem } from "./plpModel";
import { PlpCard } from "./PlpCard";

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
    setColor(me?.color ?? root.color ?? colors[0] ?? null);
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

  /* ---- "More in …" rail: same subcategory, most popular, in stock ---- */
  const [rail, setRail] = useState<PlpItem[]>([]);
  const [railSameType, setRailSameType] = useState(false);
  useEffect(() => {
    if (!root) return;
    let live = true;
    const sub = root.parent.subcategory?.slug;
    loadStorefrontCatalog()
      .then((all) => {
        if (!live || !sub) return;
        const pool = all
          .map(toItem)
          .filter((x) => x.p.parentId !== root.parent.id && x.sec === sub && x.card.stockState !== "out");
        const same = pool.filter((x) => x.type === root.parent.productType).sort((a, b) => b.p.popularity - a.p.popularity);
        const rest = pool.filter((x) => x.type !== root.parent.productType).sort((a, b) => b.p.popularity - a.p.popularity);
        setRailSameType(same.length > 0);
        setRail([...same, ...rest].slice(0, 4));
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [root]);

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
  const priceNote = !resolved && maxPrice > minPrice ? `Up to ${usd(maxPrice)} depending on size` : "";

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
        ? "In stock · ready to ship"
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
  const specMap = new Map<string, string>();
  const addSpec = (k: string, v: string | null | undefined) => {
    if (v && !specMap.has(k)) specMap.set(k, v);
  };
  addSpec("Brand", parent.brand);
  Object.entries(attrs).forEach(([k, v]) => addSpec(k.replace(/_/g, " "), v));
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
  const deptSlug = dept?.slug;
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
            <div className={`gallery-wrap${images.length <= 1 && !parent.sizeChartUrl ? " single" : ""}${images.length <= 1 ? " one" : ""}`}>
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
                {(images.length > 1 || parent.sizeChartUrl) &&
                  images.map((url, i) => (
                    <button key={url} className="thumb" aria-label={`Show image ${i + 1}`} aria-current={i === idx} onClick={() => go(i)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" />
                    </button>
                  ))}
                {parent.sizeChartUrl && (
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
                    {parent.sizeChartUrl && (
                      <a
                        href={parent.sizeChartUrl}
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
                    Option: <span>{option}</span>
                  </legend>
                  <div className="sizes">
                    {options.map((o, i) => {
                      const v = variants.find((x) => (x.variantName ?? x.sku) === o);
                      const out = !v || v.stockQuantity <= 0;
                      return (
                        <React.Fragment key={o}>
                          <input type="radio" name="option" id={`o-${i}`} value={o} checked={option === o} onChange={() => setOption(o)} />
                          <label className="size" htmlFor={`o-${i}`} style={{ minWidth: "auto", padding: "0 16px" }}>
                            {o}
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
            {(description || parent.keyFeatures.length > 0) && (
              <details className="acc" open>
                <summary>
                  Description
                  <DayloraIcon name="chev" />
                </summary>
                <div className="acc-body">
                  {description && <p>{description}</p>}
                  {parent.keyFeatures.length > 0 && (
                    <ul className="feat">
                      {parent.keyFeatures.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  )}
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
            {parent.usageInstructions && (
              <details className="acc" open>
                <summary>
                  {deptSlug === "clothing" ? "Care" : "How to use"}
                  <DayloraIcon name="chev" />
                </summary>
                <div className="acc-body">
                  <p>{parent.usageInstructions}</p>
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
                  <dd>To your original payment method once we receive the return.</dd>
                </dl>
              </div>
            </details>
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
              {rail.map((x) => (
                <PlpCard key={x.p.parentId} x={x} colors={null} delay={0} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Size guide (Size_Chart_URL) */}
      {parent.sizeChartUrl && (
        <dialog ref={guideRef} aria-labelledby="dlgTitle" onClick={backdropClose}>
          <div className="dlg-head">
            <h2 id="dlgTitle">Size guide{sub && type ? ` · ${sub.name}'s ${type.toLowerCase()}` : ""}</h2>
            <button className="icon-btn" aria-label="Close size guide" onClick={() => guideRef.current?.close()}>
              <DayloraIcon name="close" />
            </button>
          </div>
          <div className="dlg-body">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={parent.sizeChartUrl} alt={`Size chart for ${parent.name}`} style={{ width: "100%", height: "auto" }} />
            {tip && <p className="opt-hint">{tip}</p>}
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
