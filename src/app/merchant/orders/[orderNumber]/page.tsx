"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CancelDialog, OrderStatePill, ShipDialog, dateOf, dueClass, shipDue, ticketHref, timeOf, usd } from "@/components/seller/orders";
import { Ico, LoadError, Loading, Thumb, errorText, rel, useLoad } from "@/components/seller/ui";
import { useTitle } from "@/components/seller/useSellerSession";
import sellerService from "@/services/seller/seller.service";
import type { SellerOrderDetail } from "@/types/api/seller.types";

type Step = { title: string; detail: string; tone: "done" | "now" | "bad" | "" };

function timeline(o: SellerOrderDetail): Step[] {
  if (o.state === "cancelled") {
    return [
      { title: "Order placed", detail: timeOf(o.paidAt), tone: "done" },
      { title: "Cancelled", detail: [o.cancellationReason, o.cancellation ? timeOf(o.cancellation.at) : null].filter(Boolean).join(" · "), tone: "bad" },
    ];
  }
  const steps: Step[] = [
    { title: "Order placed", detail: timeOf(o.paidAt), tone: "done" },
    {
      title: "Shipped",
      detail: o.shippedAt ? `${o.shipment?.carrier ?? ""} · ${timeOf(o.shippedAt)}` : shipDue(o)[1] || "—",
      tone: o.shippedAt ? "done" : o.state === "new" ? "now" : "",
    },
    {
      title: "Delivered",
      detail: o.deliveredAt ? timeOf(o.deliveredAt) : o.state === "shipped" ? "On the way" : "—",
      tone: o.deliveredAt ? "done" : o.state === "shipped" ? "now" : "",
    },
  ];
  if (o.return) {
    steps.push({
      title: o.return.status === "REFUNDED" ? "Returned and refunded" : `Return ${o.return.status === "REQUESTED" ? "requested" : o.return.status.toLowerCase()}`,
      detail: `${o.return.reason} · ${timeOf(o.return.refundedAt ?? o.return.requestedAt)}`,
      tone: o.return.status === "REFUNDED" ? "done" : "now",
    });
  }
  return steps;
}

function payoutText(o: SellerOrderDetail) {
  switch (o.payout.status) {
    case "PAID":
      return `Paid in ${o.payout.reference}${o.payout.paidAt ? ` on ${dateOf(o.payout.paidAt)}` : ""}`;
    case "SCHEDULED":
      return `In payout ${o.payout.reference} · ${o.payout.scheduledFor ? dateOf(o.payout.scheduledFor, { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }) : ""}`;
    case "NEXT":
      return `In your next payout · ${o.payout.scheduledFor ? dateOf(o.payout.scheduledFor, { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }) : "Friday"}`;
    case "NONE":
      return o.state === "cancelled" ? "Nothing to pay: order cancelled" : "Refunded to the customer: not paid out";
    default:
      return o.state === "return" ? "On hold until the return is settled" : "Paid after delivery";
  }
}

