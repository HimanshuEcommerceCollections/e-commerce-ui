"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import publicProductService from "@/services/public/product.service";
import type { ProductDetailResponse, ProductVariantResponse } from "@/types/api/product.types";
import { useCart } from "@/hooks/useCart";
import { getApiErrorMessage } from "@/lib/apiError";
import { track } from "@/lib/analytics";
import { useStoreConfig } from "@/hooks/useStoreConfig";
import { DayloraIcon } from "../DayloraIcons";
import { colorHex, compareSizes, stockState, usd } from "./catalog";

/** Most a shopper can add in one go from the PDP. */
const MAX_QTY = 10;

const uniq = (vals: (string | null)[]) => Array.from(new Set(vals.filter((v): v is string => !!v)));

function addBusinessDays(from: Date, n: number) {
  const d = new Date(from);
  while (n > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() % 6) n--;
  }
  return d;
}
const fmtDay = (d: Date) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function DayloraProduct({ id: requested }: { id: string }) {
  const router = useRouter();
  const config = useStoreConfig();
  // The SKU id or URL slug the page opened on (NFR-04). Later variant picks only
  // rewrite the URL, so this never changes.
  const [ref] = useState(requested);
  const [id, setId] = useState<string | null>(UUID.test(requested) ? requested : null);
  const { addItem } = useCart();

  const [details, setDetails] = useState<Record<string, ProductDetailResponse>>({});
  const [loadError, setLoadError] = useState<{ notFound: boolean; message: string } | null>(null);
  const [reload, setReload] = useState(0);
  const root = id ? details[id] : undefined;

  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [eta, setEta] = useState("");
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const [stickyShown, setStickyShown] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const sizeOptRef = useRef<HTMLFieldSetElement>(null);
  const accRefs = useRef<(HTMLDetailsElement | null)[]>([]);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  /* ---- Load the requested SKU (parent + variants come with it) ---- */
  useEffect(() => {
    let live = true;
    setLoadError(null);
    (UUID.test(ref) ? publicProductService.getById(ref) : publicProductService.getBySlug(ref))
      .then((res) => {
        if (!live || !res.data.data) return;
        const d = res.data.data;
        setDetails((prev) => ({ ...prev, [d.id]: d }));
        setId(d.id);
        setColor(d.color);
        const sizes = uniq(d.variants.map((v) => v.size));
        setSize(sizes.length <= 1 ? d.size : null);
        track("PRODUCT_VIEW", { productId: d.id, value: d.price, properties: { sku: d.sku } });
      })
      .catch((err) => {
        if (!live) return;
        const status = (err as { response?: { status?: number } }).response?.status;
        setLoadError({ notFound: status === 404, message: getApiErrorMessage(err, "We couldn't load this product.") });
      });
    return () => { live = false; };
  }, [ref, reload]);

  useEffect(() => {
    setEta(`${fmtDay(addBusinessDays(new Date(), 3))} – ${fmtDay(addBusinessDays(new Date(), 5))}`);
  }, []);

  const variants: ProductVariantResponse[] = useMemo(() => (root ? root.variants : []), [root]);
  const colors = useMemo(() => uniq(variants.map((v) => v.color)), [variants]);
  const sizes = useMemo(() => uniq(variants.map((v) => v.size)).sort(compareSizes), [variants]);
  const needsSize = sizes.length > 1;

  const inColor = useMemo(
    () => variants.filter((v) => !colors.length || v.color === color),
    [variants, colors, color],
  );
  const variantForSize = (s: string) => inColor.find((v) => v.size === s);

  /** The SKU the shopper has fully picked. */
  const resolved = useMemo(
    () => inColor.find((v) => !sizes.length || v.size === size) ?? null,
    [inColor, sizes, size],
  );
  /** The SKU whose images and details are on screen: the picked one, else the colour's first. */
  const display = resolved ?? inColor[0] ?? variants.find((v) => v.id === id) ?? null;
  const displayDetail = display ? details[display.id] : undefined;

  // FR-ST-07: fetch the shown SKU's own images without reloading the page.
  useEffect(() => {
    if (!display || details[display.id]) return;
    let live = true;
    publicProductService
      .getById(display.id)
      .then((res) => {
        const d = res.data.data;
        if (live && d) setDetails((prev) => ({ ...prev, [d.id]: d }));
      })
      .catch(() => { /* keep showing the variant's primary image */ });
    return () => { live = false; };
  }, [display, details]);

  // Keep the address bar on the chosen SKU, by its clean slug, so it can be shared.
  useEffect(() => {
    if (!resolved) return;
    const path = `/product/${resolved.urlSlug ?? resolved.id}`;
    if (window.location.pathname !== path) window.history.replaceState(null, "", path);
  }, [resolved]);

  const images = useMemo(() => {
    const fromDetail = displayDetail?.images.map((im) => ({ url: im.url, alt: im.altText ?? "" })) ?? [];
    const list = fromDetail.length ? fromDetail : display?.primaryImageUrl ? [{ url: display.primaryImageUrl, alt: "" }] : [];
    return list.filter((im) => !failed.has(im.url));
  }, [displayDetail, display, failed]);

  // A new image set starts at the first image.
  const imageKey = images.map((i) => i.url).join("|");
  useEffect(() => {
    setIdx(0);
    trackRef.current?.scrollTo({ left: 0 });
  }, [imageKey]);

  const maxQty = Math.max(1, Math.min(MAX_QTY, resolved?.stockQuantity ?? MAX_QTY));
  useEffect(() => {
    setQty((q) => Math.min(q, maxQty));
  }, [maxQty]);

  // Accordions: all open on desktop, only the first on small screens.
  useEffect(() => {
    if (!root || !window.matchMedia("(max-width:767px)").matches) return;
    accRefs.current.forEach((d, i) => { if (d && i > 0) d.open = false; });
  }, [root]);

  // Mobile sticky bar once the main button scrolls off the top.
  useEffect(() => {
    const el = addRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([en]) => setStickyShown(!en.isIntersecting && en.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, [root]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  useEffect(() => {
    if (root) document.title = `${root.parent.name} · Daylora`;
  }, [root]);

  /* ---- Not loaded / not found ---- */
  if (loadError) {
    return (
      <main id="main" className="pdp">
        <div className="daylora-container">
          <div className="empty" role="alert">
            <span className="empty-ic"><DayloraIcon name={loadError.notFound ? "search" : "alert"} /></span>
            <h2>{loadError.notFound ? "We couldn't find this product" : "This product didn't load"}</h2>
            <p>{loadError.notFound ? "It may have sold out or been removed from the store." : loadError.message}</p>
            {loadError.notFound ? (
              <Link className="btn btn-primary" href="/catalog">Shop all products</Link>
            ) : (
              <button className="btn btn-primary" onClick={() => setReload((r) => r + 1)}>Try again</button>
            )}
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
            <div className="gallery"><div className="skel" style={{ aspectRatio: "3/4", borderRadius: 16 }} /></div>
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
  const category = root.category;
  const colorOutOfStock = needsSize && sizes.every((s) => {
    const v = variantForSize(s);
    return !v || v.stockQuantity <= 0;
  });
  const someSizesOut = needsSize && sizes.some((s) => {
    const v = variantForSize(s);
    return !v || v.stockQuantity <= 0;
  });
  const resolvedState = resolved ? stockState(resolved.stockQuantity, resolved.lowStockThreshold) : null;
  const soldOut = resolvedState === "out" || colorOutOfStock;

  const colorPrices = inColor.map((v) => v.price);
  const minPrice = Math.min(...colorPrices), maxPrice = Math.max(...colorPrices);
  const price = resolved?.price ?? minPrice;
  const priceNote = !resolved && maxPrice > minPrice ? `Up to ${usd(maxPrice)} depending on size` : "";
  // FR-AD-05: MRP shown struck through when the selling price is below it.
  const priced = resolved ?? inColor.find((v) => v.price === minPrice) ?? null;
  const mrp = priced?.mrp && priced.mrp > price ? priced.mrp : null;
  const savePct = mrp ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const pickColor = (c: string) => {
    setColor(c);
    setCartError(null);
    // A size that's sold out (or missing) in the new colour is cleared.
    const v = variants.find((x) => x.color === c && x.size === size);
    if (needsSize && (!v || v.stockQuantity <= 0)) setSize(null);
  };
  const pickSize = (s: string) => {
    setSize(s);
    setSizeError(false);
    setCartError(null);
  };

  const go = (i: number) => {
    const t = trackRef.current;
    if (!t) return;
    const next = Math.max(0, Math.min(images.length - 1, i));
    t.scrollTo({ left: next * t.clientWidth, behavior: "smooth" });
  };
  const onTrackScroll = () => {
    const t = trackRef.current;
    if (!t) return;
    const i = Math.round(t.scrollLeft / t.clientWidth);
    if (i !== idx) setIdx(i);
  };
  const onZoomMove = (e: React.MouseEvent) => {
    const slide = (e.target as HTMLElement).closest(".slide");
    if (!slide || !window.matchMedia("(hover:hover) and (min-width:1024px)").matches) return;
    const img = slide.querySelector("img");
    if (!img) return;
    const r = slide.getBoundingClientRect();
    img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
    slide.classList.add("zoom");
  };
  const onZoomLeave = () => trackRef.current?.querySelectorAll(".slide.zoom").forEach((s) => s.classList.remove("zoom"));

  const addToCart = async () => {
    if (needsSize && !size) {
      setSizeError(true);
      const o = sizeOptRef.current;
      o?.scrollIntoView({ behavior: "smooth", block: "center" });
      o?.querySelector<HTMLInputElement>("input:not(:disabled)")?.focus({ preventScroll: true });
      return;
    }
    if (!resolved || soldOut || adding) return;
    if (!localStorage.getItem("accessToken")) {
      router.push("/login");
      return;
    }
    setAdding(true);
    setCartError(null);
    try {
      await addItem({ productId: resolved.id, quantity: qty });
      track("ADD_TO_CART", { productId: resolved.id, value: resolved.price * qty, properties: { sku: resolved.sku, quantity: qty } });
      const label = [parent.name, resolved.color, resolved.size].filter(Boolean).join(", ");
      setToast(`${label} × ${qty}`);
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 3200);
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      setCartError(
        status === 403
          ? "Sign in with a customer account to add items to your cart."
          : getApiErrorMessage(err, "We couldn't add this to your cart. Please try again."),
      );
    } finally {
      setAdding(false);
    }
  };

  const shown = displayDetail ?? root;
  const specs: [string, string | null][] = [
    ["Brand", parent.brand],
    ["Category", [category?.name, parent.subcategory?.name].filter(Boolean).join(" › ") || null],
    ["Type", parent.productType],
    ["Color", display.color],
    ["Size", resolved?.size ?? (sizes.length === 1 ? sizes[0] : null)],
    ["Material", display.material],
    ["Pattern", display.pattern],
    ["Style", display.style],
    // Category attribute sheet (Gender, Fit, Net_Weight…), PRD §4.
    ...Object.entries(parent.attributes ?? {}).map(([k, v]) => [k.replace(/_/g, " "), v] as [string, string]),
    ["Dimensions", shown.dimensions],
    ["Weight", shown.weight],
    ["What's included", parent.whatsIncluded],
    ["Warranty", parent.warranty],
  ];
  const standard = config?.shippingOptions.find((o) => o.method === "STANDARD");
  const express = config?.shippingOptions.find((o) => o.method === "EXPRESS");
  const freeOver = config?.freeShippingThreshold ? usd(Number(config.freeShippingThreshold)) : null;
  const returnDays = config?.returnWindowDays ?? 30;
  const description = parent.description ?? root.description;
  const skuLabel = resolved?.sku ?? parent.code;
  const addLabel = soldOut ? "Out of stock" : adding ? "Adding…" : "Add to cart";

  let accIndex = 0;
  const accRef = () => {
    const i = accIndex++;
    return (el: HTMLDetailsElement | null) => { accRefs.current[i] = el; };
  };

  return (
    <main id="main" className="pdp">
      <div className="daylora-container">
        <nav className="crumbs" aria-label="Breadcrumb" data-note="FR-ST-02 · Breadcrumb from catalog taxonomy">
          <Link href="/">Home</Link>
          <DayloraIcon name="chev" />
          {category && (
            <>
              <Link href={`/catalog?category=${encodeURIComponent(category.slug)}`}>{category.name}</Link>
              <DayloraIcon name="chev" />
            </>
          )}
          <span aria-current="page">{parent.name}</span>
        </nav>

        <div className="pdp-grid">
          {/* ============ GALLERY ============ */}
          <section className="gallery" aria-label="Product images" data-note="FR-ST-06 · Images (swipe on mobile)">
            <div className={`gallery-wrap${images.length > 1 ? "" : " single"}`}>
              <div className="stage">
                <div
                  className="track"
                  ref={trackRef}
                  tabIndex={0}
                  aria-label="Image carousel, use arrow keys"
                  onScroll={onTrackScroll}
                  onKeyDown={(e) => { if (e.key === "ArrowRight") go(idx + 1); if (e.key === "ArrowLeft") go(idx - 1); }}
                  onMouseMove={onZoomMove}
                  onMouseLeave={onZoomLeave}
                >
                  {images.length ? (
                    images.map((im, i) => (
                      <div className="slide" key={im.url}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={im.url}
                          alt={im.alt || `${parent.name}, image ${i + 1}`}
                          loading={i ? "lazy" : "eager"}
                          onError={() => setFailed((prev) => new Set(prev).add(im.url))}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="slide"><DayloraIcon name="box" /></div>
                  )}
                </div>
                {images.length > 1 && (
                  <>
                    <button className="stage-btn prev" aria-label="Previous image" onClick={() => go(idx - 1)}><DayloraIcon name="chev" /></button>
                    <button className="stage-btn next" aria-label="Next image" onClick={() => go(idx + 1)}><DayloraIcon name="chev" /></button>
                    <span className="counter" aria-live="polite">{idx + 1} / {images.length}</span>
                  </>
                )}
                {images.length > 0 && (
                  <span className="zoom-hint" aria-hidden="true"><DayloraIcon name="search" />Hover to zoom</span>
                )}
              </div>
              {images.length > 1 && (
                <div className="thumbs">
                  {images.map((im, i) => (
                    <button
                      key={im.url}
                      className="thumb"
                      aria-label={`Show image ${i + 1}`}
                      aria-current={i === idx}
                      onClick={() => go(i)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={im.url} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ============ BUY BOX ============ */}
          <section className="buy" aria-label="Purchase options" data-note="FR-ST-06/07 · Buy box (variant change updates price, image, SKU, stock — no reload)">
            <div className="buy-head">
              {parent.brand && (
                <Link href={`/catalog?q=${encodeURIComponent(parent.brand)}`} className="brand-link">{parent.brand}</Link>
              )}
              <h1>{parent.name}</h1>
              {parent.shortDescription && <p className="opt-hint" style={{ fontSize: 16, lineHeight: "24px" }}>{parent.shortDescription}</p>}
            </div>

            <div className="pdp-price" aria-live="polite">
              <span className="now">{usd(price)}</span>
              {mrp && (
                <>
                  <span className="was"><span className="sr-only">Was </span>{usd(mrp)}</span>
                  <span className="save">Save {savePct}%</span>
                </>
              )}
              {priceNote && <span className="note">{priceNote}</span>}
            </div>
            {config && !config.pricesIncludeTax && <p className="opt-hint">Plus tax at checkout</p>}

            {parent.keyFeatures.length > 0 && (
              <ul className="features" aria-label="Key features">
                {parent.keyFeatures.slice(0, 5).map((f) => (
                  <li key={f}><DayloraIcon name="check" />{f}</li>
                ))}
              </ul>
            )}

            {colors.length > 1 && (
              <fieldset className="opt">
                <legend>Color: <span>{color}</span></legend>
                <div className="swatches">
                  {colors.map((c) => (
                    <React.Fragment key={c}>
                      <input type="radio" name="color" id={`c-${c}`} value={c} checked={color === c} onChange={() => pickColor(c)} />
                      <label className="swatch" htmlFor={`c-${c}`} title={c}>
                        <i style={{ background: colorHex(c) }} />
                        <span className="sr-only">{c}</span>
                      </label>
                    </React.Fragment>
                  ))}
                </div>
              </fieldset>
            )}

            {needsSize && (
              <fieldset className={`opt${sizeError ? " has-error" : ""}`} ref={sizeOptRef}>
                <legend>Size: <span>{size ?? "Select a size"}</span></legend>
                {parent.sizeChartUrl && (
                  <a className="size-chart" href={parent.sizeChartUrl} target="_blank" rel="noopener noreferrer">Size guide</a>
                )}
                <div className="sizes">
                  {sizes.map((s) => {
                    const v = variantForSize(s);
                    const out = !v || v.stockQuantity <= 0;
                    return (
                      <React.Fragment key={s}>
                        <input type="radio" name="size" id={`s-${s}`} value={s} disabled={out} checked={size === s} onChange={() => pickSize(s)} />
                        <label className="size" htmlFor={`s-${s}`}>
                          {s}
                          {out && <span className="sr-only">, out of stock</span>}
                        </label>
                      </React.Fragment>
                    );
                  })}
                </div>
                <p className="opt-error" role="alert">
                  <DayloraIcon name="alert" />
                  Select a size to add this to your cart.
                </p>
              </fieldset>
            )}

            <p className={`stock-line ${resolvedState ?? (colorOutOfStock ? "out" : "idle")}`} aria-live="polite">
              <span className="dot" aria-hidden="true" />
              <span>
                {resolvedState === "out" || colorOutOfStock
                  ? colors.length > 1 ? "Out of stock in this color" : "Out of stock"
                  : resolvedState === "low"
                  ? `Only ${resolved!.stockQuantity} left${resolved!.size ? ` in ${resolved!.size}` : ""}. Order soon`
                  : resolvedState === "in"
                  ? "In stock · ships in 1–2 business days"
                  : someSizesOut
                  ? "Some sizes are sold out in this color"
                  : "Select a size to see availability"}
              </span>
            </p>

            <div className="cta-row">
              <div className="qty" role="group" aria-label="Quantity">
                <button aria-label="Decrease quantity" disabled={qty <= 1 || soldOut} onClick={() => setQty(qty - 1)}>−</button>
                <output aria-live="polite">{qty}</output>
                <button aria-label="Increase quantity" disabled={qty >= maxQty || soldOut} onClick={() => setQty(qty + 1)}>+</button>
              </div>
              <button ref={addRef} className="btn btn-primary btn-cart" disabled={soldOut || adding} onClick={addToCart}>
                {addLabel}
              </button>
            </div>
            {cartError && <p className="cart-error" role="alert">{cartError}</p>}
            <p className="sku">SKU <code>{skuLabel}</code></p>

            <div className="assure-box" data-note="FR-ST-06 · Shipping & returns info">
              <div className="assure-row">
                <DayloraIcon name="truck" />
                <div>
                  <strong>{freeOver ? "Free shipping" : "Fast shipping"}</strong>
                  <span>{eta ? <>Arrives <b>{eta}</b>{freeOver ? " · " : ""}</> : null}{freeOver ? `orders ${freeOver}+` : ""}</span>
                </div>
              </div>
              <div className="assure-row">
                <DayloraIcon name="return" />
                <div><strong>{returnDays}-day returns</strong><span>Unused, in original packaging</span></div>
              </div>
              <div className="assure-row">
                <DayloraIcon name="shield" />
                <div><strong>Secure checkout</strong><span>We never store your card details</span></div>
              </div>
            </div>
          </section>

          {/* ============ DETAILS ============ */}
          <section className="details" aria-label="Product details">
            {description && (
              <details className="acc" open ref={accRef()} data-note="FR-ST-06 · Description">
                <summary>Description<DayloraIcon name="chev" /></summary>
                <div className="acc-body">
                  <p>{description}</p>
                  {parent.usageInstructions && <p style={{ marginTop: 12 }}><b>How to use.</b> {parent.usageInstructions}</p>}
                  {shown.specifications && <p style={{ marginTop: 12 }}>{shown.specifications}</p>}
                </div>
              </details>
            )}
            <details className="acc" open ref={accRef()} data-note="FR-ST-06 · Specifications">
              <summary>Specifications<DayloraIcon name="chev" /></summary>
              <div className="acc-body">
                <dl className="specs">
                  {specs.filter(([, v]) => v).map(([k, v]) => (
                    <React.Fragment key={k}><dt>{k}</dt><dd>{v}</dd></React.Fragment>
                  ))}
                  <dt>SKU</dt><dd>{skuLabel}</dd>
                </dl>
              </div>
            </details>
            <details className="acc" ref={accRef()} data-note="FR-ST-06 · Shipping & returns">
              <summary>Shipping &amp; returns<DayloraIcon name="chev" /></summary>
              <div className="acc-body">
                <dl className="specs">
                  {standard && (
                    <><dt>Standard</dt><dd>{usd(Number(standard.fee))}{freeOver ? `, free on orders ${freeOver}+` : ""} · {standard.estimatedDelivery}</dd></>
                  )}
                  {express && <><dt>Express</dt><dd>{usd(Number(express.fee))} · {express.estimatedDelivery}</dd></>}
                  <dt>Returns</dt><dd>Within {returnDays} days of delivery, from your order page. Items must be unused and in their original packaging.</dd>
                  <dt>Refunds</dt><dd>To your original payment method once we receive the return.</dd>
                </dl>
              </div>
            </details>
          </section>
        </div>
      </div>

      {/* Add-to-cart confirmation */}
      <div className={`toast${toast ? " show" : ""}`} role="status" aria-live="polite">
        <DayloraIcon name="check" />
        <p>{toast && <><b>Added to cart</b><br />{toast}</>}</p>
        <Link href="/cart">View cart</Link>
      </div>

      {/* Mobile sticky add-to-cart */}
      <div className={`sticky-bar${stickyShown ? " show" : ""}`} aria-hidden={!stickyShown}>
        <div><strong>{parent.name}</strong><span>{usd(price)}</span></div>
        <button className="btn btn-primary" tabIndex={stickyShown ? 0 : -1} disabled={soldOut || adding} onClick={addToCart}>
          {addLabel}
        </button>
      </div>
    </main>
  );
}
