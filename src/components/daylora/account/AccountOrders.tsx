"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
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
  type OrderCounts,
  type OrderItem,
  type OrderListFilter,
  type OrderReturn,
  type OrderSummary,
  type ReturnMethod,
  type ReturnRefundTo,
} from "@/types/api/order.types";
import { RETURN_LABEL } from "../shop/orderStatus";
import {
  Scans,
  Steps,
  Thumb,
  TrackingRef,
  fmtDay,
  fmtLong,
  fmtShort,
  headline,
  isOpen,
  money,
  useAccountToast,
  variantText,
} from "./customerShared";
import { EmptyBox, ViewHead, useAccountShell, useGoLink } from "./accountShell";
import { QrCode } from "./qr";

type Filter = "all" | Exclude<OrderListFilter, "done">;
const FILTERS: [Filter, string][] = [
  ["all", "All"],
  ["open", "On the way"],
  ["delivered", "Delivered"],
  ["returned", "Returned"],
  ["cancelled", "Cancelled"],
];
const DEFAULT_PERIOD = "6m";
const PAGE = 20;
/** Return shipments go with UPS (store config `returnCarrier`, contract E). */
const CARRIER = "UPS";

export const productHref = (i: { productId: string; productSlug?: string | null; slug?: string | null }) =>
  `/product/${encodeURIComponent(i.productSlug || i.slug || i.productId)}`;
export const orderHref = (o: { orderNumber: string }) => `/account/orders/${encodeURIComponent(o.orderNumber)}`;
export const invoiceHref = (o: { orderNumber: string }) => `${orderHref(o)}/invoice`;

const returnable = (o: { status: string; returnableUntil: string | null; hasReturnableItems?: boolean }) =>
  o.status === "DELIVERED" &&
  !!o.returnableUntil &&
  new Date(o.returnableUntil).getTime() > Date.now() &&
  o.hasReturnableItems !== false;

const statusCode = (e: unknown) => (e as { response?: { status?: number } })?.response?.status;

/* ---- payment, as the shopper reads it (contract B3) ---- */

const BRAND: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "Amex",
  american_express: "Amex",
  discover: "Discover",
  diners: "Diners Club",
  jcb: "JCB",
  unionpay: "UnionPay",
  apple_pay: "Apple Pay",
  google_pay: "Google Pay",
};
const brandName = (b: string | null | undefined) =>
  b ? (BRAND[b.toLowerCase()] ?? b.charAt(0).toUpperCase() + b.slice(1).toLowerCase()) : null;

/** "Visa ending in 4242" | "PayPal" | "Pay later" | the payment status. */
export function paymentText(o: Pick<Order, "payment" | "paymentStatus">): string {
  const p = o.payment;
  if (p) {
    switch (p.type) {
      case "CARD":
        return p.last4 ? `${brandName(p.brand) ?? "Card"} ending in ${p.last4}` : (brandName(p.brand) ?? "Card");
      case "PAYPAL":
        return "PayPal";
      case "WALLET":
        return brandName(p.brand) ?? "Digital wallet";
      case "MANUAL":
        return "Pay later";
    }
  }
  return o.paymentStatus ? PAYMENT_STATUS_LABEL[o.paymentStatus] : "Not paid";
}

/** Where an "original payment" refund lands, for the return copy. */
const refundDest = (o: Pick<Order, "payment">) =>
  o.payment?.type === "CARD" ? "card" : o.payment?.type === "PAYPAL" ? "PayPal" : "original payment";

/* ===========================================================================
   Orders list
   =========================================================================== */

