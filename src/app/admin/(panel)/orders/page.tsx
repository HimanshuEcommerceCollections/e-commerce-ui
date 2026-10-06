"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import adminService from "@/services/admin/admin.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type {
  AdminOrderDetail,
  AdminOrderListParams,
  AdminOrderRow,
  AdminSettings,
  AdminShipment,
  OrderStats,
  OrderStatusValue,
  ReturnStatus,
  TrackingEventRequest,
} from "@/types/api/admin.types";
import { refreshAdminCounts } from "@/components/admin/refresh";
import { fileNameFrom, saveFile } from "@/components/admin/files";
import { OrderReturnRow, RETURN_FILTERS, ReturnsList } from "@/components/admin/Returns";
import {
  Drawer,
  FulfilmentPill,
  Icon,
  ORDER_STATUS,
  OrderPill,
  Pager,
  PaymentPill,
  SHIPMENT_STATUS,
  ShipmentPill,
  dateTime,
  money,
  rangeText,
  toast,
  useDebounced,
  usePageTitle,
  whenText,
} from "@/components/admin/ui";

type Status = OrderStatusValue;
const SIZE = 20;

/** The design's tabs: fulfilment stages, then Returns and Cancelled (FR-AD-02, FR-AD-07). */
type TabKey = "ALL" | "UNFULFILLED" | "PICKED" | "PACKED" | "SHIPPED" | "DELIVERED" | "RETURNS" | "CANCELLED";
const TABS: Array<{ key: TabKey; label: string; filter: Pick<AdminOrderListParams, "status" | "fulfilmentStatus"> }> = [
  { key: "ALL", label: "All", filter: {} },
  { key: "UNFULFILLED", label: "Unfulfilled", filter: { fulfilmentStatus: "UNFULFILLED" } },
  { key: "PICKED", label: "Picked", filter: { fulfilmentStatus: "PICKED" } },
  { key: "PACKED", label: "Packed", filter: { fulfilmentStatus: "PACKED" } },
  { key: "SHIPPED", label: "Shipped", filter: { status: "SHIPPED" } },
  { key: "DELIVERED", label: "Delivered", filter: { status: "DELIVERED" } },
  { key: "RETURNS", label: "Returns", filter: {} },
  { key: "CANCELLED", label: "Cancelled", filter: { status: "CANCELLED" } },
];
/** Every order state, for the status filter on the All tab. */
const STATUS_FILTER: Array<[Status, string]> = [
  ["PENDING_PAYMENT", "Pending payment"],
  ["PAID", "Paid"],
  ["CONFIRMED", "Confirmed"],
  ["SHIPPED", "Shipped"],
  ["DELIVERED", "Delivered"],
  ["CANCELLED", "Cancelled"],
  ["PAYMENT_FAILED", "Payment failed"],
  ["REFUNDED", "Refunded"],
];
/** States outside the warehouse flow: the Fulfilment column shows the order state instead. */
const CLOSED_OR_UNPAID = new Set<string>(["PENDING_PAYMENT", "CANCELLED", "PAYMENT_FAILED", "REFUNDED"]);

/** Read once per visit: the shipping provider decides the Ship form (FR-IN-03). */
let settingsCache: AdminSettings | null = null;

export default function AdminOrdersPage() {
  usePageTitle("Orders");
  return (
    <Suspense fallback={null}>
      <Orders />
    </Suspense>
  );
}

