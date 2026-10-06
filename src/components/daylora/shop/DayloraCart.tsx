"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MAX_LINE_QTY, useCartStore } from "@/store/useCartStore";
import { useStoreConfig } from "@/hooks/useStoreConfig";
import { getApiErrorMessage } from "@/lib/apiError";
import type { CartItemResponse } from "@/types/api/cart.types";
import { DayloraIcon } from "../DayloraIcons";
import { baseProductName, usd } from "./catalog";
import { catalogHref, useDepartments } from "./departments";
import { loadStorefrontCatalog } from "./storefrontCatalog";

/** Message handed over by checkout when it sends the shopper back (stock changed, etc.). */
export const CART_NOTICE_KEY = "ec-cart-notice";

type Problem = "unavailable" | "out" | "over" | null;

/** Why a line can't be bought as it stands (FR-ST-13). */
export function lineProblem(item: CartItemResponse): Problem {
  if (!item.available) return "unavailable";
  if (item.stockQuantity <= 0) return "out";
  if (item.quantity > item.stockQuantity) return "over";
  return null;
}

export const productHref = (item: { urlSlug?: string | null; productId: string }) =>
  `/product/${encodeURIComponent(item.urlSlug || item.productId)}`;

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/**
 * The cart (design 04, FR-ST-09/13): line items with quantity and remove
 * (with undo), stock flags, the free-shipping meter and totals priced by the
 * server, for guests and signed-in customers alike (useCartStore).
 */