/** One order (designs/seller/seller-orders.html, #order/…). */
export default function SellerOrderPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const number = decodeURIComponent(orderNumber);
  useTitle(`Order ${number}`);
  const load = useLoad(() => sellerService.order(number), [number]);
  const [shipping, setShipping] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [busy, setBusy] = useState(false);
  const o = load.data;

  const approve = async () => {
    setBusy(true);
    try {
      load.setData((await sellerService.approveReturn(number)).data.data);
      toast.success("Return approved. The customer gets a prepaid label.");
    } catch (e) {
      toast.error(errorText(e, "We couldn't approve this return."));
    } finally {
      setBusy(false);
    }
  };

  if (load.error && !o) {
    return (
      <>
        <p className="sp-crumb">
          <Link href="/merchant/orders">Orders</Link> / {number}
        </p>
        <LoadError error={load.error} onRetry={load.reload} what="this order" />
      </>
    );
  }
  if (!o) return <Loading />;

  const [level, due] = shipDue(o);
  const units = o.lines.reduce((a, l) => a + l.quantity, 0);
  const rate = o.sales ? Math.round((o.commission / Math.max(o.sales - o.refunds, 0.01)) * 100) : 15;
  const slip = `/merchant/orders/${encodeURIComponent(o.orderNumber)}/slip`;

  return (
    <>
      <p className="sp-crumb">
        <Link href="/merchant/orders">Orders</Link> / {o.orderNumber}
      </p>
      <div className="sp-ohead">
        <div>
          <h1>Order {o.orderNumber}</h1>
          <div className="sp-meta2">
            <OrderStatePill state={o.state} />
            <span>Placed {timeOf(o.paidAt)}</span>
            {o.state === "new" ? <span className={dueClass(level)}>{due}</span> : null}
          </div>
        </div>
        <div className="sp-ph-a">
          {o.actions.ship ? (
            <button type="button" className="sp-btn sp-btn-pri" onClick={() => setShipping(true)}>
              <Ico name="box" />
              Mark as shipped
            </button>
          ) : null}
        </div>
      </div>

      {!o.ownsAll ? (
        <div className="sp-alert sp-alert-info" style={{ marginBottom: 16 }}>
          <Ico name="info" />
          <span>
            This order also has {o.otherSellersLines} item{o.otherSellersLines === 1 ? "" : "s"} from other sellers, so our team ships and handles it. You see your items only.
          </span>
        </div>
      ) : null}

      <div className="sp-od">
        <div className="sp-stack2">
          <section className="sp-card">
            <div className="sp-ch">
              <h2>Items</h2>
              <span className="sp-muted" style={{ fontSize: 13 }}>
                {units} unit{units === 1 ? "" : "s"}
              </span>
            </div>
            <ul className="sp-lines">
              {o.lines.map((l) => (
                <li key={l.sku}>
                  <Thumb src={l.imageUrl} size={48} />
                  <span style={{ minWidth: 0 }}>
                    <b>{l.productName}</b>
                    <small className="sp-mono">{l.sku}</small>{" "}
                    <small>
                      · {usd(l.unitPrice)} × {l.quantity}
                      {l.returnedQuantity ? ` · ${l.returnedQuantity} returned` : ""}
                    </small>
                  </span>
                  <b className="sp-num">{usd(l.lineTotal)}</b>
                </li>
              ))}
            </ul>
          </section>

          <section className="sp-card">
            <div className="sp-ch">
              <h2>Shipping</h2>
            </div>
            <div className="sp-addr">
              <b>{o.shipTo.name}</b>
              <br />
              {o.shipTo.addressLine1 ? (
                <>
                  {o.shipTo.addressLine1}
                  {o.shipTo.addressLine2 ? `, ${o.shipTo.addressLine2}` : ""}
                  <br />
                </>
              ) : null}
              {o.shipTo.city}, {o.shipTo.state} {o.shipTo.postalCode}
              {o.shipTo.phone ? (
                <>
                  <br />
                  <span className="sp-muted" style={{ fontSize: 13 }}>
                    {o.shipTo.phone}
                  </span>
                </>
              ) : null}
            </div>
            {o.shipment?.trackingNumber ? (
              <div className="sp-trk-box">
                <Ico name="box" />
                <span>{o.shipment.carrier}</span>
                <span className="sp-mono">{o.shipment.trackingNumber}</span>
                <button
                  type="button"
                  className="sp-btn sp-btn-ghost sp-btn-sm"
                  style={{ marginLeft: "auto" }}
                  onClick={() => {
                    void navigator.clipboard?.writeText(o.shipment!.trackingNumber!);
                    toast.success("Tracking number copied");
                  }}
                >
                  Copy
                </button>
              </div>
            ) : null}
            {o.state === "return" && o.return ? (
              <div className="sp-alert sp-alert-warn" style={{ marginTop: 12 }}>
                <Ico name="warn" />
                <span>
                  <b>Return {o.return.status === "REQUESTED" ? "requested" : o.return.status.toLowerCase()} {rel(o.return.requestedAt)}:</b> {o.return.reason}.{" "}
                  {o.return.status === "REQUESTED" ? "Approve it to send the customer a prepaid label, or raise a ticket if you disagree." : "Our team settles the refund once the parcel is back."}
                </span>
              </div>
            ) : null}
          </section>

          <section className="sp-card">
            <div className="sp-ch">
              <h2>Timeline</h2>
            </div>
            <ol className="sp-tline">
              {timeline(o).map((s) => (
                <li key={s.title} className={s.tone ? `sp-${s.tone}` : ""}>
                  <i aria-hidden="true" />
                  <span>
                    <b>{s.title}</b>
                    <small>{s.detail}</small>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="sp-side2">
          <section className="sp-card">
            <div className="sp-ch">
              <h2>Your earnings</h2>
            </div>
            <dl className="sp-money">
              <dt>Item total</dt>
              <dd>{usd(o.sales)}</dd>
              {o.refunds ? (
                <>
                  <dt>Refunded</dt>
                  <dd>−{usd(o.refunds)}</dd>
                </>
              ) : null}
              <dt>Commission ({rate}%)</dt>
              <dd>−{usd(o.commission)}</dd>
              <dt className="sp-tot">You earn</dt>
              <dd>{usd(o.net)}</dd>
            </dl>
            <p className="sp-note-s">{payoutText(o)}</p>
          </section>
          <section className="sp-card">
            <div className="sp-ch">
              <h2>Actions</h2>
            </div>
            <div className="sp-actlist">
              {o.actions.ship ? (
                <>
                  <button type="button" className="sp-btn sp-btn-pri" onClick={() => setShipping(true)}>
                    <Ico name="box" />
                    Mark as shipped
                  </button>
                  <a className="sp-btn sp-btn-sec" href={slip} target="_blank" rel="noreferrer">
                    <Ico name="doc" />
                    Print packing slip
                  </a>
                </>
              ) : null}
              {o.actions.cancel ? (
                <button type="button" className="sp-btn sp-btn-ghost" style={{ color: "var(--red)" }} onClick={() => setCancelling(true)}>
                  Can&apos;t ship it? Cancel order
                </button>
              ) : null}
              {o.actions.approveReturn ? (
                <button type="button" className="sp-btn sp-btn-pri" disabled={busy} onClick={approve}>
                  <Ico name="check" />
                  {busy ? "Approving…" : "Approve return"}
                </button>
              ) : null}
              {o.state === "shipped" && o.ownsAll ? (
                <a className="sp-btn sp-btn-sec" href={slip} target="_blank" rel="noreferrer">
                  <Ico name="doc" />
                  Packing slip
                </a>
              ) : null}
              <Link className="sp-btn sp-btn-sec" href={ticketHref("orders", o.orderNumber)}>
                <Ico name="mail" />
                Problem with this order? Raise a ticket
              </Link>
            </div>
          </section>
        </aside>
      </div>

      <ShipDialog
        order={shipping ? { orderNumber: o.orderNumber, shipToCity: o.shipTo.city, shipToState: o.shipTo.state, name: o.shipTo.name } : null}
        onClose={() => setShipping(false)}
        onDone={(next) => {
          setShipping(false);
          load.setData(next);
        }}
      />
      <CancelDialog
        orderNumber={cancelling ? o.orderNumber : null}
        onClose={() => setCancelling(false)}
        onDone={(next) => {
          setCancelling(false);
          load.setData(next);
        }}
      />
    </>
  );
}
