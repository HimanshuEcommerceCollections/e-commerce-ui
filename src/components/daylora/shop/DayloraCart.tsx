"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import { useStoreConfig } from "@/hooks/useStoreConfig";
import { getApiErrorMessage } from "@/lib/apiError";
import type { CartItemResponse } from "@/types/api/cart.types";
import { DayloraIcon } from "../DayloraIcons";
import { usd } from "./catalog";

const MAX_QTY = 10;

/**
 * The cart (FR-ST-09): change quantity, remove, and totals with tax and
 * shipping as checkout will charge them. Unavailable or out-of-stock lines
 * are marked and block checkout until fixed (FR-ST-13).
 */
export function DayloraCart() {
  const { cart, fetchCart, updateItem, removeItem } = useCart();
  const config = useStoreConfig();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Your cart · Daylora";
    const token = !!localStorage.getItem("accessToken");
    setSignedIn(token);
    if (token) fetchCart().finally(() => setLoaded(true));
    else setLoaded(true);
    // fetchCart is recreated each render; load once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const change = async (item: CartItemResponse, quantity: number) => {
    setBusy(item.productId);
    setError(null);
    try {
      await updateItem(item.productId, { quantity });
    } catch (err) {
      setError(getApiErrorMessage(err, "We couldn't update that item."));
    } finally {
      setBusy(null);
    }
  };

  const remove = async (item: CartItemResponse) => {
    setBusy(item.productId);
    setError(null);
    try {
      await removeItem(item.productId);
    } catch (err) {
      setError(getApiErrorMessage(err, "We couldn't remove that item."));
    } finally {
      setBusy(null);
    }
  };

  if (signedIn === false) {
    return (
      <main id="main" className="acct">
        <div className="daylora-container">
          <div className="empty">
            <span className="empty-ic"><DayloraIcon name="cart" /></span>
            <h2>Sign in to see your cart</h2>
            <p>Your cart is saved to your account, so it&apos;s there on any device.</p>
            <Link className="btn btn-primary" href="/login?next=/cart">Sign in</Link>
          </div>
        </div>
      </main>
    );
  }

  if (!loaded || signedIn === null) {
    return (
      <main id="main" className="acct" aria-busy="true">
        <div className="daylora-container">
          <div className="skel" style={{ height: 36, width: 200, marginBottom: 24 }} />
          <div className="acct-grid">
            <div className="skel" style={{ height: 320, borderRadius: 16 }} />
            <div className="skel" style={{ height: 260, borderRadius: 16 }} />
          </div>
        </div>
      </main>
    );
  }

  const items = cart?.items ?? [];
  if (!items.length) {
    return (
      <main id="main" className="acct">
        <div className="daylora-container">
          <div className="empty">
            <span className="empty-ic"><DayloraIcon name="cart" /></span>
            <h2>Your cart is empty</h2>
            <p>Find something you&apos;ll use every day.</p>
            <Link className="btn btn-primary" href="/catalog">Start shopping</Link>
          </div>
        </div>
      </main>
    );
  }

  const problems = items.filter((i) => !i.available || i.quantity > i.stockQuantity);
  const threshold = cart!.freeShippingThreshold;
  const toFree = threshold ? Math.max(0, threshold - cart!.totalPrice) : 0;

  return (
    <main id="main" className="acct">
      <div className="daylora-container">
        <div className="acct-head">
          <h1>Your cart</h1>
          <p>{cart!.totalItems} item{cart!.totalItems === 1 ? "" : "s"}</p>
        </div>

        {error && <p className="notice err" role="alert"><DayloraIcon name="alert" />{error}</p>}
        {problems.length > 0 && (
          <div className="notice warn" role="status">
            <DayloraIcon name="alert" />
            <div>
              <strong>Some items need your attention</strong>
              Update or remove them to check out.
            </div>
          </div>
        )}

        <div className="acct-grid">
          <section className="panel" aria-label="Items in your cart">
            <ul className="lines">
              {items.map((item) => {
                const outOfStock = item.available && item.stockQuantity <= 0;
                const overStock = item.available && !outOfStock && item.quantity > item.stockQuantity;
                const max = Math.max(1, Math.min(MAX_QTY, item.stockQuantity));
                const meta = [item.color, item.size].filter(Boolean).join(" · ") || item.variantName;
                return (
                  <li className="line" key={item.productId}>
                    <Link href={`/product/${item.productId}`} className="line-img" aria-hidden="true" tabIndex={-1}>
                      {item.primaryImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.primaryImageUrl} alt="" loading="lazy" />
                      ) : (
                        <DayloraIcon name="box" />
                      )}
                    </Link>
                    <div className="line-body">
                      <Link href={`/product/${item.productId}`} className="line-name">{item.productName}</Link>
                      {meta && <span className="line-meta">{meta}</span>}
                      <span className="line-meta">SKU {item.sku} · {usd(item.unitPrice)} each</span>
                      {!item.available && <span className="line-flag out">No longer available</span>}
                      {outOfStock && <span className="line-flag out">Out of stock</span>}
                      {overStock && <span className="line-flag low">Only {item.stockQuantity} left — lower the quantity</span>}
                      {item.available && !outOfStock && !overStock && item.stockQuantity <= 5 && (
                        <span className="line-flag low">Only {item.stockQuantity} left</span>
                      )}
                      <div className="line-actions">
                        {item.available && !outOfStock && (
                          <div className="qty sm" role="group" aria-label={`Quantity for ${item.productName}`}>
                            <button
                              aria-label="Decrease quantity"
                              disabled={busy === item.productId || item.quantity <= 1}
                              onClick={() => change(item, item.quantity - 1)}
                            >−</button>
                            <output aria-live="polite">{item.quantity}</output>
                            <button
                              aria-label="Increase quantity"
                              disabled={busy === item.productId || item.quantity >= max}
                              onClick={() => change(item, item.quantity + 1)}
                            >+</button>
                          </div>
                        )}
                        {overStock && (
                          <button className="link-btn" disabled={busy === item.productId} onClick={() => change(item, item.stockQuantity)}>
                            Set to {item.stockQuantity}
                          </button>
                        )}
                        <button className="link-btn danger" disabled={busy === item.productId} onClick={() => remove(item)}>
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="line-price">
                      {usd(item.subtotal)}
                      {item.mrp && item.mrp > item.unitPrice && <span className="was">{usd(item.mrp * item.quantity)}</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <aside className="panel panel-sticky" aria-label="Order summary">
            <h2>Order summary</h2>
            {threshold !== null && (
              <div className="ship-progress">
                <p>
                  {toFree > 0 ? <>Add <b>{usd(toFree)}</b> for free standard shipping</> : <>You&apos;ve got free standard shipping</>}
                </p>
                <div className="bar"><i style={{ width: `${Math.min(100, (cart!.totalPrice / threshold) * 100)}%` }} /></div>
              </div>
            )}
            <div className="sum-row"><span>Subtotal</span><span>{usd(cart!.totalPrice)}</span></div>
            <div className={`sum-row${cart!.shippingEstimate === 0 ? " free" : ""}`}>
              <span>Standard shipping</span>
              <span>{cart!.shippingEstimate === 0 ? "Free" : usd(cart!.shippingEstimate)}</span>
            </div>
            <div className="sum-row">
              <span>{cart!.pricesIncludeTax ? "Tax included" : "Estimated tax"}</span>
              <span>{usd(cart!.taxTotal)}</span>
            </div>
            <div className="sum-total"><span>Total</span><span>{usd(cart!.grandTotalEstimate)}</span></div>
            <p className="sum-note">Express shipping and final tax are shown at checkout.</p>
            {problems.length ? (
              <button className="btn btn-primary sum-cta" disabled>Fix items to check out</button>
            ) : (
              <Link className="btn btn-primary sum-cta" href="/checkout">Checkout</Link>
            )}
            <div className="trust-mini">
              <span><DayloraIcon name="shield" />Secure checkout — we never store your card</span>
              <span><DayloraIcon name="return" />Returns within {config?.returnWindowDays ?? 30} days of delivery</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
