"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DayloraIcon } from "../DayloraIcons";
import type { DeliveryWindow, Order, OrderStatus, OrderSummary, Shipment } from "@/types/api/order.types";

/* ---------------------------------------------------------------------------
   Shared by sign in (design 07), your account (08) and track an order (09).
   --------------------------------------------------------------------------- */

export const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v);

/** The new-password rule everywhere (contract §4 Auth): 8+ characters, a letter and a digit. */
export const PW_RULES = [
  { key: "len", label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { key: "num", label: "A number", test: (v: string) => /\d/.test(v) },
  { key: "let", label: "A letter", test: (v: string) => /[a-z]/i.test(v) },
] as const;
export const passwordOk = (v: string) => PW_RULES.every((r) => r.test(v));
export const PW_RULE_MESSAGE = "Use at least 8 characters with a letter and a number.";

export const firstName = (fullName: string | null | undefined) => fullName?.trim().split(/\s+/)[0] || "there";

/** "Jordan Miller" → ["Jordan", "Miller"]. */
export function splitName(fullName: string | null | undefined): [string, string] {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  return [parts[0] ?? "", parts.slice(1).join(" ")];
}

/* ---- dates ---- */

/** ISO timestamps, or plain YYYY-MM-DD dates read as local days (so they don't shift a day west of UTC). */
export function toDate(v: string | Date): Date {
  if (v instanceof Date) return v;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(v);
}
export const fmtDay = (v: string | Date) =>
  toDate(v).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
export const fmtShort = (v: string | Date) => toDate(v).toLocaleDateString("en-US", { month: "short", day: "numeric" });
export const fmtLong = (v: string | Date) =>
  toDate(v).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
export const fmtTime = (v: string | Date) => toDate(v).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const money = (n: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);

/* ---- order status, as the shopper reads it (FR-ST-12, FR-IN-04) ---- */

export type Tone = "go" | "ok" | "grey" | "warn";
export interface Headline {
  label: string;
  tone: Tone;
  line: string;
}

/** What any order-ish shape needs for the headline, steps and scans. */
interface OrderLike {
  status: OrderStatus | `${OrderStatus}`;
  createdAt: string;
  deliveredAt: string | null;
  estimatedDelivery: DeliveryWindow | null;
  shipments?: Shipment[];
  latestShipment?: OrderSummary["latestShipment"];
  shippedAt?: string | null;
  timeline?: { status: string; note: string | null; at: string }[];
  returns?: Order["returns"];
  refundedTotal?: number;
}

const arrives = (w: DeliveryWindow | null) =>
  w ? (w.from === w.to ? `Arrives ${fmtDay(w.to)}` : `Arrives ${fmtDay(w.from)} – ${fmtDay(w.to)}`) : "";

/** Newest carrier scan across the order's shipments. */
function latestScan(o: OrderLike) {
  const events = (o.shipments ?? []).flatMap((s) => s.events);
  return events.sort((a, b) => +new Date(b.occurredAt) - +new Date(a.occurredAt))[0] ?? null;
}

function eventAt(o: OrderLike, status: string): string | null {
  const e = (o.timeline ?? []).filter((t) => t.status === status).pop();
  return e?.at ?? null;
}

export function headline(o: OrderLike): Headline {
  const scan = latestScan(o);
  switch (o.status) {
    case "PENDING_PAYMENT":
      return { label: "Awaiting payment", tone: "warn", line: "We'll start preparing it as soon as payment is confirmed" };
    case "PAID":
    case "CONFIRMED":
      return { label: "Preparing to ship", tone: "go", line: arrives(o.estimatedDelivery) };
    case "SHIPPED": {
      const out = scan?.status === "OUT_FOR_DELIVERY" || o.latestShipment?.status === "OUT_FOR_DELIVERY";
      if (out) return { label: "Out for delivery", tone: "go", line: "Arriving today" };
      const to = o.estimatedDelivery?.to;
      return { label: to ? `Arriving ${fmtDay(to)}` : "On the way", tone: "go", line: "On the way" };
    }
    case "DELIVERED": {
      const open = (o.returns ?? []).find((r) => r.status !== "REJECTED" && r.status !== "REFUNDED");
      const line = open
        ? `Return ${open.rmaNumber} ${open.status === "REQUESTED" ? "requested" : open.status.toLowerCase()}`
        : scan?.status === "DELIVERED" && scan.description
          ? scan.description
          : "";
      return { label: o.deliveredAt ? `Delivered ${fmtShort(o.deliveredAt)}` : "Delivered", tone: "ok", line };
    }
    case "REFUNDED": {
      const refundedAt =
        (o.returns ?? []).map((r) => r.refundedAt).filter(Boolean).sort().pop() ?? eventAt(o, "REFUNDED");
      return {
        label: o.deliveredAt ? "Returned · refunded" : "Refunded",
        tone: "grey",
        line: refundedAt ? `Refund issued ${fmtShort(refundedAt)}` : "Refund issued",
      };
    }
    case "CANCELLED": {
      const at = eventAt(o, "CANCELLED");
      const refunded = (o.refundedTotal ?? 0) > 0;
      return {
        label: "Cancelled",
        tone: "grey",
        line: `${at ? `Cancelled ${fmtShort(at)}` : "This order was cancelled"}${refunded ? " · refunded in full" : ""}`,
      };
    }
    case "PAYMENT_FAILED":
      return { label: "Payment didn't go through", tone: "warn", line: "This order wasn't placed and nothing was charged" };
    default:
      return { label: String(o.status), tone: "grey", line: "" };
  }
}

/** Orders that are still on their way to the shopper. */
export const isOpen = (status: string) => ["PENDING_PAYMENT", "PAID", "CONFIRMED", "SHIPPED"].includes(status);

/* ---- 4-step progress: Ordered → Shipped → Out for delivery → Delivered ---- */

export function steps(o: OrderLike) {
  const now = new Date();
  const scans = (o.shipments ?? []).flatMap((s) => s.events);
  const shippedAt =
    o.shippedAt ??
    eventAt(o, "SHIPPED") ??
    (o.shipments ?? []).map((s) => s.createdAt).sort()[0] ??
    null;
  const outScan = scans.filter((e) => e.status === "OUT_FOR_DELIVERY").sort((a, b) => +new Date(b.occurredAt) - +new Date(a.occurredAt))[0];
  const delivered = !!o.deliveredAt;
  const shipped = delivered || !!shippedAt || o.status === "SHIPPED" || o.status === "DELIVERED";
  const out = delivered || !!outScan;
  const stopped = o.status === "CANCELLED" || o.status === "PAYMENT_FAILED";
  const estTo = o.estimatedDelivery?.to;
  return {
    stopped,
    items: [
      { t: "Ordered", d: fmtShort(o.createdAt), on: true },
      {
        t: "Shipped",
        d: shipped ? (shippedAt ? fmtShort(shippedAt) : "—") : stopped ? "—" : "Within 1 business day",
        on: shipped,
      },
      {
        t: "Out for delivery",
        d: outScan ? (sameDay(new Date(outScan.occurredAt), now) ? "Today" : fmtShort(outScan.occurredAt)) : "—",
        on: out,
      },
      {
        t: "Delivered",
        d: delivered ? fmtShort(o.deliveredAt!) : estTo && !stopped ? `${fmtShort(estTo)} est.` : "—",
        on: delivered,
      },
    ],
  };
}

export function Steps({ order }: { order: OrderLike }) {
  const s = steps(order);
  return (
    <ol className={`tl${s.stopped ? " stopped" : ""}`} aria-label="Delivery progress">
      {s.items.map((x) => (
        <li key={x.t} className={x.on ? "on" : undefined}>
          <span className="dot">{x.on && <DayloraIcon name="check" />}</span>
          <b>{x.t}</b>
          <span>
            <span className="sr-only">{x.on ? "Done: " : "Not yet: "}</span>
            {x.d}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Carrier scan history, newest first, ending with the order being placed. */
export function Scans({ order }: { order: OrderLike }) {
  const rows = (order.shipments ?? [])
    .flatMap((s) =>
      s.events.map((e) => ({
        at: e.occurredAt,
        title: e.description || SCAN_LABEL[e.status] || e.status,
        place: e.location ?? s.carrier,
      }))
    )
    .concat([{ at: order.createdAt, title: "Order placed", place: "Online" }])
    .sort((a, b) => +new Date(b.at) - +new Date(a.at));
  return (
    <ul className="scans">
      {rows.map((e, i) => (
        <li key={`${e.at}-${i}`}>
          <span className="when">
            <b>{fmtDay(e.at)}</b>
            {fmtTime(e.at)}
          </span>
          <span className="what">
            <b>{e.title}</b>
            <span>{e.place}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

const SCAN_LABEL: Record<string, string> = {
  LABEL_CREATED: "Label created",
  IN_TRANSIT: "In transit",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  EXCEPTION: "Delivery problem",
  RETURNED: "Returned to sender",
};

/** The shipment's carrier and tracking number, linked to the carrier when we have a URL. */
export function TrackingRef({ shipment }: { shipment: Pick<Shipment, "carrier" | "trackingNumber" | "trackingUrl"> }) {
  return (
    <>
      {shipment.carrier} ·{" "}
      {shipment.trackingUrl ? (
        <a className="mono" href={shipment.trackingUrl} target="_blank" rel="noopener noreferrer">
          {shipment.trackingNumber}
          <span className="sr-only"> (opens the carrier&apos;s site)</span>
        </a>
      ) : (
        <span className="mono">{shipment.trackingNumber}</span>
      )}
    </>
  );
}

/** Product thumbnail with an icon fallback when the image is missing or broken. */
export function Thumb({ src, alt = "" }: { src: string | null | undefined; alt?: string }) {
  const [broken, setBroken] = useState(false);
  return (
    <span className="th">
      {src && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading="lazy" onError={() => setBroken(true)} />
      ) : (
        <DayloraIcon name="box" />
      )}
    </span>
  );
}

export const variantText = (i: { variantName?: string | null; color?: string | null; size?: string | null }) =>
  i.variantName || [i.color, i.size].filter(Boolean).join(" · ");

/** Order numbers as shoppers type them: "ec4821907", "EC 4821907" → "EC-4821907". */
export function normalizeOrderNumber(v: string): string {
  const s = v.trim().toUpperCase().replace(/\s+/g, "");
  const m = /^(EC)-?(\d{5,7})$/.exec(s);
  return m ? `${m[1]}-${m[2]}` : s;
}
export const orderNumberOk = (v: string) => /^EC-?\d{5,7}$/i.test(v.trim().replace(/\s+/g, "")) || /^NX-[A-Z0-9-]{4,}$/i.test(v.trim());

/* ---- design toast (top of the screen, optional action) ---- */

export interface ToastMsg {
  title: string;
  body?: string;
  action?: { label: string; onClick: () => void };
}

export function useToast() {
  const [toast, setToast] = useState<ToastMsg | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  const show = (t: ToastMsg) => {
    setToast(t);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 4500);
  };
  return { toast, show, hide: () => setToast(null) };
}

export function Toast({ toast }: { toast: ToastMsg | null }) {
  return (
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
      {toast?.action && (
        <button type="button" className="toast-act" onClick={toast.action.onClick}>
          {toast.action.label}
        </button>
      )}
    </div>
  );
}

/** True once the persisted auth store has been read on the client. */
export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

export function Crumbs({ trail }: { trail: { label: string; href?: string }[] }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {trail.map((c, i) => (
        <span key={c.label} style={{ display: "contents" }}>
          {i > 0 && <DayloraIcon name="chev" />}
          {c.href ? <Link href={c.href}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
        </span>
      ))}
    </nav>
  );
}
