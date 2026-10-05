"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import orderService from "@/services/order.service";
import { useStoreConfig } from "@/hooks/useStoreConfig";
import { getApiErrorMessage } from "@/lib/apiError";
import { isCancellable, type Order, OrderStatus } from "@/types/api/order.types";
import { DayloraIcon } from "../DayloraIcons";
import {
  RETURN_LABEL,
  SHIPMENT_LABEL,
  TRACKER_STEPS,
  fmtDate,
  fmtDateTime,
  money,
  orderStatusLabel,
  orderTone,
  trackerIndex,
} from "./orderStatus";

/**
 * One order (FR-ST-11/12, FR-IN-04): confirmation after checkout, status
 * tracker, carrier tracking, timeline, and the customer's own actions —
 * cancel before shipping, request a return after delivery (FR-AD-07).
 */
export function DayloraOrderDetail({ id }: { id: string }) {
  const params = useSearchParams();
  const justPlaced = params.get("placed") === "1";
  const config = useStoreConfig();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<{ notFound: boolean; message: string } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [returning, setReturning] = useState(false);

  const load = useCallback(() => {
    orderService
      .getOrder(id)
      .then((res) => setOrder(res.data.data))
      .catch((err) => {
        const status = (err as { response?: { status?: number } }).response?.status;
        setError({ notFound: status === 404 || status === 400, message: getApiErrorMessage(err, "We couldn't load this order.") });
      });
  }, [id]);

  useEffect(() => {
    if (!localStorage.getItem("accessToken")) {
      window.location.replace(`/login?next=/orders/${id}`);
      return;
    }
    load();
  }, [id, load]);

  // A Stripe payment confirms by webhook a moment after the redirect: refresh until it lands.
  useEffect(() => {
    if (!order || order.status !== OrderStatus.PENDING_PAYMENT || !justPlaced || config?.paymentProvider !== "stripe") return;
    const t = setTimeout(load, 3000);
    return () => clearTimeout(t);
  }, [order, justPlaced, config, load]);

  useEffect(() => {
    if (order) document.title = `Order ${order.orderNumber} · Daylora`;
  }, [order]);

  const cancel = async () => {
    if (!order || !window.confirm(`Cancel order ${order.orderNumber}?`)) return;
    setCancelling(true);
    setActionError(null);
    try {
      const res = await orderService.cancelOrder(order.id);
      setOrder(res.data.data);
      load();
    } catch (err) {
      setActionError(getApiErrorMessage(err, "We couldn't cancel this order."));
    } finally {
      setCancelling(false);
    }
  };

  if (error) {
    return (
      <main id="main" className="acct">
        <div className="daylora-container">
          <div className="empty" role="alert">
            <span className="empty-ic"><DayloraIcon name={error.notFound ? "search" : "alert"} /></span>
            <h2>{error.notFound ? "We couldn't find this order" : "This order didn't load"}</h2>
            <p>{error.notFound ? "Check the link, or find it in your order history." : error.message}</p>
            <Link className="btn btn-primary" href="/orders">Your orders</Link>
          </div>
        </div>
      </main>
    );
  }
  if (!order) {
    return (
      <main id="main" className="acct" aria-busy="true">
        <div className="daylora-container">
          <div className="skel" style={{ height: 120, borderRadius: 16, marginBottom: 24 }} />
          <div className="acct-grid">
            <div className="skel" style={{ height: 360, borderRadius: 16 }} />
            <div className="skel" style={{ height: 260, borderRadius: 16 }} />
          </div>
        </div>
      </main>
    );
  }

  const cur = order.currency;
  const step = trackerIndex(order.status, order.fulfilmentStatus);
  const stopped = step < 0;
  const delivered = order.status === OrderStatus.DELIVERED;
  const windowDays = config?.returnWindowDays ?? 30;
  const deliveredAt = order.deliveredAt ? new Date(order.deliveredAt) : null;
  const returnOpen =
    delivered && deliveredAt !== null && Date.now() - deliveredAt.getTime() <= windowDays * 86_400_000 &&
    order.items.some((i) => i.quantity > i.returnedQuantity);

  return (
    <main id="main" className="acct">
      <div className="daylora-container">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/orders">Your orders</Link>
          <DayloraIcon name="chev" />
          <span aria-current="page">{order.orderNumber}</span>
        </nav>

        {justPlaced && order.status !== OrderStatus.CANCELLED && (
          <section className="thanks" aria-live="polite">
            <span className="empty-ic"><DayloraIcon name="check" /></span>
            <h1>Thank you for your order</h1>
            <p>
              Order <b>{order.orderNumber}</b>{" "}
              {order.status === OrderStatus.PENDING_PAYMENT
                ? "is placed. We'll email you as soon as your payment is confirmed."
                : "is confirmed. We've emailed you a receipt and will let you know when it ships."}
            </p>
          </section>
        )}

        <div className="acct-head">
          <h1 style={justPlaced ? { fontSize: 22 } : undefined}>Order {order.orderNumber}</h1>
          <span className={`pill ${orderTone(order.status)}`}>{orderStatusLabel(order)}</span>
        </div>
        {actionError && <p className="notice err" role="alert"><DayloraIcon name="alert" />{actionError}</p>}

        <div className="acct-grid">
          <div>
            <section className="panel" aria-label="Order progress">
              {stopped ? (
                <p className="notice err" style={{ marginBottom: 0 }}>
                  <DayloraIcon name="alert" />
                  This order was {order.status === OrderStatus.PAYMENT_FAILED ? "not paid" : "cancelled"}.
                  {order.refundedTotal > 0 && ` ${money(order.refundedTotal, cur)} has been refunded to your original payment method.`}
                </p>
              ) : (
                <ol className="tracker" aria-label={`Status: ${orderStatusLabel(order)}`}>
                  {TRACKER_STEPS.map((s, i) => (
                    <li key={s} className={`${i <= step ? "done" : ""}${i === step ? " now" : ""}`} aria-current={i === step ? "step" : undefined}>
                      {s}
                    </li>
                  ))}
                </ol>
              )}
              <p className="line-meta">
                Placed {fmtDate(order.createdAt)}
                {order.shippingMethod && ` · ${order.shippingMethod === "EXPRESS" ? "Express" : "Standard"} shipping`}
                {order.deliveredAt && ` · Delivered ${fmtDate(order.deliveredAt)}`}
              </p>
            </section>

            {(order.shipments ?? []).length > 0 && (
              <section className="panel" aria-labelledby="h-track">
                <h2 id="h-track">Tracking</h2>
                {order.shipments!.map((s) => (
                  <div className="ship-card" key={s.id}>
                    <div className="s-head">
                      <strong>{s.carrier}{s.service ? ` · ${s.service}` : ""}</strong>
                      <span className={`pill ${s.status === "DELIVERED" ? "ok" : s.status === "EXCEPTION" ? "err" : "info"}`}>
                        {SHIPMENT_LABEL[s.status]}
                      </span>
                    </div>
                    <p className="line-meta">
                      Tracking number{" "}
                      {s.trackingUrl ? (
                        <a href={s.trackingUrl} target="_blank" rel="noopener noreferrer">{s.trackingNumber}</a>
                      ) : (
                        <b>{s.trackingNumber}</b>
                      )}
                    </p>
                    {s.events.length > 0 && (
                      <ul className="timeline" style={{ marginTop: 12 }}>
                        {s.events.map((e, i) => (
                          <li key={i}>
                            {SHIPMENT_LABEL[e.status]}{e.location ? ` — ${e.location}` : ""}
                            {e.description && <span className="line-meta" style={{ display: "block" }}>{e.description}</span>}
                            <time dateTime={e.occurredAt}>{fmtDateTime(e.occurredAt)}</time>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </section>
            )}

            <section className="panel" aria-labelledby="h-items">
              <h2 id="h-items">Items</h2>
              <ul className="lines">
                {order.items.map((i) => (
                  <li className="line" key={i.id} style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
                    <div className="line-body">
                      <Link href={`/product/${i.productId}`} className="line-name">{i.productName}</Link>
                      <span className="line-meta">SKU {i.sku} · {i.quantity} × {money(i.unitPrice, cur)}</span>
                      {i.returnedQuantity > 0 && <span className="line-flag low">{i.returnedQuantity} returned</span>}
                    </div>
                    <div className="line-price" style={{ gridColumn: "auto" }}>{money(i.lineTotal, cur)}</div>
                  </li>
                ))}
              </ul>
            </section>

            {(order.returns ?? []).length > 0 && (
              <section className="panel" aria-labelledby="h-returns">
                <h2 id="h-returns">Returns</h2>
                {order.returns!.map((r) => (
                  <div className="ship-card" key={r.id}>
                    <div className="s-head">
                      <strong>{r.rmaNumber}</strong>
                      <span className={`pill ${r.status === "REFUNDED" ? "ok" : r.status === "REJECTED" ? "err" : "info"}`}>
                        {RETURN_LABEL[r.status]}
                      </span>
                    </div>
                    <p className="line-meta">
                      {r.items.reduce((n, x) => n + x.quantity, 0)} item(s) · “{r.reason}” · requested {fmtDate(r.createdAt)}
                      {r.refundAmount !== null && ` · refunded ${money(r.refundAmount, cur)}`}
                    </p>
                  </div>
                ))}
              </section>
            )}

            {returnOpen && (
              <section className="panel" aria-labelledby="h-ret">
                <h2 id="h-ret">Return items</h2>
                {returning ? (
                  <ReturnForm
                    order={order}
                    onDone={() => { setReturning(false); load(); }}
                    onCancel={() => setReturning(false)}
                  />
                ) : (
                  <>
                    <p className="line-meta">
                      You can return unused items within {windowDays} days of delivery
                      {deliveredAt && ` (until ${fmtDate(new Date(deliveredAt.getTime() + windowDays * 86_400_000).toISOString())})`}.
                    </p>
                    <div className="form-actions"><button className="btn btn-secondary" onClick={() => setReturning(true)}>Start a return</button></div>
                  </>
                )}
              </section>
            )}

            {(order.timeline ?? []).length > 0 && (
              <section className="panel" aria-labelledby="h-history">
                <h2 id="h-history">History</h2>
                <ul className="timeline">
                  {[...order.timeline!].reverse().map((e, i) => (
                    <li key={i}>
                      {e.note ?? orderStatusLabel({ status: e.status as OrderStatus, fulfilmentStatus: e.fulfilmentStatus })}
                      <time dateTime={e.at}>{fmtDateTime(e.at)}</time>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside>
            <section className="panel" aria-labelledby="h-sum">
              <h2 id="h-sum">Summary</h2>
              <div className="sum-row"><span>Subtotal</span><span>{money(order.subtotal, cur)}</span></div>
              <div className={`sum-row${order.shippingTotal === 0 ? " free" : ""}`}>
                <span>Shipping</span><span>{order.shippingTotal === 0 ? "Free" : money(order.shippingTotal, cur)}</span>
              </div>
              <div className="sum-row"><span>Tax</span><span>{money(order.taxTotal, cur)}</span></div>
              <div className="sum-total"><span>Total</span><span>{money(order.grandTotal, cur)}</span></div>
              {order.refundedTotal > 0 && (
                <div className="sum-row"><span>Refunded</span><span>−{money(order.refundedTotal, cur)}</span></div>
              )}
            </section>
            <section className="panel" aria-labelledby="h-ship">
              <h2 id="h-ship">Shipping to</h2>
              <address className="addr">
                {order.shippingAddress.recipientName}<br />
                {order.shippingAddress.addressLine1}<br />
                {order.shippingAddress.addressLine2 && <>{order.shippingAddress.addressLine2}<br /></>}
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
                {order.shippingAddress.country}
              </address>
            </section>
            {isCancellable(order.status) && (
              <section className="panel">
                <h2>Changed your mind?</h2>
                <p className="line-meta">
                  You can cancel until the order ships.
                  {order.status !== OrderStatus.PENDING_PAYMENT && " We'll refund you in full."}
                </p>
                <div className="form-actions">
                  <button className="btn btn-secondary" disabled={cancelling} onClick={cancel}>
                    {cancelling ? "Cancelling…" : "Cancel order"}
                  </button>
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

function ReturnForm({ order, onDone, onCancel }: { order: Order; onDone: () => void; onCancel: () => void }) {
  const returnable = order.items.filter((i) => i.quantity > i.returnedQuantity);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const items = Object.entries(qty).filter(([, q]) => q > 0).map(([orderItemId, quantity]) => ({ orderItemId, quantity }));
    if (!items.length) return setError("Choose at least one item to return.");
    if (!reason.trim()) return setError("Tell us why you're returning it.");
    setBusy(true);
    setError(null);
    try {
      await orderService.requestReturn(order.id, { items, reason: reason.trim() });
      onDone();
    } catch (err) {
      setError(getApiErrorMessage(err, "We couldn't request this return."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      {returnable.map((i) => {
        const max = i.quantity - i.returnedQuantity;
        return (
          <div className="ret-line" key={i.id}>
            <label htmlFor={`r-${i.id}`}>{i.productName} <span className="line-meta">({i.sku})</span></label>
            <select id={`r-${i.id}`} value={qty[i.id] ?? 0} onChange={(e) => setQty({ ...qty, [i.id]: Number(e.target.value) })}>
              {Array.from({ length: max + 1 }, (_, n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        );
      })}
      <div className="field" style={{ marginTop: 16 }}>
        <label htmlFor="r-reason">Reason</label>
        <textarea id="r-reason" maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Wrong size, arrived damaged…" />
      </div>
      {error && <p className="notice err" role="alert" style={{ marginTop: 12 }}><DayloraIcon name="alert" />{error}</p>}
      <div className="form-actions">
        <button className="btn btn-primary" disabled={busy}>{busy ? "Sending…" : "Request return"}</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
