"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import addressService from "@/services/address.service";
import orderService from "@/services/order.service";
import { useCart } from "@/hooks/useCart";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { getApiErrorMessage } from "@/lib/apiError";
import { track } from "@/lib/analytics";
import type { AddressRequest, AddressResponse } from "@/types/api/address.types";
import type { CheckoutQuote, Order, ShippingMethod } from "@/types/api/order.types";
import { DayloraIcon } from "../DayloraIcons";
import { usd } from "./catalog";

const STRIPE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
let stripePromise: Promise<Stripe | null> | null = null;
const getStripe = () => (STRIPE_KEY ? (stripePromise ??= loadStripe(STRIPE_KEY)) : null);

const EMPTY_ADDRESS: AddressRequest = {
  label: "Home",
  recipientName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "US",
};

const newKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`.replace(".", "");

/**
 * Checkout (FR-ST-10): customer details, shipping address, shipping method,
 * review, payment. Card details go only to Stripe Elements — never to our
 * server (NFR-07). Under the manual gateway the order is placed for staff to
 * confirm payment. The Idempotency-Key makes a double submit return the same
 * order instead of a second one; a failed payment leaves the order
 * unconfirmed (FR-IN-02) and can be retried.
 */
export function DayloraCheckout() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { cart, fetchCart } = useCart();
  const clearCartState = useCartStore((s) => s.clearCartState);

  const [ready, setReady] = useState(false);
  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<AddressRequest>(EMPTY_ADDRESS);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [method, setMethod] = useState<ShippingMethod>("STANDARD");
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<{ order: Order; clientSecret: string } | null>(null);
  const idempotencyKey = useRef(newKey());
  const tracked = useRef(false);

  useEffect(() => {
    document.title = "Checkout · Daylora";
    if (!localStorage.getItem("accessToken")) {
      router.replace("/login?next=/checkout");
      return;
    }
    Promise.all([fetchCart(), addressService.getAll()])
      .then(([, res]) => {
        const list = res.data.data ?? [];
        setAddresses(list);
        setAddressId((list.find((a) => a.isDefault) ?? list[0])?.id ?? null);
        setAdding(list.length === 0);
      })
      .catch((err) => setError(getApiErrorMessage(err, "We couldn't load checkout.")))
      .finally(() => setReady(true));
    // Load once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Totals for the chosen shipping method (FR-ST-10).
  useEffect(() => {
    if (!ready || placed) return;
    let live = true;
    orderService
      .quote(method)
      .then((res) => live && setQuote(res.data.data))
      .catch((err) => live && setError(getApiErrorMessage(err, "We couldn't price your order.")));
    return () => { live = false; };
  }, [ready, method, placed, cart?.updatedAt]);

  useEffect(() => {
    if (!tracked.current && quote && cart?.items.length) {
      tracked.current = true;
      track("CHECKOUT_START", { value: quote.grandTotal, currency: quote.currency, properties: { items: cart.totalItems } });
    }
  }, [quote, cart]);

  const items = useMemo(() => (cart?.items ?? []).filter((i) => i.available), [cart]);
  const blocked = (cart?.items ?? []).some((i) => !i.available || i.quantity > i.stockQuantity);

  const saveAddress = async (e: FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    for (const k of ["recipientName", "addressLine1", "city", "state", "postalCode", "country"] as const) {
      if (!form[k]?.trim()) errors[k] = "Required";
    }
    setFormErrors(errors);
    if (Object.keys(errors).length) return;
    try {
      const res = await addressService.create({
        ...form,
        phone: form.phone?.trim() || undefined,
        addressLine2: form.addressLine2?.trim() || undefined,
        isDefault: addresses.length === 0,
      });
      const saved = res.data.data!;
      setAddresses((prev) => [...prev, saved]);
      setAddressId(saved.id);
      setAdding(false);
      setForm(EMPTY_ADDRESS);
    } catch (err) {
      const fields = (err as { response?: { data?: { data?: Record<string, string> } } }).response?.data?.data;
      if (fields && typeof fields === "object") setFormErrors(fields);
      setError(getApiErrorMessage(err, "We couldn't save that address."));
    }
  };

  const placeOrder = async () => {
    if (!addressId || placing) return;
    setPlacing(true);
    setError(null);
    try {
      const res = await orderService.checkout({ addressId, shippingMethod: method }, idempotencyKey.current);
      const { order, clientSecret } = res.data.data!;
      clearCartState(); // the order consumed the cart
      if (clientSecret && getStripe()) {
        setPlaced({ order, clientSecret });
      } else {
        router.push(`/orders/${order.id}?placed=1`);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "We couldn't place your order. Please try again."));
      // A new attempt after a real failure (stock, address) is a new request.
      idempotencyKey.current = newKey();
    } finally {
      setPlacing(false);
    }
  };

  if (!ready) {
    return (
      <main id="main" className="acct" aria-busy="true">
        <div className="daylora-container">
          <div className="skel" style={{ height: 36, width: 200, marginBottom: 24 }} />
          <div className="acct-grid">
            <div className="skel" style={{ height: 420, borderRadius: 16 }} />
            <div className="skel" style={{ height: 300, borderRadius: 16 }} />
          </div>
        </div>
      </main>
    );
  }

  if (!placed && !items.length) {
    return (
      <main id="main" className="acct">
        <div className="daylora-container">
          <div className="empty">
            <span className="empty-ic"><DayloraIcon name="cart" /></span>
            <h2>Your cart is empty</h2>
            <p>Add something to your cart to check out.</p>
            <Link className="btn btn-primary" href="/catalog">Shop products</Link>
          </div>
        </div>
      </main>
    );
  }

  const address = addresses.find((a) => a.id === addressId);
  const field = (k: keyof AddressRequest, label: string, opts: { full?: boolean; type?: string; auto?: string } = {}) => (
    <div className={`field${opts.full ? " full" : ""}${formErrors[k] ? " has-error" : ""}`}>
      <label htmlFor={`a-${k}`}>{label}</label>
      <input
        id={`a-${k}`}
        type={opts.type ?? "text"}
        autoComplete={opts.auto}
        value={(form[k] as string) ?? ""}
        onChange={(e) => setForm({ ...form, [k]: e.target.value })}
      />
      {formErrors[k] && <span className="err">{formErrors[k]}</span>}
    </div>
  );

  return (
    <main id="main" className="acct">
      <div className="daylora-container">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/cart">Cart</Link>
          <DayloraIcon name="chev" />
          <span aria-current="page">Checkout</span>
        </nav>
        <div className="acct-head"><h1>Checkout</h1></div>

        {error && <p className="notice err" role="alert"><DayloraIcon name="alert" />{error}</p>}
        {blocked && !placed && (
          <p className="notice warn" role="status">
            <DayloraIcon name="alert" />
            <span>Some items in your cart are unavailable or low in stock. <Link href="/cart">Review your cart</Link>.</span>
          </p>
        )}

        <div className="acct-grid">
          <div>
            {/* 1 · Customer */}
            <section className="panel step-done" aria-labelledby="st-contact">
              <div className="step-head"><span className="step-n">1</span><h2 id="st-contact">Your details</h2></div>
              <p>{user?.fullName}</p>
              <p className="line-meta">{user?.email}{user?.phoneNumber ? ` · ${user.phoneNumber}` : ""}</p>
            </section>

            {/* 2 · Address */}
            <section className={`panel${address ? " step-done" : ""}`} aria-labelledby="st-address">
              <div className="step-head"><span className="step-n">2</span><h2 id="st-address">Shipping address</h2></div>
              {addresses.length > 0 && !placed && (
                <div className="choices" role="radiogroup" aria-label="Saved addresses">
                  {addresses.map((a) => (
                    <label className="choice" key={a.id}>
                      <input type="radio" name="address" checked={addressId === a.id} onChange={() => setAddressId(a.id)} />
                      <span className="c-main">
                        <span className="c-title">{a.recipientName} <span className="pill">{a.label}</span></span>
                        <span className="c-sub" style={{ display: "block" }}>
                          {a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ""}, {a.city}, {a.state} {a.postalCode}, {a.country}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
              {placed && address && (
                <address className="addr">
                  {address.recipientName}<br />{address.addressLine1}<br />{address.city}, {address.state} {address.postalCode}
                </address>
              )}
              {!placed && (adding ? (
                <form onSubmit={saveAddress} style={{ marginTop: addresses.length ? 16 : 0 }} noValidate>
                  <div className="form-grid">
                    {field("recipientName", "Full name", { full: true, auto: "name" })}
                    {field("addressLine1", "Address", { full: true, auto: "address-line1" })}
                    {field("addressLine2", "Apartment, suite (optional)", { full: true, auto: "address-line2" })}
                    {field("city", "City", { auto: "address-level2" })}
                    {field("state", "State", { auto: "address-level1" })}
                    {field("postalCode", "ZIP / postal code", { auto: "postal-code" })}
                    {field("country", "Country", { auto: "country" })}
                    {field("phone", "Phone (for delivery updates)", { type: "tel", auto: "tel" })}
                    {field("label", "Label (Home, Work…)")}
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary">Use this address</button>
                    {addresses.length > 0 && (
                      <button type="button" className="btn btn-secondary" onClick={() => setAdding(false)}>Cancel</button>
                    )}
                  </div>
                </form>
              ) : (
                <button className="link-btn" style={{ marginTop: 12 }} onClick={() => setAdding(true)}>+ Add a new address</button>
              ))}
            </section>

            {/* 3 · Shipping method */}
            <section className="panel" aria-labelledby="st-ship">
              <div className="step-head"><span className="step-n">3</span><h2 id="st-ship">Shipping method</h2></div>
              <div className="choices" role="radiogroup" aria-label="Shipping method">
                {(quote?.shippingOptions ?? []).map((o) => (
                  <label className="choice" key={o.method}>
                    <input type="radio" name="ship" disabled={!!placed} checked={method === o.method} onChange={() => setMethod(o.method)} />
                    <span className="c-main">
                      <span className="c-title">{o.label}</span>
                      <span className="c-sub" style={{ display: "block" }}>{o.estimatedDelivery}</span>
                    </span>
                    <span className={`c-price${o.fee === 0 ? " free" : ""}`}>{o.fee === 0 ? "Free" : usd(o.fee)}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* 4 · Payment */}
            <section className="panel" aria-labelledby="st-pay">
              <div className="step-head"><span className="step-n">4</span><h2 id="st-pay">Payment</h2></div>
              {placed ? (
                <Elements stripe={getStripe()} options={{ clientSecret: placed.clientSecret, appearance: { theme: "stripe" } }}>
                  <StripePayment order={placed.order} />
                </Elements>
              ) : STRIPE_KEY ? (
                <p className="pay-box">
                  <DayloraIcon name="shield" /> You&apos;ll enter your card on the next step, on Stripe&apos;s secure form. We never see or store your card details.
                </p>
              ) : (
                <p className="pay-box">
                  We&apos;ll confirm your payment and email you as soon as the order is confirmed. Your order isn&apos;t charged or
                  shipped until then.
                </p>
              )}
            </section>
          </div>

          {/* 5 · Review */}
          <aside className="panel panel-sticky" aria-label="Review your order">
            <h2>Review</h2>
            <ul className="review-items">
              {items.map((i) => (
                <li className="review-item" key={i.productId}>
                  <span>{i.quantity} × {i.productName}</span>
                  <span>{usd(i.subtotal)}</span>
                </li>
              ))}
            </ul>
            {quote && (
              <>
                <div className="sum-row"><span>Subtotal</span><span>{usd(quote.subtotal)}</span></div>
                <div className={`sum-row${quote.shippingTotal === 0 ? " free" : ""}`}>
                  <span>Shipping</span>
                  <span>{quote.shippingTotal === 0 ? "Free" : usd(quote.shippingTotal)}</span>
                </div>
                <div className="sum-row"><span>{quote.pricesIncludeTax ? "Tax included" : "Tax"}</span><span>{usd(quote.taxTotal)}</span></div>
                <div className="sum-total"><span>Total</span><span>{usd(placed ? placed.order.grandTotal : quote.grandTotal)}</span></div>
              </>
            )}
            {!placed && (
              <button
                className="btn btn-primary sum-cta"
                disabled={!addressId || adding || placing || blocked || !quote}
                onClick={placeOrder}
              >
                {placing ? "Placing order…" : STRIPE_KEY ? "Continue to payment" : "Place order"}
              </button>
            )}
            {!addressId && !placed && <p className="sum-note">Add a shipping address to continue.</p>}
            <div className="trust-mini">
              <span><DayloraIcon name="shield" />Secure checkout — card data goes only to our payment provider</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

/** Stripe Payment Element for an order that's been placed (FR-IN-01). */
function StripePayment({ order }: { order: Order }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || paying) return;
    setPaying(true);
    setError(null);
    const { error: failure } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/orders/${order.id}?placed=1` },
      redirect: "if_required",
    });
    if (failure) {
      // FR-IN-02: the order stays unpaid and nothing ships; the shopper can try again.
      setError(failure.message ?? "Your payment didn't go through. Please try another card.");
      setPaying(false);
      return;
    }
    router.push(`/orders/${order.id}?placed=1`);
  };

  return (
    <form onSubmit={pay}>
      <p className="line-meta">Order {order.orderNumber} is reserved for you. Complete payment to confirm it.</p>
      <div className="pay-element"><PaymentElement /></div>
      {error && <p className="notice err" role="alert"><DayloraIcon name="alert" />{error}</p>}
      <button className="btn btn-primary sum-cta" disabled={!stripe || paying}>
        {paying ? "Processing…" : `Pay ${usd(order.grandTotal)}`}
      </button>
    </form>
  );
}