export function DayloraCart() {
  const cart = useCartStore((s) => s.cart);
  const storeError = useCartStore((s) => s.error);
  const refresh = useCartStore((s) => s.refresh);
  const add = useCartStore((s) => s.add);
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);
  const config = useStoreConfig();
  const departments = useDepartments();

  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [brands, setBrands] = useState<Map<string, string>>(new Map());
  const [toast, setToast] = useState<{ name: string; productId: string; quantity: number } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const undoRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    refresh().catch(() => setFailed(true));
    try {
      const msg = sessionStorage.getItem(CART_NOTICE_KEY);
      if (msg) {
        setNotice(msg);
        sessionStorage.removeItem(CART_NOTICE_KEY);
      }
    } catch {
      /* storage blocked: nothing to show */
    }
    // Brands come from the catalog (the cart API doesn't carry them); optional.
    loadStorefrontCatalog()
      .then((list) => setBrands(new Map(list.filter((p) => p.brand).map((p) => [p.parentId, p.brand as string]))))
      .catch(() => undefined);
    return () => clearTimeout(toastTimer.current);
  }, [refresh]);

  const run = useCallback(async (productId: string, call: () => Promise<unknown>, fallback: string) => {
    setBusy(productId);
    setError(null);
    try {
      await call();
      return true;
    } catch (e) {
      setError(getApiErrorMessage(e, fallback));
      return false;
    } finally {
      setBusy(null);
    }
  }, []);

  const removeLine = async (item: CartItemResponse, name: string) => {
    const ok = await run(item.productId, () => remove(item.productId), "We couldn't remove that item.");
    if (!ok) return;
    setToast({ name, productId: item.productId, quantity: item.quantity });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 6000);
    requestAnimationFrame(() => undoRef.current?.focus());
  };

  const undo = async () => {
    if (!toast) return;
    const { productId, quantity } = toast;
    setToast(null);
    clearTimeout(toastTimer.current);
    await run(productId, () => add(productId, quantity), "We couldn't put that item back.");
  };

  const removeProblems = async () => {
    const bad = (cart?.items ?? []).filter((i) => lineProblem(i) === "unavailable" || lineProblem(i) === "out");
    for (const item of bad) {
      // One at a time: each call re-prices the cart.
      const ok = await run(item.productId, () => remove(item.productId), "We couldn't remove those items.");
      if (!ok) break;
    }
  };

  const items = cart?.items ?? [];
  const empty = cart !== null && items.length === 0;
  const loading = cart === null && !failed;
  const lowAt = config?.lowStockThreshold ?? 5;

  const toastEl = (
    <div className={`toast${toast ? " show" : ""}`} role="status" aria-live="polite">
      <DayloraIcon name="check" />
      <p>
        {toast && (
          <>
            <b>Removed</b>
            <br />
            {toast.name}
          </>
        )}
      </p>
      <button type="button" id="undoBtn" ref={undoRef} onClick={undo} hidden={!toast}>
        Undo
      </button>
    </div>
  );

  const head = (count: number | null) => (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <DayloraIcon name="chev" />
        <span aria-current="page">Cart</span>
      </nav>
      <div className="cart-head">
        <h1>
          Cart {count !== null && count > 0 && <span>({plural(count, "item")})</span>}
        </h1>
        <Link href="/catalog" className="link cont-link">
          <DayloraIcon name="arrow" className="icon flip" />
          Continue shopping
        </Link>
      </div>
    </>
  );

  if (loading || (failed && !cart)) {
    return (
      <div className="cart-page">
        <main id="main" className="cartpg" aria-busy={loading}>
          <div className="daylora-container">
            {head(null)}
            {failed ? (
              <div className="cart-alert err" role="alert">
                <DayloraIcon name="alert" />
                <span>
                  <b>We couldn&apos;t load your cart.</b>
                  {storeError ?? "Check your connection and try again."}
                </span>
                <button type="button" onClick={() => { setFailed(false); refresh().catch(() => setFailed(true)); }}>
                  Try again
                </button>
              </div>
            ) : (
              <div className="cart-grid">
                <div className="skel" style={{ height: 420 }} />
                <div className="skel" style={{ height: 360 }} />
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="cart-page is-empty">
        <main id="main" className="cartpg">
          <div className="daylora-container">
            {head(0)}
            {notice && (
              <div className="cart-alert" role="status">
                <DayloraIcon name="alert" />
                <span>{notice}</span>
              </div>
            )}
            <div className="cart-grid">
              <div className="cart-empty">
                <span className="empty-ic"><DayloraIcon name="cart" /></span>
                <h2>Your cart is empty</h2>
                <p>
                  Items you add will show up here. Find something you&apos;ll love.
                  {config?.freeShippingThreshold != null && <> Free shipping on orders {usd(config.freeShippingThreshold).replace(".00", "")}+.</>}
                </p>
                <Link href="/catalog" className="btn btn-primary">Start shopping</Link>
                <div className="chips-row">
                  {departments.map((d) => (
                    <Link key={d.slug} href={catalogHref({ dept: d.slug })}>
                      <DayloraIcon name={d.icon} />
                      {d.shortName}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
        {toastEl}
      </div>
    );
  }

  const c = cart!;
  const problems = items.filter((i) => lineProblem(i) !== null);
  const removable = problems.filter((i) => lineProblem(i) !== "over");
  const threshold = c.freeShippingThreshold;
  const freeShip = threshold !== null && c.totalPrice >= threshold;
  const left = threshold !== null ? Math.max(0, +(threshold - c.totalPrice).toFixed(2)) : 0;
  const blocked = problems.length > 0 || c.totalItems === 0;
  const stripe = config?.paymentProvider === "stripe";

  const checkoutBtn = (cls: string, id?: string) =>
    blocked ? (
      <button type="button" className={cls} id={id} disabled aria-describedby="blockedNote">
        Check out
      </button>
    ) : (
      <Link href="/checkout" className={cls} id={id}>
        Check out
      </Link>
    );

  return (
    <div className="cart-page has-lines">
      <main id="main" className="cartpg">
        <div className="daylora-container">
          {head(c.totalItems)}

          {notice && (
            <div className="cart-alert" role="status">
              <DayloraIcon name="alert" />
              <span>{notice}</span>
              <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss message">Dismiss</button>
            </div>
          )}
          {error && (
            <div className="cart-alert err" role="alert">
              <DayloraIcon name="alert" />
              <span>{error}</span>
            </div>
          )}
          {problems.length > 0 && (
            <div className="cart-alert" role="status" id="blockedNote">
              <DayloraIcon name="alert" />
              <span>
                <b>{problems.length === 1 ? "1 item needs your attention" : `${problems.length} items need your attention`}</b>
                {removable.length > 0
                  ? "Items that are unavailable or out of stock aren't included in your total. Remove them to check out."
                  : "Lower the quantity to what's in stock to check out."}
              </span>
              {removable.length > 0 && (
                <button type="button" onClick={removeProblems} disabled={busy !== null}>
                  Remove {removable.length === 1 ? "it" : "them"}
                </button>
              )}
            </div>
          )}

          <div className="cart-grid">
            <section className="cart-list" aria-label="Items in your cart">
              <div className="cl-head">
                <h2>Items</h2>
                <span>{plural(c.totalItems, "item")}</span>
              </div>
              <ul className="lines">
                {items.map((item) => {
                  const problem = lineProblem(item);
                  const name = baseProductName(item.productName, item.color, item.size);
                  const brand = brands.get(item.parentId);
                  const href = productHref(item);
                  const max = Math.max(1, Math.min(MAX_LINE_QTY, item.stockQuantity));
                  const lineBusy = busy === item.productId;
                  const chips = [item.color, item.size && `Size ${item.size}`].filter(Boolean) as string[];
                  if (!chips.length && item.variantName) chips.push(item.variantName);
                  const total = item.unitPrice * item.quantity;
                  const was = item.mrp && item.mrp > item.unitPrice ? item.mrp * item.quantity : 0;
                  const excluded = problem === "unavailable" || problem === "out";
                  return (
                    <li
                      key={item.productId}
                      className={`line${lineBusy ? " is-busy" : ""}${excluded ? " is-problem" : ""}`}
                      aria-busy={lineBusy}
                    >
                      <Link href={href} className="l-media" tabIndex={-1} aria-hidden="true">
                        {item.primaryImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.primaryImageUrl} alt="" loading="lazy" />
                        ) : (
                          <DayloraIcon name="box" />
                        )}
                      </Link>
                      <div className="l-info">
                        {brand && <span className="brand">{brand}</span>}
                        <Link href={href} className="l-name">{name}</Link>
                        {chips.length > 0 && (
                          <span className="l-var">
                            {chips.map((v) => <span key={v} className="chipv">{v}</span>)}
                          </span>
                        )}
                        {problem === "unavailable" ? (
                          <span className="l-stock out">No longer available</span>
                        ) : problem === "out" ? (
                          <span className="l-stock out">Out of stock</span>
                        ) : problem === "over" ? (
                          <span className="l-stock low">Only {item.stockQuantity} left</span>
                        ) : item.stockQuantity <= lowAt ? (
                          <span className="l-stock low">Only {item.stockQuantity} left. Order soon</span>
                        ) : (
                          <span className="l-stock in">In stock</span>
                        )}
                        {excluded && (
                          <span className="l-fix">Not included in your total.</span>
                        )}
                        {problem === "over" && (
                          <span className="l-fix">
                            You have {item.quantity} in your cart.
                            <button
                              type="button"
                              disabled={lineBusy}
                              onClick={() => run(item.productId, () => setQty(item.productId, item.stockQuantity), "We couldn't update that item.")}
                            >
                              Change to {item.stockQuantity}
                            </button>
                          </span>
                        )}
                      </div>
                      <div className="l-actions">
                        {!excluded && (
                          <div className="qty" role="group" aria-label={`Quantity for ${name}`}>
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              disabled={lineBusy || item.quantity <= 1}
                              onClick={() => run(item.productId, () => setQty(item.productId, item.quantity - 1), "We couldn't update that item.")}
                            >
                              −
                            </button>
                            <output aria-live="polite">{item.quantity}</output>
                            <button
                              type="button"
                              aria-label="Increase quantity"
                              disabled={lineBusy || item.quantity >= max}
                              onClick={() => run(item.productId, () => setQty(item.productId, item.quantity + 1), "We couldn't update that item.")}
                            >
                              +
                            </button>
                          </div>
                        )}
                        {!excluded && item.quantity >= max && max < MAX_LINE_QTY && problem !== "over" && (
                          <span className="qty-max">Max {max} available</span>
                        )}
                        <button
                          type="button"
                          className="l-rm"
                          disabled={lineBusy}
                          aria-label={`Remove ${name}`}
                          onClick={() => removeLine(item, name)}
                        >
                          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6" /></svg>
                          Remove
                        </button>
                      </div>
                      <div className={`l-price${excluded ? " excluded" : ""}`}>
                        <b>{usd(total)}</b>
                        {!excluded && was > total && (
                          <>
                            <s><span className="sr-only">Was </span>{usd(was)}</s>
                            <span className="sv">You save {usd(was - total)}</span>
                          </>
                        )}
                        {item.quantity > 1 && <span>{usd(item.unitPrice)} each</span>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <aside className="summary" aria-labelledby="sumH">
              <div className="sum-card">
                <h2 id="sumH">Order summary</h2>
                {threshold !== null && c.totalPrice > 0 && (
                  <div className="ship-meter">
                    {freeShip ? (
                      <>
                        <p>
                          <DayloraIcon name="truck" />
                          <span><b>You&apos;ve got free shipping.</b> Standard delivery is on us.</span>
                        </p>
                        <div className="bar-t" aria-hidden="true"><i style={{ width: "100%" }} /></div>
                      </>
                    ) : (
                      <>
                        <p>
                          <DayloraIcon name="truck" />
                          <span>You&apos;re <b>{usd(left)}</b> away from <b>free shipping</b></span>
                        </p>
                        <div
                          className="bar-t"
                          role="progressbar"
                          aria-label="Progress to free shipping"
                          aria-valuemin={0}
                          aria-valuemax={threshold}
                          aria-valuenow={c.totalPrice}
                        >
                          <i style={{ width: `${Math.min(100, (c.totalPrice / threshold) * 100)}%` }} />
                        </div>
                      </>
                    )}
                  </div>
                )}
                <dl className="sum-rows">
                  <dt>Subtotal ({plural(c.totalItems, "item")})</dt>
                  <dd>{usd(c.totalPrice)}</dd>
                  {c.savings > 0 && (
                    <>
                      <dt className="good">Your savings</dt>
                      <dd className="good">−{usd(c.savings)}<span className="sr-only"> already included in subtotal</span></dd>
                    </>
                  )}
                  <dt>Shipping</dt>
                  <dd>{c.totalPrice > 0 && c.shippingEstimate === 0 ? <span className="free">Free</span> : usd(c.shippingEstimate)}</dd>
                  <dt>{c.pricesIncludeTax ? "Tax (included)" : "Estimated tax"}</dt>
                  <dd>{usd(c.taxTotal)}</dd>
                </dl>
                <div className="sum-total"><span>Estimated total</span><b>{usd(c.grandTotalEstimate)}</b></div>
                {checkoutBtn("btn btn-primary btn-block", "checkoutBtn")}
                <p className="sum-note"><DayloraIcon name="shield" />Secure checkout · guest checkout available</p>
                {stripe && (
                  <div className="pay" aria-label="Accepted payment methods">
                    <span>Visa</span><span>Mastercard</span><span>Amex</span><span>Discover</span><span>Apple Pay</span><span>Google Pay</span>
                  </div>
                )}
              </div>
              <ul className="sum-assure">
                <li><DayloraIcon name="truck" /><span><b>Fast, tracked delivery</b>{config ? `Standard ${config.shippingOptions.find((o) => o.method === "STANDARD")?.estimatedDelivery ?? ""}` : "Tracking on every order"}</span></li>
                <li><DayloraIcon name="return" /><span><b>Free {config?.returnWindowDays ?? 30}-day returns</b>On most items</span></li>
                <li><DayloraIcon name="shield" /><span><b>Secure payment</b>We never store your card details</span></li>
              </ul>
            </aside>
          </div>
        </div>
      </main>
      {toastEl}
      <div className="sticky-bar">
        <div><strong>Estimated total</strong><span>{usd(c.grandTotalEstimate)}</span></div>
        {checkoutBtn("btn btn-primary")}
      </div>
    </div>
  );
}