export function OrdersView() {
  const toast = useAccountToast();
  const { summary, refreshSummary, go } = useAccountShell();
  const [filter, setFilter] = useState<Filter>("all");
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [period, setPeriod] = useState(DEFAULT_PERIOD);
  const [counts, setCounts] = useState<OrderCounts | null>(null);
  const [list, setList] = useState<OrderSummary[] | null>(null);
  const [page, setPage] = useState(0);
  const [more, setMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [returning, setReturning] = useState<Order | null>(null);
  const [reload, setReload] = useState(0);
  const router = useRouter();
  const add = useCartStore((s) => s.add);
  const year = String(new Date().getFullYear());

  // Search as you type, without a request per key.
  useEffect(() => {
    const t = setTimeout(() => setQ(qInput.trim()), 300);
    return () => clearTimeout(t);
  }, [qInput]);

  useEffect(() => {
    let live = true;
    orderService
      .getOrderCounts({ period, q: q || undefined })
      .then((r) => live && setCounts(r.data.data ?? null))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [period, q, reload]);

  useEffect(() => {
    let live = true;
    setList(null);
    setError(null);
    orderService
      .getOrders({ size: PAGE, page: 0, status: filter === "all" ? undefined : filter, q: q || undefined, period })
      .then((r) => {
        if (!live) return;
        const d = r.data.data;
        setList(d?.content ?? []);
        setPage(0);
        setMore(!!d && d.totalPages > 1);
      })
      .catch((e) => live && setError(getApiErrorMessage(e, "We couldn't load your orders.")));
    return () => {
      live = false;
    };
  }, [filter, q, period, reload]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const r = await orderService.getOrders({
        size: PAGE,
        page: page + 1,
        status: filter === "all" ? undefined : filter,
        q: q || undefined,
        period,
      });
      const d = r.data.data;
      setList((l) => [...(l ?? []), ...(d?.content ?? [])]);
      setPage((p) => p + 1);
      setMore(!!d && d.number + 1 < d.totalPages);
    } catch (e) {
      toast({ title: "Couldn't load more orders", body: getApiErrorMessage(e, "Try again in a moment.") });
    } finally {
      setLoadingMore(false);
    }
  }

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

  async function cancel(o: OrderSummary) {
    try {
      await orderService.cancelOrder(o.id);
      toast({
        title: "Order cancelled",
        body: o.status === "PENDING_PAYMENT" ? "Nothing was charged." : "Your refund is on its way.",
      });
      setReload((n) => n + 1);
      refreshSummary();
    } catch (e) {
      toast({ title: "Couldn't cancel this order", body: getApiErrorMessage(e, "It may already be on its way.") });
      setReload((n) => n + 1);
    }
  }

  const total = summary?.orders.total ?? counts?.all;
  const noOrdersAtAll = summary?.orders.total === 0;

  return (
    <>
      <ViewHead
        title="Orders"
        sub={total !== undefined ? `${total} order${total === 1 ? "" : "s"} · track, return, review or buy again` : undefined}
      />
      {!noOrdersAtAll && (
        <>
          <div className="otools">
            <label className="osearch">
              <DayloraIcon name="search" />
              <span className="sr-only">Search orders</span>
              <input
                type="search"
                placeholder="Search by item or order number"
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
              />
            </label>
            <label className="sr-only" htmlFor="op">
              Time period
            </label>
            <select id="op" value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="30d">Last 30 days</option>
              <option value="3m">Last 3 months</option>
              <option value="6m">Last 6 months</option>
              <option value={year}>{year}</option>
            </select>
          </div>
          <div className="ofilter" role="group" aria-label="Show orders">
            {FILTERS.map(([k, t]) => (
              <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}>
                {t}
                {counts ? ` (${counts[k]})` : ""}
              </button>
            ))}
          </div>
        </>
      )}
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
        noOrdersAtAll ? (
          <EmptyBox icon="truck" title="No orders yet" text="When you place an order, you can track, return and review it here.">
            <Link className="btn btn-primary" href="/">
              Start shopping
            </Link>
          </EmptyBox>
        ) : (
          <EmptyBox icon="truck" title={q ? `No orders match “${q}”` : "No orders here"} text="Try another filter or time period.">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setFilter("all");
                setQInput("");
                setQ("");
                setPeriod(year);
              }}
            >
              Show all orders
            </button>
          </EmptyBox>
        )
      ) : (
        <>
          {list.map((o) => (
            <OrderCard
              key={o.id}
              o={o}
              onReturn={() => startReturn(o)}
              onBuyAgain={() => buyAgain(o)}
              onCancel={() => cancel(o)}
              onViewReturn={() => go("returns")}
            />
          ))}
          {more && (
            <button type="button" className="btn btn-secondary" style={{ alignSelf: "center" }} onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "Loading…" : "Show more orders"}
            </button>
          )}
        </>
      )}
      {returning && (
        <ReturnDialog
          order={returning}
          onClose={() => setReturning(null)}
          onDone={() => {
            setReload((n) => n + 1);
            refreshSummary();
          }}
        />
      )}
    </>
  );
}