function Orders() {
  const params = useSearchParams();
  const router = useRouter();
  const [tab, setTabState] = useState<TabKey>(params.get("tab") === "returns" ? "RETURNS" : "ALL");
  const [status, setStatus] = useState<Status | "">("");
  const [returnStatus, setReturnStatus] = useState<ReturnStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<AdminOrderRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const returnId = params.get("return");

  // Deep links: ?id=… (from Customers or a return), ?tab=returns&return=…
  useEffect(() => {
    const id = params.get("id");
    if (id) setOpen(id);
    if (params.get("tab") === "returns") setTabState("RETURNS");
  }, [params]);

  const setTab = (t: TabKey) => {
    setTabState(t);
    if (t !== "ALL") setStatus("");
    // Only the Returns tab goes in the URL, so it can be linked to.
    if ((t === "RETURNS") !== (params.get("tab") === "returns") || params.get("return")) {
      router.replace(t === "RETURNS" ? "/admin/orders?tab=returns" : "/admin/orders", { scroll: false });
    }
  };

  const filter = useCallback((): Omit<AdminOrderListParams, "page" | "size"> => {
    const t = TABS.find((x) => x.key === tab)!;
    return { search: q || undefined, ...t.filter, ...(status ? { status } : {}) };
  }, [q, tab, status]);

  const loadStats = useCallback(async () => {
    try {
      setStats((await adminService.orderStats()).data.data);
    } catch {
      // The table reports errors.
    }
  }, []);

  const load = useCallback(async () => {
    if (tab === "RETURNS") return;
    setError(null);
    try {
      const list = await adminService.listOrders({ ...filter(), page, size: SIZE });
      const data = list.data.data!;
      setRows(data.content);
      setTotal(data.totalElements);
      setPages(data.totalPages);
    } catch (err) {
      setRows([]);
      setError(getApiErrorMessage(err, "Couldn't load orders"));
    }
  }, [filter, page, tab]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    loadStats();
  }, [loadStats]);
  useEffect(() => setPage(0), [q, tab, status]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await adminService.exportOrders(filter());
      saveFile(fileNameFrom(res.headers["content-disposition"] as string | undefined, "orders.csv"), res.data);
    } catch (err) {
      toast(getApiErrorMessage(err, "Couldn't export orders"), true);
    } finally {
      setExporting(false);
    }
  };

  const by = stats?.byStatus ?? {};
  const af = stats?.awaitingFulfilment ?? {};
  const rs = stats?.returnsByStatus ?? {};
  const openReturns = (rs.REQUESTED ?? 0) + (rs.APPROVED ?? 0) + (rs.RECEIVED ?? 0);
  const count = (k: TabKey): number | null => {
    if (!stats) return null;
    if (k === "ALL") return stats.total;
    if (k === "UNFULFILLED" || k === "PICKED" || k === "PACKED") return af[k] ?? 0;
    if (k === "RETURNS") return openReturns;
    return by[k] ?? 0;
  };

  return (
    <section aria-labelledby="h-orders">
      <div className="page-head">
        <div>
          <h1 id="h-orders">Orders</h1>
          <p>Update fulfilment, add tracking and process returns.</p>
        </div>
        <div className="actions">
          <button className="btn btn-secondary" onClick={exportCsv} disabled={exporting || tab === "RETURNS"}>
            <Icon name="download" />
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        </div>
      </div>

      <div className="stats">
        {(
          [
            ["To fulfil", af.UNFULFILLED ?? 0, "var(--warn)", "UNFULFILLED"],
            ["Picked & packed", (af.PICKED ?? 0) + (af.PACKED ?? 0), "var(--info)", "PACKED"],
            ["Shipped", by.SHIPPED ?? 0, "var(--info)", "SHIPPED"],
            ["Open returns", openReturns, "var(--bad)", "RETURNS"],
          ] as const
        ).map(([label, n, color, key]) => (
          <button className="stat" key={label} aria-pressed={tab === key} onClick={() => setTab(tab === key ? "ALL" : key)}>
            <span><i style={{ background: color }} />{label}</span>
            <b>{stats ? n : "…"}</b>
          </button>
        ))}
      </div>

      <div className="panel">
        <div className="tabs" role="tablist" aria-label="Order views">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}>
              {t.label}
              <span className="c">{count(t.key) ?? "…"}</span>
            </button>
          ))}
        </div>
        {tab === "RETURNS" ? (
          <>
            <div className="toolbar">
              <select
                className="sel"
                aria-label="Return status"
                value={returnStatus}
                onChange={(e) => setReturnStatus(e.target.value as ReturnStatus | "ALL")}
              >
                {RETURN_FILTERS.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                    {f.key !== "ALL" && stats ? ` (${rs[f.key] ?? 0})` : ""}
                  </option>
                ))}
              </select>
              <span className="sub">Approve, receive and refund returns. Refunds go back through the payment gateway.</span>
            </div>
            <ReturnsList key={returnId ?? "list"} status={returnStatus} initialOpen={returnId} />
          </>
        ) : (
          <>
            <div className="toolbar">
              <label className="search">
                <Icon name="search" />
                <span className="sr-only">Search orders</span>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by order number or customer" />
              </label>
              <select
                className="sel"
                aria-label="Order status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as Status | "");
                  setTabState("ALL");
                }}
              >
                <option value="">Any status</option>
                {STATUS_FILTER.map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                    {stats ? ` (${by[k] ?? 0})` : ""}
                  </option>
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
                    <th>Fulfilment</th>
                  </tr>
                </thead>
                <tbody>
                  {rows === null ? (
                    <tr className="loading-row"><td colSpan={7}>Loading orders…</td></tr>
                  ) : error ? (
                    <tr className="empty-row"><td colSpan={7}><span className="err-text">{error}</span></td></tr>
                  ) : rows.length === 0 ? (
                    <tr className="empty-row"><td colSpan={7}>{q ? "No orders match. Try a different search." : "No orders here."}</td></tr>
                  ) : (
                    rows.map((o) => {
                      const d = dateTime(o.createdAt);
                      const t = o.tracking?.[0];
                      const place = [o.customer.city, o.customer.state].filter(Boolean).join(", ");
                      return (
                        <tr
                          key={o.id}
                          className="click"
                          tabIndex={0}
                          onClick={() => setOpen(o.id)}
                          onKeyDown={(e) => e.key === "Enter" && setOpen(o.id)}
                        >
                          <td><strong>{o.orderNumber}</strong></td>
                          <td>{d.date}<div className="sub">{d.time}</div></td>
                          <td>{o.customer.name}{place ? <div className="sub">{place}</div> : null}</td>
                          <td className="num">{o.itemCount}</td>
                          <td className="num">{money(o.grandTotal, o.currency)}</td>
                          <td><PaymentPill status={o.paymentStatus} /></td>
                          <td>
                            <div>
                              {CLOSED_OR_UNPAID.has(o.status) || !o.fulfilmentStatus ? (
                                <OrderPill status={o.status} />
                              ) : (
                                <FulfilmentPill status={o.fulfilmentStatus} />
                              )}
                              {t ? <div className="sub">{t.carrier} {t.trackingNumber}</div> : null}
                            </div>
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
          </>
        )}
      </div>

      <OrderDrawer
        id={open}
        onClose={() => {
          setOpen(null);
          if (params.get("id")) router.replace(tab === "RETURNS" ? "/admin/orders?tab=returns" : "/admin/orders", { scroll: false });
        }}
        onChanged={() => {
          load();
          loadStats();
          refreshAdminCounts();
        }}
      />
    </section>
  );
}


type Mode = null | "ship" | "cancel" | "return" | { track: AdminShipment };

const FULFILMENT_LABEL: Record<string, string> = {
  UNFULFILLED: "Awaiting fulfilment",
  PICKED: "Picked",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
};
/** Entries that only move fulfilment have no order status. */
const timelineLabel = (status: string, fulfilment: string | null) =>
  status ? ORDER_STATUS[status]?.[0] ?? status : FULFILMENT_LABEL[fulfilment ?? ""] ?? "Updated";

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

  /** After a return action: the order's totals, status and stock-related lines change too. */
  const reload = () => {
    if (!o) return;
    adminService
      .getOrder(o.id)
      .then((r) => setO(r.data.data))
      .catch(() => {});
    onChanged();
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
            {o.fulfilmentStatus && o.fulfilmentStatus !== o.status ? <FulfilmentPill status={o.fulfilmentStatus} /> : null}
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
                  <OrderReturnRow key={`${r.id}-${r.status}`} r={r} currency={o.currency} onChanged={reload} />
                ))}
              </div>
            </div>
          ) : null}

          <div className="d-sec">
            <h3>Customer</h3>
            <dl className="kv">
              <dt>Name</dt>
              <dd>
                {o.customer.id ? (
                  <Link className="link" href={`/admin/customers?id=${o.customer.id}`}>{o.customer.fullName}</Link>
                ) : (
                  o.customer.fullName
                )}
                {o.customer.guest ? <span className="pill p-grey" style={{ marginLeft: 6 }}>Guest</span> : null}
              </dd>
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
              <dt>Orders</dt><dd>{o.customer.orders} total{o.customer.guest ? " with this email" : ""}</dd>
            </dl>
          </div>

          <div className="d-sec">
            <h3>Timeline</h3>
            <div className="timeline">
              {(o.timeline ?? []).map((t, i) => (
                <div className="tl done" key={`${t.at}-${i}`}>
                  <i />
                  <div>
                    <strong>{t.note ?? timelineLabel(t.status, t.fulfilmentStatus)}</strong>
                    <span className="sub">
                      {whenText(t.at)} · {t.actor.toLowerCase()}
                      {t.fulfilmentStatus && t.note ? ` · ${t.fulfilmentStatus.toLowerCase()}` : ""}
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
          <span className="sub" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", margin: "2px 0" }}>
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
        <p className="sub">The return opens as Requested. Approve, receive and refund it below, under Returns.</p>
        {err ? <p className="err-text">{err}</p> : null}
        <div className="actrow">
          <button className="btn btn-secondary btn-sm" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={submit} disabled={busy}>{busy ? "Opening…" : "Open return"}</button>
        </div>
      </div>
    </div>
  );
}
