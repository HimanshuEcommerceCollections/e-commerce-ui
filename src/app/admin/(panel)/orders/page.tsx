"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import adminService from "@/services/admin/admin.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type {
  AdminOrderDetail,
  AdminOrderRow,
  AdminSettings,
  AdminShipment,
  FulfilmentStatus,
  OrderStats,
  OrderStatusValue,
  TrackingEventRequest,
} from "@/types/api/admin.types";
import { refreshAdminCounts } from "@/components/admin/refresh";
import {
  Drawer,
  FulfilmentPill,
  Icon,
  ORDER_STATUS,
  OrderPill,
  Pager,
  PaymentPill,
  ReturnPill,
  SHIPMENT_STATUS,
  ShipmentPill,
  dateTime,
  money,
  rangeText,
  toast,
  useDebounced,
  whenText,
} from "@/components/admin/ui";

type Status = OrderStatusValue;
const SIZE = 20;
const TABS: Array<{ key: Status | "ALL"; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "PAID", label: "To fulfil" },
  { key: "CONFIRMED", label: "In progress" },
  { key: "PENDING_PAYMENT", label: "Pending payment" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "CANCELLED", label: "Cancelled" },
  { key: "PAYMENT_FAILED", label: "Failed" },
  { key: "REFUNDED", label: "Refunded" },
];
const FULFILMENT: Array<[FulfilmentStatus, string]> = [
  ["UNFULFILLED", "Unfulfilled"],
  ["PICKED", "Picked"],
  ["PACKED", "Packed"],
  ["SHIPPED", "Shipped"],
  ["DELIVERED", "Delivered"],
];

/** Read once per visit: the shipping provider decides the Ship form (FR-IN-03). */
let settingsCache: AdminSettings | null = null;

