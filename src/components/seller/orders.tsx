"use client";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import sellerService from "@/services/seller/seller.service";
import type { SellerOrderDetail, SellerOrderRow, SellerOrderState } from "@/types/api/seller.types";
import { Dialog, FieldError, Ico, Pill, errorText } from "./ui";

type Tone = "ok" | "bad" | "warn" | "info" | "off";

/** designs/seller/seller-orders.html */
export const ORDER_STATE: Record<SellerOrderState, { tone: Tone; label: string }> = {
  new: { tone: "warn", label: "To ship" },
  shipped: { tone: "info", label: "Shipped" },
  delivered: { tone: "ok", label: "Delivered" },
  return: { tone: "warn", label: "Return requested" },
  returned: { tone: "off", label: "Returned" },
  cancelled: { tone: "off", label: "Cancelled" },
};

export const OrderStatePill = ({ state }: { state: SellerOrderState }) => <Pill tone={ORDER_STATE[state].tone}>{ORDER_STATE[state].label}</Pill>;

export const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export const dateOf = (iso: string | number | Date, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) =>
  new Date(iso).toLocaleDateString("en-US", opts);

export const timeOf = (iso: string | number | Date) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/** How urgent shipping is: late, today, or a date. */
export function shipDue(o: Pick<SellerOrderRow, "shipBy">): ["bad" | "warn" | "", string] {
  if (!o.shipBy) return ["", ""];
  const d = new Date(o.shipBy).getTime() - Date.now();
  if (d < 0) return ["bad", `Late by ${Math.max(1, Math.round(-d / 3_600_000))} h`];
  if (d < 12 * 3_600_000) return ["warn", `Ship today · ${Math.max(1, Math.round(d / 3_600_000))} h left`];
  return ["", `Ship by ${dateOf(o.shipBy, { weekday: "short", month: "short", day: "numeric" })}`];
}

export const dueClass = (level: string) => (level === "bad" ? "sp-due-bad" : level === "warn" ? "sp-due-warn" : "");

/** Help & support, opening a new ticket about an order or a payout. */
export const ticketHref = (topic: "orders" | "payments", ref?: string) =>
  `/merchant/support?new=1&topic=${topic}${ref ? `&ref=${encodeURIComponent(ref)}` : ""}`;

/** Orders | Earnings & payouts */
export function OrdersTabs({ active }: { active: "orders" | "earnings" }) {
  return (
    <nav className="sp-vtabs" aria-label="Orders and earnings">
      <Link href="/merchant/orders" aria-current={active === "orders" ? "page" : undefined}>
        Orders
      </Link>
      <Link href="/merchant/orders/earnings" aria-current={active === "earnings" ? "page" : undefined}>
        Earnings &amp; payouts
      </Link>
    </nav>
  );
}

/** Saves a downloaded Blob under `name`. */
export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const CARRIERS = ["UPS", "USPS", "FedEx", "DHL", "Other"];
const CANCEL_REASONS = ["Out of stock", "Item damaged", "Can't ship to this address", "Pricing error", "Other"];

