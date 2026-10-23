"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DayloraIcon } from "../DayloraIcons";
import orderService from "@/services/order.service";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { getApiErrorMessage } from "@/lib/apiError";
import {
  PAYMENT_STATUS_LABEL,
  isCancellable,
  type Order,
  type OrderItem,
  type OrderReturn,
  type OrderSummary,
  type ReturnMethod,
} from "@/types/api/order.types";
import { RETURN_LABEL } from "../shop/orderStatus";
import {
  Scans,
  Steps,
  Thumb,
  TrackingRef,
  fmtLong,
  fmtShort,
  headline,
  isOpen,
  money,
  variantText,
  type ToastMsg,
} from "./customerShared";

type ToastFn = (t: ToastMsg) => void;
type Filter = "all" | "open" | "done";
const FILTERS: [Filter, string][] = [
  ["all", "All"],
  ["open", "On the way"],
  ["done", "Delivered & returned"],
];

const productHref = (productId: string) => `/product/${productId}`;
const orderHref = (o: { orderNumber: string }) => `/account/orders/${encodeURIComponent(o.orderNumber)}`;
const returnable = (o: { status: string; returnableUntil: string | null }) =>
  o.status === "DELIVERED" && !!o.returnableUntil && new Date(o.returnableUntil).getTime() > Date.now();

/* ===========================================================================
   Orders list
   =========================================================================== */

export function OrdersView({ toast }: { toast: ToastFn }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [counts, setCounts] = useState<Record<Filter, number> | null>(null);
  const [list, setList] = useState<OrderSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [returning, setReturning] = useState<Order | null>(null);
  const [reload, setReload] = useState(0);
  const router = useRouter();
  const add = useCartStore((s) => s.add);

  useEffect(() => {
    let live = true;
    Promise.all(
      (["all", "open", "done"] as Filter[]).map((f) =>
        orderService.getOrders({ size: 1, status: f === "all" ? undefined : f }).then((r) => r.data.data?.totalElements ?? 0)
      )
    )
      .then(([all, open, done]) => live && setCounts({ all, open, done }))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [reload]);

  useEffect(() => {
    let live = true;
    setList(null);
    setError(null);
    orderService
      .getOrders({ size: 50, status: filter === "all" ? undefined : filter })
      .then((r) => live && setList(r.data.data?.content ?? []))
      .catch((e) => live && setError(getApiErrorMessage(e, "We couldn't load your orders.")));
    return () => {
      live = false;
    };
  }, [filter, reload]);

  async function startReturn(o: OrderSummary) {
    try {
      const r = await orderService.getOrder(o.id);
      const full = r.data.data ?? null;
      if (full && !full.items.some((i) => leftToReturn(full, i) > 0)) {
        toast({ title: "Everything in this order is already being returned", body: "Open the order to see the return status." });
        return;
      }
      setReturning(full);
    } catch (e) {
      toast({ title: "Couldn't open the return", body: getApiErrorMessage(e, "Try again in a moment.") });
    }
  }

  async function buyAgain(o: OrderSummary) {
    let added = 0;
    let failed = 0;
    for (const i of o.items) {
      try {
        await add(i.productId, i.quantity);
        added += 1;
      } catch {
        failed += 1;
      }
    }
    if (!added) {
      toast({ title: "Couldn't add these items", body: "They're out of stock or no longer sold." });
      return;
    }
    toast({
      title: "Added to cart",
      body: `${added} item${added > 1 ? "s" : ""} from ${o.orderNumber}${failed ? ` · ${failed} unavailable` : ""}`,
      action: { label: "View cart", onClick: () => router.push("/cart") },
    });
  }

  const total = counts?.all ?? list?.length ?? 0;

  return (
    <>
      <div className="sub-h">
        <h1>Your orders</h1>
        {counts && (
          <p>
            {total} order{total === 1 ? "" : "s"}
          </p>
        )}
      </div>
      <div className="ofilter" role="group" aria-label="Show orders">
        {FILTERS.map(([k, t]) => (
          <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}>
            {t}
            {counts ? ` (${counts[k]})` : ""}
          </button>
        ))}
      </div>
      {error ? (
        <div className="alert err" role="alert">
          <DayloraIcon name="alert" />
          <span>
            {error}{" "}
            <button type="button" className="link inline" onClick={() => setReload((n) => n + 1)}>
              Try again
            </button>
          </span>
        </div>
      ) : !list ? (
        <>
          <div className="skel" style={{ height: 260 }} aria-hidden="true" />
          <div className="skel" style={{ height: 260 }} aria-hidden="true" />
          <span className="sr-only" role="status">
            Loading your orders
          </span>
        </>
      ) : list.length === 0 ? (
        <div className="card empty-card">
          {filter === "all" ? "You haven't placed any orders yet." : "No orders here yet."}{" "}
          <Link href="/" className="link inline">
            Start shopping
          </Link>
        </div>
      ) : (
        list.map((o) => (
          <OrderCard key={o.id} o={o} onReturn={() => startReturn(o)} onBuyAgain={() => buyAgain(o)} />
        ))
      )}
      {returning && (
        <ReturnDialog
          order={returning}
          onClose={() => setReturning(null)}
          onDone={() => setReload((n) => n + 1)}
        />
      )}
    </>
  );
}