function OrderCard({
  o,
  onReturn,
  onBuyAgain,
  onCancel,
  onViewReturn,
}: {
  o: OrderSummary;
  onReturn: () => void;
  onBuyAgain: () => Promise<void>;
  onCancel: () => Promise<void>;
  onViewReturn: () => void;
}) {
  const h = headline(o);
  const goLink = useGoLink();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const open = isOpen(o.status);
  const canReturn = returnable(o);
  const returnBy = o.returnBy ?? (canReturn ? o.returnableUntil : null);
  const hasReturn = (o.returns?.length ?? 0) > 0 || o.status === "REFUNDED";
  const delivered = o.status === "DELIVERED";
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
          {(h.line || returnBy) && (
            <p className="oc-sub">
              {h.line}
              {returnBy ? `${h.line ? " · " : ""}Return or exchange by ${fmtShort(returnBy)}` : ""}
            </p>
          )}
          <div className="oc-items">
            {o.items.map((i) => (
              <div className="oc-item" key={i.productId}>
                <Thumb src={i.imageUrl} />
                <Link href={productHref(i)}>
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
          {open && o.status !== "PENDING_PAYMENT" && (
            <Link className="btn btn-primary" href={orderHref(o)}>
              Track package
            </Link>
          )}
          {canReturn && (
            <button type="button" className="btn btn-primary" onClick={onReturn}>
              Return or exchange
            </button>
          )}
          {hasReturn && (
            <button type="button" className="btn btn-secondary" onClick={onViewReturn}>
              View return
            </button>
          )}
          <Link className="btn btn-secondary" href={orderHref(o)}>
            View order details
          </Link>
          {!open && (
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
      <div className="oc-links">
        {isCancellable(o.status) && (
          <button type="button" onClick={() => setConfirming(true)} aria-expanded={confirming}>
            <DayloraIcon name="close" />
            Cancel order
          </button>
        )}
        <Link href={invoiceHref(o)}>
          <DayloraIcon name="file" />
          Invoice
        </Link>
        {delivered && (
          <Link {...goLink("reviews")}>
            <DayloraIcon name="star" />
            Write a review
          </Link>
        )}
        {(o.status === "SHIPPED" || delivered) && (
          <Link href="/help?t=contact">
            <DayloraIcon name="alert" />
            Problem with order
          </Link>
        )}
        <Link href="/help?t=contact">
          <DayloraIcon name="headset" />
          Get help
        </Link>
      </div>
      {confirming && (
        <CancelConfirm
          orderNumber={o.orderNumber}
          charged={o.status !== "PENDING_PAYMENT"}
          busy={cancelling}
          onKeep={() => setConfirming(false)}
          onCancel={async () => {
            setCancelling(true);
            await onCancel();
            setCancelling(false);
            setConfirming(false);
          }}
        />
      )}
    </article>
  );
}

function CancelConfirm({
  orderNumber,
  charged,
  busy,
  onKeep,
  onCancel,
}: {
  orderNumber: string;
  charged: boolean;
  busy: boolean;
  onKeep: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="confirm" role="alert">
      <span className="sp">
        <b>Cancel order {orderNumber}?</b>{" "}
        {charged ? "You'll get a full refund to your original payment." : "Nothing will be charged."}
      </span>
      <button type="button" className="btn btn-sm btn-secondary" onClick={onKeep} disabled={busy}>
        Keep order
      </button>
      <button type="button" className="btn btn-sm btn-danger" onClick={onCancel} disabled={busy}>
        {busy ? "Cancelling…" : "Cancel order"}
      </button>
    </div>
  );
}

/* ===========================================================================
   One order: tracking, items, shipping, payment, help, cancel, returns
   =========================================================================== */

export function useOrder(orderRef: string, onLoaded: (orderNumber: string) => void) {
  const [order, setOrder] = useState<Order | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        const s = statusCode(e);
        if (s === 404 || s === 403 || s === 400) setMissing(true);
        else setError(getApiErrorMessage(e, "We couldn't load this order."));
      });
    return () => {
      live = false;
    };
  }, [orderRef, reload, onLoaded]);

  return { order, setOrder, missing, error, reload: () => setReload((n) => n + 1) };
}

