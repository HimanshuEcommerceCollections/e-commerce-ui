"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { CART_STORAGE_KEY, MAX_LINE_QTY, useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useStoreConfig } from "@/hooks/useStoreConfig";
import cartService from "@/services/cart.service";
import { getApiErrorMessage } from "@/lib/apiError";
import { getPromoCode, setPromoCode } from "@/lib/promo";
import type { CartItemResponse } from "@/types/api/cart.types";
import { DayloraIcon } from "../DayloraIcons";
import { baseProductName, usd } from "./catalog";
import { catalogHref, useDepartments } from "./departments";
import { fieldError } from "./checkoutShared";
import { PlpCard } from "./PlpCard";
import { toCard, type CardModel } from "./storefrontCards";

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

interface Toast {
  title: string;
  body: string;
  /** A removed line that Undo puts back where it was. */
  undo?: { productId: string; quantity: number; index: number };
}

/**
 * The cart (design 04, FR-ST-09/13): line items with quantity and remove
 * (with undo), stock flags, the free-shipping meter, a promo code and totals
 * priced by the server, plus recommendations, for guests and signed-in
 * customers alike (useCartStore).
 */
export function DayloraCart() {
  const cart = useCartStore((s) => s.cart);
  const guestLines = useCartStore((s) => s.lines);
  const storeError = useCartStore((s) => s.error);
  const refresh = useCartStore((s) => s.refresh);
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);
  const restore = useCartStore((s) => s.restore);
  const syncFromStorage = useCartStore((s) => s.syncFromStorage);
  const userEmail = useAuthStore((s) => (s.user?.role === "ROLE_CUSTOMER" ? s.user.email : undefined));
  const config = useStoreConfig();
  const departments = useDepartments();

  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [recs, setRecs] = useState<CardModel[]>([]);
  /** Lines put back with Undo on a server cart, held at their old position. */
  const [placed, setPlaced] = useState<Map<string, number>>(new Map());
  const [promoInput, setPromoInput] = useState("");
  const [promoMsg, setPromoMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [promoBusy, setPromoBusy] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const undoRef = useRef<HTMLButtonElement>(null);
  const promoRef = useRef<HTMLInputElement>(null);

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
    return () => clearTimeout(toastTimer.current);
  }, [refresh]);

  // Keep this page in step when another tab changes the cart.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY) syncFromStorage().catch(() => undefined);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [syncFromStorage]);

  // A stored code the server no longer applies (e.g. the cart dropped below its minimum).
  const appliedCode = cart?.promo?.code ?? null;
  useEffect(() => {
    if (!cart || cart.items.length === 0) return;
    const stored = getPromoCode();
    if (stored && !cart.promo) {
      setPromoCode(null);
      setPromoMsg({ ok: false, text: cart.promoError || `${stored} no longer applies to your cart.` });
    }
  }, [cart]);

  // Recommendations: from the departments in the cart, or popular items for an empty cart.
  const recKey = useMemo(() => (cart ? cart.items.map((i) => i.productId).sort().join(",") : null), [cart]);
  useEffect(() => {
    if (recKey === null) return;
    let live = true;
    cartService
      .recommendations(recKey ? recKey.split(",") : [], 4)
      .then((res) => live && setRecs((res.data.data ?? []).map(toCard)))
      .catch(() => live && setRecs([]));
    return () => {
      live = false;
    };
  }, [recKey]);

  const showToast = (t: Toast) => {
    setToast(t);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 6000);
  };

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

  const removeLine = async (item: CartItemResponse, name: string, index: number) => {
    const ok = await run(item.productId, () => remove(item.productId), "We couldn't remove that item.");
    if (!ok) return;
    showToast({ title: "Removed", body: name, undo: { productId: item.productId, quantity: item.quantity, index } });
    requestAnimationFrame(() => undoRef.current?.focus());
  };

  const undo = async () => {
    const u = toast?.undo;
    if (!u) return;
    setToast(null);
    clearTimeout(toastTimer.current);
    const ok = await run(u.productId, () => restore(u.productId, u.quantity, u.index), "We couldn't put that item back.");
    if (ok) setPlaced((m) => new Map(m).set(u.productId, u.index));
  };

  const removeProblems = async () => {
    const bad = (cart?.items ?? []).filter((i) => lineProblem(i) === "unavailable" || lineProblem(i) === "out");
    for (const item of bad) {
      // One at a time: each call re-prices the cart.
      const ok = await run(item.productId, () => remove(item.productId), "We couldn't remove those items.");
      if (!ok) break;
    }
  };

  const applyPromo = async (e: FormEvent) => {
    e.preventDefault();
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      setPromoMsg({ ok: false, text: "Enter a promo code." });
      promoRef.current?.focus();
      return;
    }
    setPromoBusy(true);
    try {
      const lines = cart?.items.map((i) => ({ productId: i.productId, quantity: i.quantity })) ?? guestLines;
      const res = await cartService.validatePromo(code, lines, userEmail);
      const promo = res.data.data;
      setPromoCode(promo?.code ?? code);
      await refresh().catch(() => undefined);
      const description = promo?.description ?? "";
      setPromoMsg({ ok: true, text: `${promo?.code ?? code} applied${description ? `: ${description}` : ""}.` });
      setPromoInput("");
      showToast({ title: "Promo applied", body: description });
    } catch (err) {
      const msg = fieldError(err, "code");
      const unknown = !msg || /isn.t a valid code/i.test(msg);
      const status = (err as { response?: { status?: number } }).response?.status;
      setPromoMsg({
        ok: false,
        text:
          status === 400 || msg
            ? unknown
              ? `“${code}” isn't a valid code. Check the spelling, or try WELCOME10.`
              : msg!
            : getApiErrorMessage(err, "We couldn't check that code. Try again."),
      });
      promoRef.current?.focus();
    } finally {
      setPromoBusy(false);
    }
  };

  const removePromo = async () => {
    setPromoCode(null);
    setPromoMsg(null);
    await refresh().catch(() => undefined);
  };

  const items = useMemo(() => {
    const list = cart?.items ?? [];
    if (!placed.size) return list;
    // Server carts append a re-added line; show it where it was before Undo.
    const out = list.filter((i) => !placed.has(i.productId));
    list
      .filter((i) => placed.has(i.productId))
      .sort((a, b) => placed.get(a.productId)! - placed.get(b.productId)!)
      .forEach((i) => out.splice(Math.min(placed.get(i.productId)!, out.length), 0, i));
    return out;
  }, [cart, placed]);
  const empty = cart !== null && items.length === 0;
  const loading = cart === null && !failed;
  const lowAt = config?.lowStockThreshold ?? 5;

  const toastEl = (
    <div className={`toast${toast ? " show" : ""}`} role="status" aria-live="polite">
      <DayloraIcon name="check" />
      <p>
        {toast && (
          <>
            <b>{toast.title}</b>
            {toast.body && (
              <>
                <br />
                {toast.body}
              </>
            )}
          </>
        )}
      </p>
      <button type="button" id="undoBtn" ref={undoRef} onClick={undo} hidden={!toast?.undo}>
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

  const rail = recs.length > 0 && (
    <section className="more-rail" aria-labelledby="recH">
      <div className="rail-head">
        <h2 id="recH">{items.length ? "You might also like" : "Popular right now"}</h2>
        <Link href="/catalog?sort=pop" className="link">See all</Link>
      </div>
      <div className="mgrid">
        {recs.map((x) => (
          <PlpCard key={x.id} c={x} colors={null} delay={0} />
        ))}
      </div>
    </section>
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
            {rail}
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
  const promo = c.promo ?? null;
  const freeShip = (threshold !== null && c.totalPrice >= threshold) || (!!promo?.freeShipping && c.shippingEstimate === 0);
  const left = threshold !== null ? Math.max(0, +(threshold - c.totalPrice).toFixed(2)) : 0;
  const blocked = problems.length > 0 || c.totalItems === 0;
  const stripe = config?.paymentProvider === "stripe";
  const taxPending = !!c.taxIsEstimate && !c.pricesIncludeTax;
  // Tax isn't known until checkout has an address: leave it out of the estimate.
  const estTotal = taxPending ? +(c.grandTotalEstimate - c.taxTotal).toFixed(2) : c.grandTotalEstimate;
  const discount = promo?.discount ?? c.discountTotal ?? 0;

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
                {items.map((item, index) => {
                  const problem = lineProblem(item);
                  const name = baseProductName(item.productName, item.color, item.size);
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
                        {item.brand && <span className="brand">{item.brand}</span>}
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
                          onClick={() => removeLine(item, name, index)}
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
                          <Link href="/catalog?deals=1">Shop deals</Link>
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
                  {promo && (
                    <>
                      <dt className="good">
                        Promo {promo.code}
                        <button type="button" onClick={removePromo} aria-label={`Remove promo code ${promo.code}`}>Remove</button>
                      </dt>
                      <dd className="good">{discount > 0 ? `−${usd(discount)}` : "Applied"}</dd>
                    </>
                  )}
                  <dt>Shipping</dt>
                  <dd>{c.totalPrice > 0 && c.shippingEstimate === 0 ? <span className="free">Free</span> : usd(c.shippingEstimate)}</dd>
                  <dt>{c.pricesIncludeTax ? "Tax (included)" : "Estimated tax"}</dt>
                  {taxPending ? <dd className="muted">Calculated at checkout</dd> : <dd>{usd(c.taxTotal)}</dd>}
                </dl>
                {config?.promoCodesEnabled !== false && (
                  <details className="promo" hidden={!!appliedCode}>
                    <summary>
                      Have a promo code?
                      <DayloraIcon name="chev" />
                    </summary>
                    <form className="promo-form" noValidate onSubmit={applyPromo}>
                      <label className="sr-only" htmlFor="promoIn">Promo code</label>
                      <input
                        id="promoIn"
                        ref={promoRef}
                        autoComplete="off"
                        autoCapitalize="characters"
                        placeholder="Enter code"
                        aria-describedby="promoMsg"
                        aria-invalid={promoMsg && !promoMsg.ok ? true : undefined}
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                      />
                      <button className="btn btn-secondary" type="submit" disabled={promoBusy}>Apply</button>
                    </form>
                    <p className={`promo-msg${promoMsg ? (promoMsg.ok ? " ok" : " err") : ""}`} id="promoMsg" role="status">
                      {promoMsg?.text}
                    </p>
                  </details>
                )}
                <div className="sum-total"><span>Estimated total</span><b>{usd(estTotal)}</b></div>
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
          {rail}
        </div>
      </main>
      {toastEl}
      <div className="sticky-bar">
        <div><strong>Estimated total</strong><span>{usd(estTotal)}</span></div>
        {checkoutBtn("btn btn-primary")}
      </div>
    </div>
  );
}