function OrderCard({ o, onReturn, onBuyAgain }: { o: OrderSummary; onReturn: () => void; onBuyAgain: () => void }) {
  const h = headline(o);
  const [busy, setBusy] = useState(false);
  const again = ["DELIVERED", "REFUNDED", "CANCELLED"].includes(o.status);
  return (
    <article className="oc" aria-label={`Order ${o.orderNumber}`}>
      <div className="oc-top">
        <div>
          Order placed<b>{fmtLong(o.createdAt)}</b>
        </div>
        <div>
          Total<b>{money(o.grandTotal, o.currency)}</b>
        </div>
        <div>
          Ship to<b>{o.shipToName}</b>
        </div>
        <div>
          Order number<b className="mono">{o.orderNumber}</b>
        </div>
      </div>
      <div className="oc-body">
        <div>
          <p className={`oc-st ${h.tone}`}>{h.label}</p>
          {h.line && <p className="oc-sub">{h.line}</p>}
          <div className="oc-items">
            {o.items.map((i) => (
              <div className="oc-item" key={i.productId}>
                <Thumb src={i.imageUrl} />
                <Link href={productHref(i.productId)}>
                  <b>{i.productName}</b>
                  <span>
                    {variantText(i)}
                    {i.quantity > 1 ? `${variantText(i) ? " · " : ""}Qty ${i.quantity}` : ""}
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </div>
        <div className="oc-acts">
          {isOpen(o.status) && o.status !== "PENDING_PAYMENT" && (
            <Link className="btn btn-primary" href={orderHref(o)}>
              Track package
            </Link>
          )}
          <Link className="btn btn-secondary" href={orderHref(o)}>
            View order details
          </Link>
          {returnable(o) && (
            <button type="button" className="btn btn-secondary" onClick={onReturn}>
              Return items
            </button>
          )}
          {again && (
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                await onBuyAgain();
                setBusy(false);
              }}
            >
              {busy ? "Adding…" : "Buy it again"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

/* ===========================================================================
   One order: tracking, items, shipping, payment, help, cancel, returns
   =========================================================================== */

export function OrderDetailView({
  orderRef,
  toast,
  onLoaded,
}: {
  orderRef: string;
  toast: ToastFn;
  onLoaded: (orderNumber: string) => void;
}) {
  const [order, setOrder] = useState<Order | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [returning, setReturning] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let live = true;
    setError(null);
    orderService
      .getOrder(orderRef)
      .then((r) => {
        if (!live) return;
        const o = r.data.data ?? null;
        setOrder(o);
        if (o) onLoaded(o.orderNumber);
      })
      .catch((e) => {
        if (!live) return;
        const status = (e as { response?: { status?: number } })?.response?.status;
        if (status === 404 || status === 403 || status === 400) setMissing(true);
        else setError(getApiErrorMessage(e, "We couldn't load this order."));
      });
    return () => {
      live = false;
    };
  }, [orderRef, reload, onLoaded]);

  async function cancel() {
    if (!order) return;
    setCancelling(true);
    try {
      const r = await orderService.cancelOrder(order.id);
      setOrder(r.data.data ?? order);
      setConfirmCancel(false);
      toast({
        title: "Order cancelled",
        body: order.paymentStatus === "SUCCEEDED" ? "Your refund is on its way to your original payment method." : undefined,
      });
    } catch (e) {
      toast({ title: "Couldn't cancel this order", body: getApiErrorMessage(e, "It may already be on its way.") });
      setReload((n) => n + 1);
    } finally {
      setCancelling(false);
    }
  }

  const back = (
    <Link href="/account#orders" className="back-link">
      <DayloraIcon name="arrow" />
      All orders
    </Link>
  );

  if (missing) {
    return (
      <>
        {back}
        <div className="card">
          <h1 className="sub-h1">We can&apos;t find order {orderRef}</h1>
          <p className="oc-sub" style={{ marginTop: 8 }}>
            Check the order number in your confirmation email, or{" "}
            <Link className="link inline" href="/help?t=contact">
              contact us
            </Link>
            .
          </p>
        </div>
      </>
    );
  }
  if (error) {
    return (
      <>
        {back}
        <div className="alert err" role="alert">
          <DayloraIcon name="alert" />
          <span>
            {error}{" "}
            <button type="button" className="link inline" onClick={() => setReload((n) => n + 1)}>
              Try again
            </button>
          </span>
        </div>
      </>
    );
  }
  if (!order) {
    return (
      <>
        {back}
        <div className="skel" style={{ height: 420 }} aria-hidden="true" />
        <span className="sr-only" role="status">
          Loading the order
        </span>
      </>
    );
  }

  const h = headline(order);
  const shipment = order.shipments[0];
  const a = order.shippingAddress;
  const canReturn = returnable(order) && order.items.some((i) => leftToReturn(order, i) > 0);
  const canCancel = isCancellable(order.status);
  const paid = order.paymentStatus ? PAYMENT_STATUS_LABEL[order.paymentStatus] : "Not paid";

  return (
    <>
      {back}
      <div className="sub-h">
        <h1>
          Order <span className="mono">{order.orderNumber}</span>
        </h1>
        <p>Placed {fmtLong(order.createdAt)}</p>
      </div>
      <div className="det-grid">
        <div className="det-col">
          <section className="card" aria-labelledby="tH">
            <div className="trk-h">
              <h2 id="tH" className={`oc-st ${h.tone}`}>
                {h.label}
              </h2>
              {shipment ? (
                <p>
                  <TrackingRef shipment={shipment} />
                </p>
              ) : isOpen(order.status) ? (
                <p>Tracking number arrives by email when it ships</p>
              ) : null}
            </div>
            {h.line && <p className="oc-sub trk-line">{h.line}</p>}
            <Steps order={order} />
            <h3 className="scans-h">Tracking history</h3>
            <Scans order={order} />
          </section>
          <section className="card" aria-labelledby="iH">
            <h2 id="iH">Items</h2>
            <div className="oc-items flush">
              {order.items.map((i) => (
                <div className="oc-item priced" key={i.id}>
                  <Thumb src={i.imageUrl} />
                  <Link href={productHref(i.productId)}>
                    <b>{i.productName}</b>
                    <span>
                      {variantText(i)}
                      {variantText(i) ? " · " : ""}Qty {i.quantity}
                    </span>
                    {i.returnedQuantity > 0 && <span className="ret-note">{i.returnedQuantity} returned</span>}
                  </Link>
                  <b>{money(i.lineTotal, order.currency)}</b>
                </div>
              ))}
            </div>
          </section>
        </div>
        <div className="det-col">
          <section className="card" aria-labelledby="sH">
            <h2 id="sH">Shipping to</h2>
            <address className="addr">
              {a.recipientName}
              <br />
              {a.addressLine1}
              {a.addressLine2 && (
                <>
                  <br />
                  {a.addressLine2}
                </>
              )}
              <br />
              {a.city}, {a.state} {a.postalCode}
            </address>
            {order.shippingMethod && (
              <p className="oc-sub" style={{ marginTop: 8 }}>
                {order.shippingMethod === "EXPRESS" ? "Express" : "Standard"} shipping
              </p>
            )}
          </section>
          <section className="card" aria-labelledby="pH">
            <h2 id="pH">Payment</h2>
            <dl className="kv">
              <dt>Payment</dt>
              <dd>{paid}</dd>
              <dt>Subtotal</dt>
              <dd>{money(order.subtotal, order.currency)}</dd>
              <dt>Shipping</dt>
              <dd>{order.shippingTotal ? money(order.shippingTotal, order.currency) : "Free"}</dd>
              <dt>Tax</dt>
              <dd>{money(order.taxTotal, order.currency)}</dd>
              <dt className="tot">Total</dt>
              <dd className="tot">{money(order.grandTotal, order.currency)}</dd>
              {order.refundedTotal > 0 && (
                <>
                  <dt>Refunded</dt>
                  <dd className="good">{money(order.refundedTotal, order.currency)}</dd>
                </>
              )}
            </dl>
          </section>
          <section className="card" aria-labelledby="hH">
            <h2 id="hH">Need help?</h2>
            <div className="help-row">
              {canReturn && (
                <button type="button" className="btn btn-primary" onClick={() => setReturning(true)}>
                  Return items
                </button>
              )}
              {canCancel && !confirmCancel && (
                <button type="button" className="btn btn-secondary" onClick={() => setConfirmCancel(true)}>
                  Cancel order
                </button>
              )}
              <Link className="btn btn-secondary" href="/help?t=contact">
                Contact us
              </Link>
            </div>
            {confirmCancel && (
              <div className="alert err" role="alert" style={{ marginTop: 12, flexDirection: "column" }}>
                <span>
                  <b>Cancel this order?</b>{" "}
                  {order.paymentStatus === "SUCCEEDED" ? "We'll refund the full amount to your original payment method." : "Nothing will be charged."}
                </span>
                <span className="help-row">
                  <button type="button" className="btn btn-primary" onClick={cancel} disabled={cancelling}>
                    {cancelling ? "Cancelling…" : "Yes, cancel order"}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setConfirmCancel(false)}>
                    Keep order
                  </button>
                </span>
              </div>
            )}
            <p className="muted-note">
              {order.status === "REFUNDED"
                ? "This order was returned and refunded."
                : order.status === "CANCELLED"
                  ? "This order was cancelled."
                  : canReturn
                    ? `Free returns until ${fmtShort(order.returnableUntil!)}.`
                    : order.status === "DELIVERED" && returnable(order)
                      ? "Everything in this order is already being returned."
                      : order.status === "DELIVERED"
                        ? "The return window for this order has closed."
                      : "Returns open once your order is delivered."}
            </p>
            {order.returns.length > 0 && (
              <ul className="ret-list" aria-label="Returns">
                {order.returns.map((r) => (
                  <li key={r.id}>
                    <span>
                      <span className="mono">{r.rmaNumber}</span> · {RETURN_LABEL[r.status]}
                    </span>
                    <span>{money(r.refundAmount ?? r.estimatedRefund, order.currency)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
      {returning && (
        <ReturnDialog order={order} onClose={() => setReturning(false)} onDone={() => setReload((n) => n + 1)} />
      )}
    </>
  );
}

/* ===========================================================================
   Return flow: items + reason → method → done (FR-AD-07, customer side)
   =========================================================================== */

const REASONS = ["Doesn't fit", "Changed my mind", "Arrived damaged", "Not as described", "Wrong item sent", "Better price elsewhere"];

/** Units of a line that can still be returned (mirrors the server rule). */
function leftToReturn(order: Order, item: OrderItem): number {
  const requested = order.returns
    .flatMap((r) => r.items)
    .filter((ri) => ri.orderItemId === item.id)
    .reduce((n, ri) => n + ri.quantity, 0);
  return Math.max(0, item.quantity - Math.max(item.returnedQuantity, requested));
}

function ReturnDialog({ order, onClose, onDone }: { order: Order; onClose: () => void; onDone: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const email = useAuthStore((s) => s.user?.email);
  const lines = order.items.filter((i) => leftToReturn(order, i) > 0);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [sel, setSel] = useState<Record<string, number>>(() =>
    Object.fromEntries(lines.map((i) => [i.id, leftToReturn(order, i)]))
  );
  const [reason, setReason] = useState("");
  const [method, setMethod] = useState<ReturnMethod>("DROPOFF");
  const [errs, setErrs] = useState<{ sel?: boolean; reason?: boolean }>({});
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<OrderReturn | null>(null);
  const reasonRef = useRef<HTMLSelectElement>(null);
  const carrier = order.shipments[0]?.carrier ?? "carrier";

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  const close = () => {
    ref.current?.close();
    onClose();
  };

  const chosen = lines.filter((i) => (sel[i.id] ?? 0) > 0);
  const estimate = chosen.reduce((n, i) => {
    const q = sel[i.id];
    return n + i.unitPrice * q + (i.taxAmount / i.quantity) * q;
  }, 0);

  function next() {
    const e = { sel: chosen.length === 0, reason: !reason };
    setErrs(e);
    if (e.reason) return reasonRef.current?.focus();
    if (e.sel) return;
    setStep(2);
  }

  async function submit() {
    setBusy(true);
    setSubmitErr(null);
    try {
      const r = await orderService.requestReturn(order.id, {
        items: chosen.map((i) => ({ orderItemId: i.id, quantity: sel[i.id] })),
        reason,
        method,
      });
      setDone(r.data.data ?? null);
      setStep(3);
      onDone();
    } catch (e) {
      setSubmitErr(getApiErrorMessage(e, "We couldn't start the return. Try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={ref}
      className="ret-dlg"
      aria-labelledby="retH"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <form method="dialog" noValidate onSubmit={(e) => e.preventDefault()}>
        <div className="dlg-head">
          <h2 id="retH">{step === 3 ? "Return started" : "Return items"}</h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={close}>
            <DayloraIcon name="close" />
          </button>
        </div>
        <div className="dlg-body">
          {step === 1 && (
            <>
              <p className="oc-sub">Order {order.orderNumber} · choose what you&apos;re sending back.</p>
              {lines.map((i) => {
                const left = leftToReturn(order, i);
                const q = sel[i.id] ?? 0;
                return (
                  <div key={i.id}>
                    <label className="ret-item">
                      <input
                        type="checkbox"
                        checked={q > 0}
                        onChange={(e) => setSel((s) => ({ ...s, [i.id]: e.target.checked ? left : 0 }))}
                      />
                      <Thumb src={i.imageUrl} />
                      <span>
                        <b>{i.productName}</b>
                        <span>
                          {variantText(i)}
                          {variantText(i) ? " · " : ""}
                          {money(i.unitPrice * (q || left), order.currency)}
                        </span>
                      </span>
                    </label>
                    {left > 1 && q > 0 && (
                      <div className="field" style={{ marginTop: 8, maxWidth: 160 }}>
                        <label htmlFor={`rq-${i.id}`}>Quantity to return</label>
                        <select
                          id={`rq-${i.id}`}
                          value={q}
                          onChange={(e) => setSel((s) => ({ ...s, [i.id]: Number(e.target.value) }))}
                        >
                          {Array.from({ length: left }, (_, n) => n + 1).map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
              <div className={`field${errs.reason ? " bad" : ""}`}>
                <label htmlFor="rsn">Why are you returning it?</label>
                <select
                  ref={reasonRef}
                  id="rsn"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  aria-invalid={errs.reason || undefined}
                  aria-describedby={errs.reason ? "rsn-e" : undefined}
                >
                  <option value="">Choose a reason</option>
                  {REASONS.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
                <p className="err" id="rsn-e">
                  Choose a reason so we can improve.
                </p>
              </div>
              {errs.sel && (
                <p className="sel-err" role="alert">
                  Select at least one item.
                </p>
              )}
            </>
          )}
          {step === 2 && (
            <>
              <p className="oc-sub">How do you want to send it back? Both are free.</p>
              <label className="ro">
                <input type="radio" name="rm" checked={method === "DROPOFF"} onChange={() => setMethod("DROPOFF")} />
                <span>
                  <b>Drop off at a {carrier} location</b>
                  <small>Bring the item and your return number. No box or label needed.</small>
                </span>
              </label>
              <label className="ro">
                <input type="radio" name="rm" checked={method === "PICKUP"} onChange={() => setMethod("PICKUP")} />
                <span>
                  <b>Schedule a pickup</b>
                  <small>
                    {carrier} collects it from {order.shippingAddress.addressLine1}. We&apos;ll email you to confirm the day.
                  </small>
                </span>
              </label>
              <div className="alert ok">
                <DayloraIcon name="check" />
                <span>
                  Estimated refund <b>{money(estimate, order.currency)}</b> to your original payment method within 5–7
                  business days after we receive it.
                </span>
              </div>
              {submitErr && (
                <div className="alert err" role="alert">
                  <DayloraIcon name="alert" />
                  <span>{submitErr}</span>
                </div>
              )}
            </>
          )}
          {step === 3 && done && (
            <div className="ret-done">
              <span className="gate-ic" aria-hidden="true">
                <DayloraIcon name="check" />
              </span>
              <p>
                <b>Return {done.rmaNumber} is ready.</b>
                <br />
                {method === "DROPOFF"
                  ? `Take it to any ${carrier} location and quote your return number.`
                  : `We'll email you to confirm when ${carrier} will pick it up.`}
              </p>
              <p className="oc-sub">
                Estimated refund {money(done.estimatedRefund, order.currency)}.
                {email ? ` We've emailed these details to ${email}.` : ""}
              </p>
            </div>
          )}
        </div>
        <div className="dlg-foot">
          {step === 1 && (
            <>
              <button type="button" className="btn btn-secondary" onClick={close}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={next}>
                Continue
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setStep(1)} disabled={busy}>
                Back
              </button>
              <button type="button" className="btn btn-primary" onClick={submit} disabled={busy}>
                {busy ? "Starting…" : "Start return"}
              </button>
            </>
          )}
          {step === 3 && (
            <button type="button" className="btn btn-primary" onClick={close}>
              Done
            </button>
          )}
        </div>
      </form>
    </dialog>
  );
}