/** "Mark as shipped": carrier and tracking number; the customer gets the tracking link by email. */
export function ShipDialog({
  order,
  onClose,
  onDone,
}: {
  order: { orderNumber: string; shipToCity: string; shipToState: string; name?: string } | null;
  onClose: () => void;
  onDone: (o: SellerOrderDetail) => void;
}) {
  const [carrier, setCarrier] = useState("UPS");
  const [tracking, setTracking] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!order) return;
    const t = tracking.replace(/\s+/g, "");
    if (t.length < 8) return setErr("Enter the full tracking number from your carrier label");
    setBusy(true);
    try {
      const res = await sellerService.shipOrder(order.orderNumber, { carrier, trackingNumber: t });
      toast.success(`${order.orderNumber} marked as shipped. The customer has the tracking link.`);
      setTracking("");
      setErr(null);
      onDone(res.data.data!);
    } catch (e) {
      setErr(errorText(e, "We couldn't mark this order as shipped."));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open={!!order} onClose={onClose} label={order ? `Mark ${order.orderNumber} as shipped` : "Mark as shipped"}>
      {order ? (
        <form
          className="sp-form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <div className="sp-dh">
            <h2>Mark {order.orderNumber} as shipped</h2>
            <button type="button" className="sp-btn sp-btn-ghost sp-btn-sm" onClick={onClose} aria-label="Close">
              <Ico name="x" />
            </button>
          </div>
          <p className="sp-muted" style={{ fontSize: 14 }}>
            The customer gets the tracking link by email. Ship to{" "}
            <b style={{ color: "var(--ink)" }}>
              {order.name ? `${order.name}, ` : ""}
              {order.shipToCity}, {order.shipToState}
            </b>
            .
          </p>
          <label className="sp-field" htmlFor="sp-car">
            <span className="sp-lab">Carrier</span>
            <select className="sp-inp" id="sp-car" value={carrier} onChange={(e) => setCarrier(e.target.value)}>
              {CARRIERS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="sp-field" htmlFor="sp-trk">
            <span className="sp-lab">Tracking number</span>
            <input
              className="sp-inp sp-mono"
              id="sp-trk"
              autoComplete="off"
              autoFocus
              value={tracking}
              aria-invalid={err ? true : undefined}
              aria-describedby={err ? "sp-trk-e" : undefined}
              onChange={(e) => {
                setTracking(e.target.value);
                setErr(null);
              }}
              placeholder="e.g. 1Z999AA10123456784"
            />
            <FieldError id="sp-trk-e">{err}</FieldError>
          </label>
          <div className="sp-df">
            <button type="button" className="sp-btn sp-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="sp-btn sp-btn-pri" disabled={busy}>
              <Ico name="check" />
              {busy ? "Saving…" : "Confirm shipped"}
            </button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}

/** "Can't ship it? Cancel order": the customer is refunded in full. */
export function CancelDialog({ orderNumber, onClose, onDone }: { orderNumber: string | null; onClose: () => void; onDone: (o: SellerOrderDetail) => void }) {
  const [reason, setReason] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!orderNumber) return;
    if (!reason) return setErr("Choose a reason");
    setBusy(true);
    try {
      const res = await sellerService.cancelOrder(orderNumber, { reason });
      toast.success(`${orderNumber} cancelled. The customer has been refunded.`);
      onDone(res.data.data!);
    } catch (e) {
      setErr(errorText(e, "We couldn't cancel this order."));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open={!!orderNumber} onClose={onClose} label={orderNumber ? `Cancel ${orderNumber}?` : "Cancel order"}>
      {orderNumber ? (
        <form
          className="sp-form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <div className="sp-dh">
            <h2>Cancel {orderNumber}?</h2>
            <button type="button" className="sp-btn sp-btn-ghost sp-btn-sm" onClick={onClose} aria-label="Close">
              <Ico name="x" />
            </button>
          </div>
          <div className="sp-alert sp-alert-warn">
            <Ico name="warn" />
            <span>The customer is refunded in full. Seller cancellations count against your rating, so only cancel if you really can&apos;t ship.</span>
          </div>
          <label className="sp-field" htmlFor="sp-cr">
            <span className="sp-lab">Reason</span>
            <select
              className="sp-inp"
              id="sp-cr"
              value={reason}
              aria-invalid={err ? true : undefined}
              onChange={(e) => {
                setReason(e.target.value);
                setErr(null);
              }}
            >
              <option value="">Choose a reason</option>
              {CANCEL_REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <FieldError id="sp-cr-e">{err}</FieldError>
          </label>
          <div className="sp-df">
            <button type="button" className="sp-btn sp-btn-ghost" onClick={onClose}>
              Keep order
            </button>
            <button type="submit" className="sp-btn sp-btn-danger-solid" disabled={busy}>
              {busy ? "Cancelling…" : "Cancel order"}
            </button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