/** Not found / error / loading states shared by the order and invoice pages. */
export function OrderStates({
  orderRef,
  missing,
  error,
  retry,
  back,
}: {
  orderRef: string;
  missing: boolean;
  error: string | null;
  retry: () => void;
  back: ReactNode;
}) {
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
            <button type="button" className="link inline" onClick={retry}>
              Try again
            </button>
          </span>
        </div>
      </>
    );
  }
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

export function OrderDetailView({ orderRef, onLoaded }: { orderRef: string; onLoaded: (orderNumber: string) => void }) {
  const toast = useAccountToast();
  const { refreshSummary } = useAccountShell();
  const goLink = useGoLink();
  const router = useRouter();
  const add = useCartStore((s) => s.add);
  const { order, setOrder, missing, error, reload } = useOrder(orderRef, onLoaded);
  const [returning, setReturning] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  async function cancel() {
    if (!order) return;
    setCancelling(true);
    try {
      const r = await orderService.cancelOrder(order.id);
      setOrder(r.data.data ?? order);
      setConfirmCancel(false);
      refreshSummary();
      toast({
        title: "Order cancelled",
        body: order.paymentStatus === "SUCCEEDED" ? "Your refund is on its way." : "Nothing was charged.",
      });
    } catch (e) {
      toast({ title: "Couldn't cancel this order", body: getApiErrorMessage(e, "It may already be on its way.") });
      reload();
    } finally {
      setCancelling(false);
    }
  }

  async function buyOne(i: OrderItem) {
    setAdding(i.id);
    try {
      await add(i.productId, 1);
      toast({ title: "Added to cart", body: i.productName, action: { label: "View cart", onClick: () => router.push("/cart") } });
    } catch (e) {
      toast({ title: "Couldn't add this item", body: getApiErrorMessage(e, "It's out of stock or no longer sold.") });
    } finally {
      setAdding(null);
    }
  }

  const back = (
    <Link href="/account#orders" className="back-link">
      <DayloraIcon name="arrow" />
      All orders
    </Link>
  );

  if (!order) return <OrderStates orderRef={orderRef} missing={missing} error={error} retry={reload} back={back} />;

  const h = headline(order);
  const shipment = order.shipments[0];
  const a = order.shippingAddress;
  const canReturn = returnable(order) && order.items.some((i) => leftToReturn(order, i) > 0);
  const canCancel = isCancellable(order.status);
  const stopped = order.status === "CANCELLED" || order.status === "PAYMENT_FAILED";
  const delivered = order.status === "DELIVERED";
  const savings = order.savingsTotal ?? 0;

  return (
    <>
      {back}
      <div className="sub-h">
        <div>
          <h1>
            Order <span className="mono">{order.orderNumber}</span>
          </h1>
          <p>Placed {fmtLong(order.createdAt)}</p>
        </div>
        <div className="help-row">
          <Link className="btn btn-secondary btn-sm" href={invoiceHref(order)}>
            <DayloraIcon name="file" />
            Invoice
          </Link>
          {canCancel && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfirmCancel(true)} aria-expanded={confirmCancel}>
              Cancel order
            </button>
          )}
        </div>
      </div>
      {confirmCancel && (
        <div className="oc">
          <CancelConfirm
            orderNumber={order.orderNumber}
            charged={order.paymentStatus === "SUCCEEDED"}
            busy={cancelling}
            onKeep={() => setConfirmCancel(false)}
            onCancel={cancel}
          />
        </div>
      )}
      <div className="det-grid">
        <div className="det-col">
          <section className="card" aria-labelledby="tH">
            <div className="trk-h">
              <h2 id="tH" className={`oc-st ${h.tone}`}>
                {h.label}
              </h2>
              {shipment && !stopped ? (
                <p>
                  <TrackingRef shipment={shipment} />
                </p>
              ) : isOpen(order.status) ? (
                <p>Tracking number arrives by email when it ships</p>
              ) : stopped ? (
                <p>{h.line}</p>
              ) : null}
            </div>
            {!stopped && (
              <>
                {h.line && <p className="oc-sub trk-line">{h.line}</p>}
                <Steps order={order} />
                <h3 className="scans-h">Tracking history</h3>
                <Scans order={order} />
              </>
            )}
          </section>
          <section className="card" aria-labelledby="iH">
            <h2 id="iH">Items</h2>
            <div className="oc-items flush">
              {order.items.map((i) => (
                <div className="oc-item priced top" key={i.id}>
                  <Thumb src={i.imageUrl} />
                  <div>
                    <Link href={productHref(i)}>
                      <b>{i.productName}</b>
                    </Link>
                    <span>
                      {variantText(i)}
                      {variantText(i) ? " · " : ""}Qty {i.quantity}
                    </span>
                    {i.returnedQuantity > 0 && <span className="ret-note">{i.returnedQuantity} returned</span>}
                    <div className="item-acts">
                      <button type="button" onClick={() => buyOne(i)} disabled={adding === i.id}>
                        {adding === i.id ? "Adding…" : "Buy again"}
                      </button>
                      {delivered && <Link {...goLink("reviews")}>Write a review</Link>}
                      {canReturn && leftToReturn(order, i) > 0 && (
                        <button type="button" onClick={() => setReturning(true)}>
                          Return or exchange
                        </button>
                      )}
                    </div>
                  </div>
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
              <dt>Paid with</dt>
              <dd>{paymentText(order)}</dd>
              <dt>Subtotal</dt>
              <dd>{money(order.subtotal, order.currency)}</dd>
              {savings > 0 && (
                <>
                  <dt>You saved</dt>
                  <dd className="good">−{money(savings, order.currency)}</dd>
                </>
              )}
              {order.discountTotal > 0 && (
                <>
                  <dt>Promo{order.promoCode ? ` ${order.promoCode}` : ""}</dt>
                  <dd>−{money(order.discountTotal, order.currency)}</dd>
                </>
              )}
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
            <h2 id="hH">Need help with this order?</h2>
            <div className="help-row">
              {canReturn && (
                <button type="button" className="btn btn-primary" onClick={() => setReturning(true)}>
                  Return or exchange
                </button>
              )}
              <Link className="btn btn-secondary" href="/help?t=contact">
                Contact us
              </Link>
            </div>
            <p className="muted-note">
              {order.status === "REFUNDED"
                ? "This order was returned and refunded."
                : order.status === "CANCELLED"
                  ? "This order was cancelled."
                  : canReturn
                    ? `Free returns and exchanges until ${fmtShort(order.returnableUntil!)}.`
                    : delivered && returnable(order)
                      ? "Everything in this order is already being returned."
                      : delivered
                        ? "The return window for this order has closed."
                        : "Returns open once your order is delivered."}
            </p>
            {order.returns.length > 0 && (
              <ul className="ret-list" aria-label="Returns">
                {order.returns.map((r) => (
                  <li key={r.id}>
                    <span>
                      <Link className="mono" {...goLink("returns")}>
                        {r.rmaNumber}
                      </Link>{" "}
                      · {RETURN_LABEL[r.status]}
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
        <ReturnDialog
          order={order}
          onClose={() => setReturning(false)}
          onDone={() => {
            reload();
            refreshSummary();
          }}
        />
      )}
    </>
  );
}

/* ===========================================================================
   Return flow: items + reason → method + refund → done (FR-AD-07, contract C3)
   =========================================================================== */

const REASONS = ["Doesn't fit", "Changed my mind", "Arrived damaged", "Not as described", "Wrong item sent", "Better price elsewhere"];

/** Units of a line that can still be returned (mirrors the server rule). */
function leftToReturn(order: Order, item: OrderItem): number {
  const requested = order.returns
    .filter((r) => r.status !== "REJECTED")
    .flatMap((r) => r.items)
    .filter((ri) => ri.orderItemId === item.id)
    .reduce((n, ri) => n + ri.quantity, 0);
  return Math.max(0, item.quantity - Math.max(item.returnedQuantity, requested));
}

/**
 * The next `n` business days as YYYY-MM-DD, counted from today's UTC date: the
 * server accepts pickup days 1–14 days after its (UTC) today, so a US evening,
 * when UTC is already tomorrow, must not offer that day.
 */
function businessDays(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  while (out.length < n) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (d.getUTCDay() % 6 === 0) continue;
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`);
  }
  return out;
}

/** "9 AM – 7 PM" → "between 9 AM and 7 PM". */
const windowText = (w: string | null | undefined) => {
  const [a, b] = (w || "9 AM – 7 PM").split(/\s*[–-]\s*/);
  return b ? `between ${a} and ${b}` : w;
};

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
  const pickupDays = useRef(businessDays(5)).current;
  const [pickupDate, setPickupDate] = useState(pickupDays[0]);
  const [refundTo, setRefundTo] = useState<ReturnRefundTo>("ORIGINAL");
  const [errs, setErrs] = useState<{ sel?: boolean; reason?: boolean }>({});
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<OrderReturn | null>(null);
  const reasonRef = useRef<HTMLSelectElement>(null);

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
        refundTo,
        pickupDate: method === "PICKUP" ? pickupDate : undefined,
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

  const dest = refundTo === "STORE_CREDIT" ? "store credit" : refundDest(order);

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
                  <b>Drop off at a {CARRIER} location</b>
                  <small>Show a QR code, no box or label needed.</small>
                </span>
              </label>
              <label className="ro">
                <input type="radio" name="rm" checked={method === "PICKUP"} onChange={() => setMethod("PICKUP")} />
                <span>
                  <b>Schedule a pickup</b>
                  <small>
                    {CARRIER} collects it from {order.shippingAddress.addressLine1} on a day you choose.
                  </small>
                </span>
              </label>
              {method === "PICKUP" && (
                <div className="field">
                  <label htmlFor="pkd">Pickup day</label>
                  <select id="pkd" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)}>
                    {pickupDays.map((d) => (
                      <option key={d} value={d}>
                        {fmtDay(d)}
                      </option>
                    ))}
                  </select>
                  <p className="hint">{CARRIER} comes by 9 AM – 7 PM.</p>
                </div>
              )}
              <fieldset className="ro-set">
                <legend>Refund to</legend>
                <label className="ro">
                  <input type="radio" name="rt" checked={refundTo === "ORIGINAL"} onChange={() => setRefundTo("ORIGINAL")} />
                  <span>
                    <b>Original payment</b>
                    <small>{paymentText(order)}</small>
                  </span>
                </label>
                <label className="ro">
                  <input type="radio" name="rt" checked={refundTo === "STORE_CREDIT"} onChange={() => setRefundTo("STORE_CREDIT")} />
                  <span>
                    <b>Store credit</b>
                    <small>Added to your account once we receive the return.</small>
                  </span>
                </label>
              </fieldset>
              <div className="alert ok">
                <DayloraIcon name="return" />
                <span>
                  Estimated refund <b>{money(estimate, order.currency)}</b> to your {dest} within 5–7 business days after we
                  receive it.
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
                  ? `Show this code at any ${CARRIER} location${done.dropoffBy ? ` by ${fmtShort(done.dropoffBy)}` : ""}.`
                  : `${CARRIER} will pick it up ${done.pickupDate ? `on ${fmtDay(done.pickupDate)}` : "on the next business day"} ${windowText(done.pickupWindow)}.`}
              </p>
              {method === "DROPOFF" && done.dropoffCode && (
                <>
                  <QrCode value={done.dropoffCode} className="qr" label={`Return QR code ${done.dropoffCode}`} />
                  <span className="mono">{done.dropoffCode}</span>
                </>
              )}
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