export default function AdminOrdersPage() {
  const [tab, setTab] = useState<Status | "ALL">("ALL");
  const [fulfilment, setFulfilment] = useState<FulfilmentStatus | "">("");
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<AdminOrderRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  // Deep link from Customers or Returns: /admin/orders?id=…
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (id) setOpen(id);
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [list, s] = await Promise.all([
        adminService.listOrders({
          search: q || undefined,
          status: tab === "ALL" ? undefined : tab,
          fulfilmentStatus: fulfilment || undefined,
          page,
          size: SIZE,
        }),
        adminService.orderStats(),
      ]);
      const data = list.data.data!;
      setRows(data.content);
      setTotal(data.totalElements);
      setPages(data.totalPages);
      setStats(s.data.data);
    } catch (err) {
      setRows([]);
      setError(getApiErrorMessage(err, "Couldn't load orders"));
    }
  }, [q, tab, fulfilment, page]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => setPage(0), [q, tab, fulfilment]);

  const count = (s: Status | "ALL") => (stats ? (s === "ALL" ? stats.total : stats.byStatus[s] ?? 0) : null);
  const by = stats?.byStatus ?? {};
  const af = stats?.awaitingFulfilment ?? {};
  const rs = stats?.returnsByStatus ?? {};

  return (
    <section aria-labelledby="h-orders">
      <div className="page-head">
        <div>
          <h1 id="h-orders">Orders</h1>
          <p>Every order, with payment, fulfilment and shipping status.</p>
        </div>
      </div>

      <div className="stats">
        {(
          [
            ["To pick", af.UNFULFILLED ?? 0, "var(--warn)"],
            ["Picked or packed", (af.PICKED ?? 0) + (af.PACKED ?? 0), "var(--info)"],
            ["Pending payment", by.PENDING_PAYMENT ?? 0, "var(--info)"],
            ["Open returns", (rs.REQUESTED ?? 0) + (rs.APPROVED ?? 0) + (rs.RECEIVED ?? 0), "var(--bad)"],
          ] as const
        ).map(([label, n, color]) => (
          <div className="stat" key={label}>
            <span><i style={{ background: color }} />{label}</span>
            <b>{stats ? n : "…"}</b>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}>
              {t.label}
              <span className="c">{count(t.key) ?? "…"}</span>
            </button>
          ))}
        </div>
        <div className="toolbar">
          <label className="search">
            <Icon name="search" />
            <span className="sr-only">Search orders</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by order number, customer name or email" />
          </label>
          <select
            className="sel"
            aria-label="Fulfilment"
            value={fulfilment}
            onChange={(e) => setFulfilment(e.target.value as FulfilmentStatus | "")}
          >
            <option value="">Any fulfilment</option>
            {FULFILMENT.map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </div>
        <div className="twrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Customer</th>
                <th className="num">Items</th>
                <th className="num">Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Fulfilment</th>
              </tr>
            </thead>
            <tbody>
              {rows === null ? (
                <tr className="loading-row"><td colSpan={8}>Loading orders…</td></tr>
              ) : error ? (
                <tr className="empty-row"><td colSpan={8}><span className="err-text">{error}</span></td></tr>
              ) : rows.length === 0 ? (
                <tr className="empty-row"><td colSpan={8}>No orders here.</td></tr>
              ) : (
                rows.map((o) => {
                  const d = dateTime(o.createdAt);
                  const t = o.tracking?.[0];
                  return (
                    <tr key={o.id} className="click" onClick={() => setOpen(o.id)}>
                      <td>
                        <strong>{o.orderNumber}</strong>
                        {o.shippingMethod ? <div className="sub">{o.shippingMethod === "EXPRESS" ? "Express" : "Standard"}</div> : null}
                      </td>
                      <td>{d.date}<div className="sub">{d.time}</div></td>
                      <td>{o.customer.name}<div className="sub">{o.customer.city}, {o.customer.state}</div></td>
                      <td className="num">{o.itemCount}</td>
                      <td className="num">{money(o.grandTotal, o.currency)}</td>
                      <td><PaymentPill status={o.paymentStatus} /></td>
                      <td><OrderPill status={o.status} /></td>
                      <td>
                        <FulfilmentPill status={o.fulfilmentStatus} />
                        {t ? <div className="sub">{t.carrier} {t.trackingNumber}</div> : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="tfoot">
          <span>{rows ? rangeText(page, SIZE, rows.length, total, "orders") : ""}</span>
          <Pager page={page} pages={pages} onPage={setPage} />
        </div>
      </div>

      <OrderDrawer
        id={open}
        onClose={() => setOpen(null)}
        onChanged={() => {
          load();
          refreshAdminCounts();
        }}
      />
    </section>
  );
}

type Mode = null | "ship" | "cancel" | "return" | { track: AdminShipment };

const returnable = (o: AdminOrderDetail) => o.items.filter((i) => i.quantity - (i.returnedQuantity ?? 0) > 0);

function OrderDrawer({ id, onClose, onChanged }: { id: string | null; onClose: () => void; onChanged: () => void }) {
  const [o, setO] = useState<AdminOrderDetail | null>(null);
  const [settings, setSettings] = useState<AdminSettings | null>(settingsCache);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<Mode>(null);

  useEffect(() => {
    if (settingsCache) return;
    adminService
      .settings()
      .then((r) => {
        settingsCache = r.data.data;
        setSettings(settingsCache);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setO(null);
    setError(null);
    setMode(null);
    if (!id) return;
    adminService
      .getOrder(id)
      .then((r) => setO(r.data.data))
      .catch((err) => setError(getApiErrorMessage(err, "Couldn't load the order")));
  }, [id]);

  /** Runs an action, then reloads the order so every section reflects it. */
  const act = async (fn: () => Promise<unknown>, done: string, failed: string) => {
    if (!o) return false;
    setBusy(true);
    try {
      await fn();
      const r = await adminService.getOrder(o.id);
      setO(r.data.data);
      setMode(null);
      toast(done);
      onChanged();
      return true;
    } catch (err) {
      toast(getApiErrorMessage(err, failed), true);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const s = o?.status;
  const f = o?.fulfilmentStatus;
  const canPay = s === "PENDING_PAYMENT" && settings?.manualPaymentConfirmation !== false;
  const canPick = (s === "PAID" || s === "CONFIRMED") && (f === "UNFULFILLED" || f === null);
  const canPack = (s === "PAID" || s === "CONFIRMED") && f === "PICKED";
  const canShip = s === "PAID" || s === "CONFIRMED" || s === "SHIPPED";
  const canCancel = s === "PENDING_PAYMENT" || s === "PAID" || s === "CONFIRMED";
  const canReturn = (s === "SHIPPED" || s === "DELIVERED") && !!o && returnable(o).length > 0;
  const manualShipping = settings?.shippingProvider !== "shippo";
  const placed = o ? dateTime(o.createdAt) : null;

  return (
    <Drawer
      open={!!id}
      onClose={onClose}
      title={o ? `Order ${o.orderNumber}` : "Order"}
      sub={
        o ? (
          <span className="badges">
            {placed!.date} <PaymentPill status={o.paymentStatus} /> <OrderPill status={o.status} />
            {o.fulfilmentStatus ? <FulfilmentPill status={o.fulfilmentStatus} /> : null}
          </span>
        ) : null
      }
      foot={
        <>
          {canCancel ? (
            <button className="btn btn-danger" onClick={() => setMode("cancel")} disabled={busy}>Cancel order</button>
          ) : null}
          {canReturn ? (
            <button className="btn btn-secondary" onClick={() => setMode("return")} disabled={busy}>
              <Icon name="undo" />
              Open return
            </button>
          ) : null}
          {canPay ? (
            <button
              className="btn btn-primary"
              disabled={busy}
              onClick={() => act(() => adminService.markPaid(o!.id), `${o!.orderNumber} marked as paid`, "Couldn't mark the order as paid")}
            >
              Mark as paid
            </button>
          ) : null}
          {canPick ? (
            <button
              className="btn btn-primary"
              disabled={busy}
              onClick={() => act(() => adminService.fulfilmentStep(o!.id, "PICKED"), "Marked as picked", "Couldn't update fulfilment")}
            >
              Mark picked
            </button>
          ) : null}
          {canPack ? (
            <button
              className="btn btn-primary"
              disabled={busy}
              onClick={() => act(() => adminService.fulfilmentStep(o!.id, "PACKED"), "Marked as packed", "Couldn't update fulfilment")}
            >
              Mark packed
            </button>
          ) : null}
          {canShip ? (
            <button className={`btn ${canPick || canPack ? "btn-secondary" : "btn-primary"}`} onClick={() => setMode("ship")} disabled={busy}>
              <Icon name="truck" />
              {s === "SHIPPED" ? "Add shipment" : "Ship"}
            </button>
          ) : null}
          {!o || !(canCancel || canReturn || canPay || canPick || canPack || canShip) ? (
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          ) : null}
        </>
      }
    >
      {!o ? (
        error ? <p className="err-text">{error}</p> : <p className="sub">Loading…</p>
      ) : (
        <>
          {mode === "ship" ? (
            <ShipForm
              manual={manualShipping}
              busy={busy}
              onCancel={() => setMode(null)}
              onSubmit={(data) => act(() => adminService.createShipment(o.id, data), `${o.orderNumber} shipped`, "Couldn't create the shipment")}
            />
          ) : null}
          {mode === "cancel" ? (
            <CancelForm
              order={o}
              busy={busy}
              onCancel={() => setMode(null)}
              onSubmit={(reason) => act(() => adminService.cancelOrder(o.id, reason), `${o.orderNumber} cancelled`, "Couldn't cancel the order")}
            />
          ) : null}
          {mode === "return" ? (
            <ReturnForm
              order={o}
              busy={busy}
              onCancel={() => setMode(null)}
              onSubmit={(data) => act(() => adminService.openReturn(o.id, data), "Return opened", "Couldn't open the return")}
            />
          ) : null}

          <div className="d-sec">
            <h3>Items</h3>
            <div className="items">
              {o.items.map((x) => (
                <div className="item" key={x.id ?? x.sku}>
                  <div>
                    <strong>{x.productName}</strong>
                    <span className="sub">
                      <code>{x.sku}</code>
                      {x.taxRate ? ` · tax ${x.taxRate}%${x.taxCode ? ` (${x.taxCode})` : ""}` : ""}
                      {x.returnedQuantity ? ` · ${x.returnedQuantity} returned` : ""}
                    </span>
                  </div>
                  <span style={{ textAlign: "right" }}>
                    {x.quantity} × {money(x.unitPrice, o.currency)}
                    {x.taxAmount ? <div className="sub">+ {money(x.taxAmount, o.currency)} tax</div> : null}
                  </span>
                </div>
              ))}
            </div>
            <dl className="totals">
              <dt>Subtotal</dt><dd>{money(o.subtotal, o.currency)}</dd>
              <dt>Shipping{o.shippingMethod ? ` (${o.shippingMethod === "EXPRESS" ? "Express" : "Standard"})` : ""}</dt>
              <dd>{o.shippingTotal ? money(o.shippingTotal, o.currency) : "Free"}</dd>
              <dt>Tax</dt><dd>{money(o.taxTotal, o.currency)}</dd>
              {o.discountTotal ? (<><dt>Discount</dt><dd>−{money(o.discountTotal, o.currency)}</dd></>) : null}
              <dt className="grand">Total</dt><dd className="grand">{money(o.grandTotal, o.currency)}</dd>
              {o.refundedTotal ? (
                <>
                  <dt className="refund">Refunded</dt><dd className="refund">−{money(o.refundedTotal, o.currency)}</dd>
                  <dt>Net</dt><dd>{money(o.grandTotal - o.refundedTotal, o.currency)}</dd>
                </>
              ) : null}
            </dl>
          </div>

          <div className="d-sec">
            <h3>Payment</h3>
            <dl className="kv">
              <dt>Status</dt><dd><PaymentPill status={o.paymentStatus} /></dd>
              <dt>Reference</dt><dd>{o.paymentReference ? <code>{o.paymentReference}</code> : "—"}</dd>
              <dt>Paid</dt><dd>{whenText(o.paidAt)}</dd>
              {o.cancellationReason ? (<><dt>Cancelled</dt><dd>{o.cancellationReason}{o.cancelledBy ? ` (${o.cancelledBy.toLowerCase()})` : ""}</dd></>) : null}
            </dl>
          </div>

          <div className="d-sec">
            <h3>Shipments ({o.shipments?.length ?? 0})</h3>
            {o.shipments?.length ? (
              <div className="items">
                {o.shipments.map((sh) => (
                  <ShipmentCard
                    key={sh.id}
                    s={sh}
                    canTrack={sh.provider === "manual" && sh.status !== "DELIVERED" && sh.status !== "RETURNED"}
                    tracking={typeof mode === "object" && mode?.track.id === sh.id}
                    busy={busy}
                    onTrack={() => setMode({ track: sh })}
                    onCancel={() => setMode(null)}
                    onSubmit={(data) => act(() => adminService.addTrackingEvent(sh.id, data), "Tracking updated", "Couldn't update tracking")}
                  />
                ))}
              </div>
            ) : (
              <p className="sub">
                {canShip ? "Not shipped yet. Use Ship to create a shipment and tracking number." : "No shipments."}
              </p>
            )}
          </div>

          {o.returns?.length ? (
            <div className="d-sec">
              <h3>Returns ({o.returns.length})</h3>
              <div className="items">
                {o.returns.map((r) => (
                  <div className="item" key={r.id}>
                    <div>
                      <Link className="link" href={`/admin/returns?id=${r.id}`}>{r.rmaNumber}</Link>
                      <span className="sub">
                        {r.items.reduce((n, i) => n + i.quantity, 0)} units · {r.reason}
                        {r.restocked ? " · restocked" : ""}
                      </span>
                    </div>
                    <span style={{ textAlign: "right" }}>
                      <ReturnPill status={r.status} />
                      {r.refundAmount ? <div className="sub">{money(r.refundAmount, o.currency)}</div> : null}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="d-sec">
            <h3>Customer</h3>
            <dl className="kv">
              <dt>Name</dt>
              <dd><Link className="link" href={`/admin/customers?id=${o.customer.id}`}>{o.customer.fullName}</Link></dd>
              <dt>Email</dt><dd>{o.customer.email}</dd>
              {o.customer.phoneNumber ? (<><dt>Phone</dt><dd>{o.customer.phoneNumber}</dd></>) : null}
              <dt>Ship to</dt>
              <dd>
                {o.shippingAddress.recipientName}<br />
                {o.shippingAddress.addressLine1}
                {o.shippingAddress.addressLine2 ? <>, {o.shippingAddress.addressLine2}</> : null}<br />
                {o.shippingAddress.city}, {o.shippingAddress.state} {o.shippingAddress.postalCode}<br />
                {o.shippingAddress.country}
              </dd>
              <dt>Orders</dt><dd>{o.customer.orders} total</dd>
            </dl>
          </div>

          <div className="d-sec">
            <h3>Timeline</h3>
            <div className="timeline">
              {(o.timeline ?? []).map((t, i) => (
                <div className="tl done" key={`${t.at}-${i}`}>
                  <i />
                  <div>
                    <strong>{t.note ?? ORDER_STATUS[t.status]?.[0] ?? t.status}</strong>
                    <span className="sub">
                      {whenText(t.at)} · {t.actor.toLowerCase()}
                      {t.fulfilmentStatus ? ` · ${t.fulfilmentStatus.toLowerCase()}` : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="d-sec">
            <h3>Emails to the customer ({o.notifications?.length ?? 0})</h3>
            {o.notifications?.length ? (
              <div className="items">
                {o.notifications.map((n, i) => (
                  <div className="item" key={`${n.template}-${i}`}>
                    <div>
                      <strong>{n.subject}</strong>
                      <span className="sub">{n.toAddress} · {whenText(n.createdAt)}</span>
                    </div>
                    <span className={`pill ${n.status === "SENT" ? "p-ok" : n.status === "FAILED" ? "p-bad" : "p-grey"}`}>
                      {n.status === "LOGGED" ? "Logged" : n.status.charAt(0) + n.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="sub">None yet.</p>
            )}
          </div>
        </>
      )}
    </Drawer>
  );
}

function ShipmentCard({
  s,
  canTrack,
  tracking,
  busy,
  onTrack,
  onCancel,
  onSubmit,
}: {
  s: AdminShipment;
  canTrack: boolean;
  tracking: boolean;
  busy: boolean;
  onTrack: () => void;
  onCancel: () => void;
  onSubmit: (d: TrackingEventRequest) => Promise<boolean>;
}) {
  return (
    <div className="vcard">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <strong>{s.carrier}{s.service ? ` · ${s.service}` : ""}</strong>
          <span className="sub" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <code>{s.trackingNumber}</code>
            {s.trackingUrl ? (
              <a className="link" href={s.trackingUrl} target="_blank" rel="noreferrer">Track parcel</a>
            ) : null}
            {s.labelUrl ? (
              <a className="link" href={s.labelUrl} target="_blank" rel="noreferrer">Shipping label</a>
            ) : null}
          </span>
          <span className="sub">
            {s.provider === "shippo" ? "Shippo" : "Manual"} · created {whenText(s.createdAt)}
            {s.deliveredAt ? ` · delivered ${whenText(s.deliveredAt)}` : ""}
          </span>
        </div>
        <ShipmentPill status={s.status} />
      </div>
      {s.events?.length ? (
        <ul className="events">
          {s.events.map((e, i) => (
            <li key={`${e.occurredAt}-${i}`}>
              <b>{SHIPMENT_STATUS[e.status]?.[0] ?? e.status}</b>
              {e.location ? ` · ${e.location}` : ""}
              {e.description ? ` · ${e.description}` : ""}
              <span className="sub"> {whenText(e.occurredAt)}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {tracking ? (
        <TrackForm busy={busy} onCancel={onCancel} onSubmit={onSubmit} />
      ) : canTrack ? (
        <div>
          <button className="btn btn-secondary btn-sm" onClick={onTrack} disabled={busy}>Add tracking update</button>
        </div>
      ) : null}
    </div>
  );
}

const TRACK_STATUSES: TrackingEventRequest["status"][] = ["IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "EXCEPTION", "RETURNED"];

function TrackForm({ busy, onCancel, onSubmit }: { busy: boolean; onCancel: () => void; onSubmit: (d: TrackingEventRequest) => Promise<boolean> }) {
  const [status, setStatus] = useState<TrackingEventRequest["status"]>("IN_TRANSIT");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [at, setAt] = useState("");
  return (
    <div className="form actform">
      <div className="row2">
        <div className="fld">
          <label htmlFor="tkStatus">Status</label>
          <select className="sel inp" id="tkStatus" value={status} onChange={(e) => setStatus(e.target.value as TrackingEventRequest["status"])}>
            {TRACK_STATUSES.map((st) => (
              <option key={st} value={st}>{SHIPMENT_STATUS[st][0]}</option>
            ))}
          </select>
        </div>
        <div className="fld">
          <label htmlFor="tkAt">When (optional)</label>
          <input className="inp" id="tkAt" type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} />
        </div>
      </div>
      <div className="row2">
        <div className="fld">
          <label htmlFor="tkLoc">Location</label>
          <input className="inp" id="tkLoc" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={200} />
        </div>
        <div className="fld">
          <label htmlFor="tkDesc">Note</label>
          <input className="inp" id="tkDesc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
        </div>
      </div>
      {status === "DELIVERED" ? <p className="sub">Marking delivered moves the order to Delivered and emails the customer.</p> : null}
      <div className="actrow">
        <button className="btn btn-secondary btn-sm" onClick={onCancel} disabled={busy}>Cancel</button>
        <button
          className="btn btn-primary btn-sm"
          disabled={busy}
          onClick={() =>
            onSubmit({
              status,
              location: location.trim() || undefined,
              description: description.trim() || undefined,
              occurredAt: at ? new Date(at).toISOString() : undefined,
            })
          }
        >
          {busy ? "Saving…" : "Save update"}
        </button>
      </div>
    </div>
  );
}

function ShipForm({
  manual,
  busy,
  onCancel,
  onSubmit,
}: {
  manual: boolean;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (d: { carrier?: string; trackingNumber?: string; trackingUrl?: string; service?: string }) => Promise<boolean>;
}) {
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");
  const [url, setUrl] = useState("");
  const [service, setService] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const submit = () => {
    if (manual && (!carrier.trim() || !tracking.trim())) return setErr("Carrier and tracking number are required.");
    setErr(null);
    onSubmit(
      manual
        ? { carrier: carrier.trim(), trackingNumber: tracking.trim(), trackingUrl: url.trim() || undefined, service: service.trim() || undefined }
        : { service: service.trim() || undefined }
    );
  };

  return (
    <div className="d-sec actbox">
      <h3>Ship order</h3>
      <div className="form">
        {manual ? (
          <>
            <div className="row2">
              <div className="fld">
                <label htmlFor="shCarrier">Carrier</label>
                <input className={`inp ${err && !carrier.trim() ? "bad" : ""}`} id="shCarrier" value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="UPS, USPS, FedEx…" />
              </div>
              <div className="fld">
                <label htmlFor="shTrack">Tracking number</label>
                <input className={`inp ${err && !tracking.trim() ? "bad" : ""}`} id="shTrack" value={tracking} onChange={(e) => setTracking(e.target.value)} />
              </div>
            </div>
            <div className="row2">
              <div className="fld">
                <label htmlFor="shService">Service (optional)</label>
                <input className="inp" id="shService" value={service} onChange={(e) => setService(e.target.value)} placeholder="Ground" />
              </div>
              <div className="fld">
                <label htmlFor="shUrl">Tracking link (optional)</label>
                <input className="inp" id="shUrl" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Built for known carriers" />
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="sub">Shippo buys the label and assigns the tracking number. The cheapest rate is used unless you name a service level.</p>
            <div className="fld">
              <label htmlFor="shService">Service level token (optional)</label>
              <input className="inp" id="shService" value={service} onChange={(e) => setService(e.target.value)} placeholder="usps_priority" />
            </div>
          </>
        )}
        {err ? <p className="err-text">{err}</p> : null}
        <div className="actrow">
          <button className="btn btn-secondary btn-sm" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={submit} disabled={busy}>
            <Icon name="truck" />
            {busy ? "Shipping…" : "Create shipment"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CancelForm({
  order,
  busy,
  onCancel,
  onSubmit,
}: {
  order: AdminOrderDetail;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (reason?: string) => Promise<boolean>;
}) {
  const [reason, setReason] = useState("");
  const paid = order.status !== "PENDING_PAYMENT";
  return (
    <div className="d-sec actbox bad">
      <h3>Cancel order</h3>
      <div className="form">
        <p>
          {paid
            ? `The payment of ${money(order.grandTotal - (order.refundedTotal ?? 0), order.currency)} is refunded in full and stock is restored.`
            : "No payment was taken. The order is closed and nothing is deducted."}
        </p>
        <div className="fld">
          <label htmlFor="cxReason">Reason (shown on the timeline)</label>
          <input className="inp" id="cxReason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
        </div>
        <div className="actrow">
          <button className="btn btn-secondary btn-sm" onClick={onCancel} disabled={busy}>Keep order</button>
          <button
            className="btn btn-danger btn-sm"
            disabled={busy}
            onClick={() => {
              if (window.confirm(`Cancel ${order.orderNumber}${paid ? " and refund the customer" : ""}?`)) onSubmit(reason.trim() || undefined);
            }}
          >
            {busy ? "Cancelling…" : paid ? "Cancel and refund" : "Cancel order"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReturnForm({
  order,
  busy,
  onCancel,
  onSubmit,
}: {
  order: AdminOrderDetail;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (d: { items: { orderItemId: string; quantity: number }[]; reason: string }) => Promise<boolean>;
}) {
  const lines = returnable(order);
  const [qty, setQty] = useState<Record<string, string>>({});
  const [reason, setReason] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const submit = () => {
    const items = lines
      .map((l) => ({ orderItemId: l.id, quantity: parseInt(qty[l.id] ?? "0", 10) || 0 }))
      .filter((i) => i.quantity > 0);
    if (!items.length) return setErr("Choose at least one unit to return.");
    const over = lines.find((l) => (parseInt(qty[l.id] ?? "0", 10) || 0) > l.quantity - (l.returnedQuantity ?? 0));
    if (over) return setErr(`${over.sku}: only ${over.quantity - (over.returnedQuantity ?? 0)} can be returned.`);
    if (!reason.trim()) return setErr("A reason is required.");
    setErr(null);
    onSubmit({ items, reason: reason.trim() });
  };

  return (
    <div className="d-sec actbox">
      <h3>Open a return</h3>
      <div className="form">
        <div className="items">
          {lines.map((l) => {
            const max = l.quantity - (l.returnedQuantity ?? 0);
            return (
              <div className="item" key={l.id}>
                <div>
                  <strong>{l.productName}</strong>
                  <span className="sub"><code>{l.sku}</code> · {max} of {l.quantity} returnable</span>
                </div>
                <input
                  className="inp qty"
                  aria-label={`Units of ${l.sku} to return`}
                  inputMode="numeric"
                  placeholder="0"
                  value={qty[l.id] ?? ""}
                  onChange={(e) => setQty((q) => ({ ...q, [l.id]: e.target.value.replace(/[^\d]/g, "") }))}
                />
              </div>
            );
          })}
        </div>
        <div className="fld">
          <label htmlFor="rtReason">Reason</label>
          <input className="inp" id="rtReason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} placeholder="Wrong size, damaged…" />
        </div>
        <p className="sub">Returns opened by staff start as Approved. Receive and refund them on the Returns page.</p>
        {err ? <p className="err-text">{err}</p> : null}
        <div className="actrow">
          <button className="btn btn-secondary btn-sm" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={submit} disabled={busy}>{busy ? "Opening…" : "Open return"}</button>
        </div>
      </div>
    </div>
  );
}
