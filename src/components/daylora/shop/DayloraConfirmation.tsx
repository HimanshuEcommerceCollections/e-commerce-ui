"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import orderService from "@/services/order.service";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useStoreConfig } from "@/hooks/useStoreConfig";
import { getApiErrorMessage } from "@/lib/apiError";
import { OrderStatus, PaymentStatus, type Order } from "@/types/api/order.types";
import { DayloraIcon } from "../DayloraIcons";
import { baseProductName, usd } from "./catalog";
import { addBusinessDays, CheckoutFooter, CheckoutHeader, fmtDay, readGuestOrder, type GuestOrderRef } from "./checkoutShared";

const ATTEMPT_KEY = "ec-checkout-attempt";

/** New-password rule (CONTRACT §4 Auth): 8+ characters with a letter and a digit. */
const passwordError = (v: string) =>
  !v ? "Create a password." : v.length < 8 || !/[A-Za-z]/.test(v) || !/\d/.test(v) ? "Use at least 8 characters with a letter and a number." : "";

/**
 * Order confirmation (design 06, FR-ST-11): order number, email, delivery
 * window and timeline, address, payment state, items and totals, plus
 * one-field account creation for guests.
 */
export function DayloraConfirmation({ orderNumber }: { orderNumber: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearCart = useCartStore((s) => s.clear);
  const mergeAfterLogin = useCartStore((s) => s.mergeAfterLogin);
  const config = useStoreConfig();
  const signedIn = user?.role === "ROLE_CUSTOMER";

  const [order, setOrder] = useState<Order | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [guestRef, setGuestRef] = useState<GuestOrderRef | null>(null);
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [accountState, setAccountState] = useState<"idle" | "saving" | "done" | "exists">("idle");
  const [accountError, setAccountError] = useState<string | null>(null);

  useEffect(() => {
    // Back from a bank / wallet page (Stripe redirect): a failure returns to checkout.
    if (params.get("redirect_status") === "failed") {
      router.replace("/checkout?payment=failed");
      return;
    }
    // A paid order whose cart wasn't cleared yet (redirect flows).
    try {
      const attempt = JSON.parse(sessionStorage.getItem(ATTEMPT_KEY) || "null") as { orderNumber?: string } | null;
      if (attempt?.orderNumber && attempt.orderNumber.toUpperCase() === orderNumber.toUpperCase()) {
        sessionStorage.removeItem(ATTEMPT_KEY);
        clearCart().catch(() => undefined);
      }
    } catch {
      /* ignore */
    }

    const ref = readGuestOrder(orderNumber);
    setGuestRef(ref);
    let live = true;
    (async () => {
      const attempts: (() => Promise<Order | null>)[] = [];
      if (ref) attempts.push(async () => (await orderService.getGuestOrder(orderNumber, ref.guestToken)).data.data ?? null);
      if (useAuthStore.getState().user?.role === "ROLE_CUSTOMER")
        attempts.push(async () => (await orderService.getOrder(orderNumber)).data.data ?? null);
      let lastStatus: number | undefined;
      for (const load of attempts) {
        try {
          const o = await load();
          if (o && live) {
            setOrder(o);
            setState("ready");
            document.title = `Order ${o.orderNumber} | Ecommerce Collections`;
            return;
          }
        } catch (e) {
          lastStatus = (e as { response?: { status?: number } }).response?.status;
        }
      }
      if (live) setState(attempts.length === 0 || lastStatus === 404 || lastStatus === 403 || lastStatus === 401 ? "missing" : "error");
    })();
    return () => {
      live = false;
    };
    // Load once per order number.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber]);

  const createAccount = async (e: FormEvent) => {
    e.preventDefault();
    if (!order || !guestRef) return;
    const msg = passwordError(password);
    setPwError(msg);
    if (msg) {
      document.getElementById("pw")?.focus();
      return;
    }
    setAccountState("saving");
    setAccountError(null);
    try {
      const res = await orderService.createAccountFromOrder(order.orderNumber, guestRef.guestToken, password);
      const auth = res.data.data;
      if (auth) {
        setAuth(auth);
        await mergeAfterLogin().catch(() => undefined);
      }
      setAccountState("done");
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 409) {
        setAccountState("exists");
        return;
      }
      setAccountState("idle");
      setAccountError(getApiErrorMessage(err, "We couldn't create your account. Try again."));
    }
  };

  const shell = (body: React.ReactNode) => (
    <div className="co-page">
      <a className="skip" href="#main">Skip to content</a>
      <CheckoutHeader back="shop" />
      <main id="main" className="conf">
        <div className="daylora-container conf-wrap" style={{ margin: "0 auto" }}>{body}</div>
      </main>
      <CheckoutFooter />
    </div>
  );

  if (state === "loading") {
    return shell(
      <div aria-busy="true" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div className="skel" style={{ height: 220 }} />
        <div className="skel" style={{ height: 160 }} />
        <div className="skel" style={{ height: 260 }} />
      </div>
    );
  }

  if (state !== "ready" || !order) {
    return shell(
      <section className="conf-hero">
        <span className="conf-check" aria-hidden="true" style={{ background: "var(--surface)", color: "var(--navy)", animation: "none" }}>
          <DayloraIcon name="box" />
        </span>
        <h1>{state === "error" ? "We couldn't load this order" : "We couldn't find that order here"}</h1>
        <p>
          {state === "error"
            ? "Check your connection and try again. Your order is safe — we've emailed you a confirmation."
            : `Order ${orderNumber} isn't available in this browser. Look it up with your order number and the email or ZIP code you used, or sign in to see your orders.`}
        </p>
        <div className="conf-actions" style={{ marginTop: 8 }}>
          {state === "error" ? (
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>Try again</button>
          ) : (
            <Link href={`/track?o=${encodeURIComponent(orderNumber)}`} className="btn btn-primary">Track an order</Link>
          )}
          <Link href="/catalog" className="btn btn-secondary">Continue shopping</Link>
        </div>
      </section>
    );
  }

  // ── Derived display values ──
  const first = order.shippingAddress.recipientName.trim().split(/\s+/)[0] || "there";
  const placed = order.createdAt;
  const option = config?.shippingOptions.find((o) => o.method === (order.shippingMethod ?? "STANDARD"));
  const window_ = order.estimatedDelivery ?? (option ? {
    from: addBusinessDays(order.paidAt ?? placed, option.minDays).toISOString(),
    to: addBusinessDays(order.paidAt ?? placed, option.maxDays).toISOString(),
  } : null);
  const paid = order.paymentStatus === PaymentStatus.SUCCEEDED || [OrderStatus.PAID, OrderStatus.CONFIRMED, OrderStatus.SHIPPED, OrderStatus.DELIVERED].includes(order.status);
  const failed = order.status === OrderStatus.PAYMENT_FAILED || order.paymentStatus === PaymentStatus.FAILED;
  const cancelled = order.status === OrderStatus.CANCELLED;
  const manual = config?.paymentProvider !== "stripe";
  const shipped = order.status === OrderStatus.SHIPPED || order.status === OrderStatus.DELIVERED || order.fulfilmentStatus === "SHIPPED" || order.fulfilmentStatus === "DELIVERED";
  const delivered = order.status === OrderStatus.DELIVERED || order.fulfilmentStatus === "DELIVERED";
  const processing = paid || !!order.fulfilmentStatus && order.fulfilmentStatus !== "UNFULFILLED";
  const count = order.items.reduce((n, i) => n + i.quantity, 0);
  const a = order.shippingAddress;
  const methodLabel = order.shippingMethod === "EXPRESS" ? "Express" : "Standard";
  const methodDays = option ? `${option.minDays}–${option.maxDays} business days` : null;
  const accountLinked = signedIn || accountState === "done";
  const viewHref = accountLinked
    ? `/account/orders/${encodeURIComponent(order.orderNumber)}`
    : `/track?o=${encodeURIComponent(order.orderNumber)}`;

  const payMethod = manual ? "Pay later (manual confirmation)" : "Card";
  const payBadge = failed
    ? { cls: "bad", text: "Failed" }
    : order.paymentStatus === PaymentStatus.REFUNDED
      ? { cls: "", text: "Refunded" }
      : order.paymentStatus === PaymentStatus.PARTIALLY_REFUNDED
        ? { cls: "", text: "Partly refunded" }
        : paid
          ? { cls: "ok", text: "Paid" }
          : { cls: "", text: manual ? "Awaiting confirmation" : "Processing" };

  const steps = [
    { label: "Order placed", sub: fmtDay(placed), on: true },
    { label: "Processing", sub: processing ? "In progress" : "Within 1 business day", on: processing },
    { label: "Shipped", sub: order.shippedAt ? fmtDay(order.shippedAt) : "Tracking by email", on: shipped },
    { label: "Delivered", sub: order.deliveredAt ? fmtDay(order.deliveredAt) : window_ ? fmtDay(window_.to) : "", on: delivered },
  ];

  return shell(
    <>
      <section className="conf-hero">
        <span className="conf-check" aria-hidden="true" style={failed || cancelled ? { background: "var(--low-stock)" } : undefined}>
          <DayloraIcon name={failed || cancelled ? "alert" : "check"} />
        </span>
        <h1>
          {failed
            ? "Your payment didn't go through."
            : cancelled
              ? `Order ${order.orderNumber} was cancelled.`
              : paid
                ? `Thanks, ${first}! Your order is confirmed.`
                : `Thanks, ${first}! We've got your order.`}
        </h1>
        <p className="onum">Order number <b>{order.orderNumber}</b></p>
        {!failed && !cancelled && (
          <p>
            We&apos;ve sent a confirmation to <b style={{ color: "var(--ink)" }}>{order.customerEmail ?? guestRef?.email ?? user?.email}</b>.{" "}
            {paid
              ? "We'll email you again with tracking when it ships."
              : manual
                ? "We'll confirm your payment, then email you again with tracking when it ships."
                : "We're confirming your payment and will email you as soon as it's done."}
          </p>
        )}
      </section>

      {(failed || cancelled) && (
        <section className="card fail-card" aria-labelledby="fH">
          <h2 id="fH">{failed ? "No payment was taken" : "Nothing to pay"}</h2>
          <p style={{ fontSize: 14, lineHeight: "20px" }}>
            {failed
              ? "Your order wasn't confirmed and you haven't been charged. Add the items to your cart again to try another payment method."
              : "This order won't be shipped. If you were charged, the refund goes back to your original payment method."}
          </p>
          <div className="conf-actions" style={{ justifyContent: "flex-start", marginTop: 16 }}>
            <Link href="/cart" className="btn btn-primary">Go to cart</Link>
            <Link href="/help?t=contact" className="btn btn-secondary">Contact us</Link>
          </div>
        </section>
      )}

      {!failed && !cancelled && (
        <section className="card" aria-labelledby="dH">
          <h2 id="dH">
            {delivered
              ? `Delivered ${order.deliveredAt ? fmtDay(order.deliveredAt) : ""}`
              : window_
                ? `Estimated delivery: ${fmtDay(window_.from)} – ${fmtDay(window_.to)}`
                : "Estimated delivery"}
          </h2>
          <ol className="tl">
            {steps.map((s) => (
              <li key={s.label} className={s.on ? "on" : undefined}>
                <span className="dot">{s.on && <DayloraIcon name="check" />}</span>
                <b>{s.label}</b>
                {s.sub}
                <span className="sr-only">{s.on ? " (done)" : " (to come)"}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="conf-grid">
        <section className="card" aria-labelledby="shH">
          <h2 id="shH">Shipping to</h2>
          <address className="addr">
            {a.recipientName}
            <br />
            {a.addressLine1}
            {a.addressLine2 && <><br />{a.addressLine2}</>}
            <br />
            {a.city}, {a.state} {a.postalCode}
          </address>
          <p className="conf-note" style={{ marginTop: 8 }}>
            {methodLabel} shipping{methodDays ? ` · ${methodDays}` : ""}
          </p>
        </section>
        <section className="card" aria-labelledby="pyH">
          <h2 id="pyH">Payment</h2>
          <dl className="kv">
            <dt>Method</dt>
            <dd>{payMethod}</dd>
            <dt>Status</dt>
            <dd><span className={`pay-status ${payBadge.cls}`}>{payBadge.text}</span></dd>
            <dt>{paid ? "Charged" : "Amount due"}</dt>
            <dd>{usd(order.grandTotal)}</dd>
            <dt>Date</dt>
            <dd>{fmtDay(order.paidAt ?? placed)}</dd>
          </dl>
          {manual && !paid && !failed && !cancelled && (
            <p className="conf-note">No card was taken. Our team will contact you to confirm payment before your order ships.</p>
          )}
        </section>
      </div>

      <section className="card" aria-labelledby="itH">
        <h2 id="itH">{count} item{count === 1 ? "" : "s"} in this order</h2>
        <ul className="mini" style={{ maxHeight: "none" }}>
          {order.items.map((i) => {
            const v = [i.color, i.size].filter(Boolean).join(" · ") || i.variantName || "";
            return (
              <li key={i.id}>
                <span className="m">
                  {i.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={i.imageUrl} alt="" />
                  ) : (
                    <DayloraIcon name="box" />
                  )}
                  <span className="q" aria-label={`Quantity ${i.quantity}`}>{i.quantity}</span>
                </span>
                <span className="n">
                  <Link href={`/product/${i.productId}`}>{baseProductName(i.productName, i.color, i.size)}</Link>
                  {v && <small>{v}</small>}
                </span>
                <span className="pr">{usd(i.lineTotal)}</span>
              </li>
            );
          })}
        </ul>
        <dl className="sum-rows" style={{ marginTop: 16 }}>
          <dt>Subtotal</dt>
          <dd>{usd(order.subtotal)}</dd>
          {order.discountTotal > 0 && (
            <>
              <dt className="good">Discount</dt>
              <dd className="good">−{usd(order.discountTotal)}</dd>
            </>
          )}
          <dt>Shipping</dt>
          <dd>{order.shippingTotal === 0 ? <span className="good">Free</span> : usd(order.shippingTotal)}</dd>
          <dt>Tax</dt>
          <dd>{usd(order.taxTotal)}</dd>
        </dl>
        <div className="sum-total" style={{ marginTop: 16 }}><span>Total</span><b>{usd(order.grandTotal)}</b></div>
      </section>

      {order.guest && guestRef && !signedIn && accountState !== "done" && (
        <section className="card acct" aria-labelledby="acH">
          <h2 id="acH" style={{ margin: 0 }}>Save your details for next time</h2>
          {accountState === "exists" ? (
            <p role="alert">
              You already have an account with {order.customerEmail}.{" "}
              <Link href={`/login?next=${encodeURIComponent(`/account/orders/${order.orderNumber}`)}`} style={{ textDecoration: "underline", fontWeight: 600 }}>
                Sign in
              </Link>{" "}
              to see this order with the rest of your orders.
            </p>
          ) : (
            <>
              <p>
                Create an account with just a password. We&apos;ll use {order.customerEmail} and link this order to it.
              </p>
              <form onSubmit={createAccount} noValidate>
                <div className={`field${pwError ? " bad" : ""}`}>
                  <label htmlFor="pw">Create a password</label>
                  <input
                    id="pw"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={password}
                    aria-invalid={pwError ? true : undefined}
                    aria-describedby="pw-h pw-e"
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (pwError) setPwError(passwordError(e.target.value));
                    }}
                  />
                  <p className="hint" id="pw-h">At least 8 characters, with a letter and a number</p>
                  <p className="err" id="pw-e">{pwError && <><DayloraIcon name="alert" style={{ width: 14, height: 14 }} />{pwError}</>}</p>
                </div>
                <button className="btn btn-primary" type="submit" disabled={accountState === "saving"}>
                  {accountState === "saving" ? "Creating…" : "Create account"}
                </button>
                {accountError && <p className="form-err" role="alert">{accountError}</p>}
              </form>
              <ul>
                <li>Track orders</li>
                <li>Faster checkout</li>
                <li>Easy returns</li>
              </ul>
            </>
          )}
        </section>
      )}
      {accountState === "done" && (
        <section className="card acct" aria-labelledby="acdH" role="status">
          <div className="done">
            <h2 id="acdH" style={{ margin: 0 }}>Your account is ready</h2>
            <p>
              You&apos;re signed in as {order.customerEmail}. This order is saved in your{" "}
              <Link href="/account#orders">order history</Link>.
            </p>
          </div>
        </section>
      )}

      <div className="conf-actions">
        <Link href="/catalog" className="btn btn-primary">Continue shopping</Link>
        <Link href={viewHref} className="btn btn-secondary">View order</Link>
      </div>
    </>
  );
}
