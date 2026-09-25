"use client";
import { useCallback, useEffect, useState } from "react";
import adminService from "@/services/admin/admin.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type { AdminOrderDetail, AdminOrderRow, OrderStats, OrderStatusValue } from "@/types/api/admin.types";
import { refreshAdminCounts } from "@/components/admin/refresh";
import {
  Drawer,
  Icon,
  OrderPill,
  Pager,
  PaymentPill,
  dateTime,
  money,
  rangeText,
  toast,
  useDebounced,
} from "@/components/admin/ui";

type Status = OrderStatusValue;
const SIZE = 20;
const TABS: Array<{ key: Status | "ALL"; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "PAID", label: "To fulfil" },
  { key: "PENDING_PAYMENT", label: "Pending payment" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "CANCELLED", label: "Cancelled" },
  { key: "PAYMENT_FAILED", label: "Failed" },
  { key: "REFUNDED", label: "Refunded" },
];

export default function AdminOrdersPage() {
  const [tab, setTab] = useState<Status | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<AdminOrderRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [list, s] = await Promise.all([
        adminService.listOrders({ search: q || undefined, status: tab === "ALL" ? undefined : tab, page, size: SIZE }),
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
  }, [q, tab, page]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => setPage(0), [q, tab]);

  const count = (s: Status | "ALL") => (stats ? (s === "ALL" ? stats.total : stats.byStatus[s] ?? 0) : null);
  const by = stats?.byStatus ?? {};

  return (
    <section aria-labelledby="h-orders">
      <div className="page-head">
        <div>
          <h1 id="h-orders">Orders</h1>
          <p>Every order, with payment status and customer details.</p>
        </div>
      </div>

      <div className="stats">
        {(
          [
            ["To fulfil", (by.PAID ?? 0) + (by.CONFIRMED ?? 0), "var(--warn)"],
            ["Pending payment", by.PENDING_PAYMENT ?? 0, "var(--info)"],
            ["Shipped", by.SHIPPED ?? 0, "var(--info)"],
            ["Cancelled or refunded", (by.CANCELLED ?? 0) + (by.REFUNDED ?? 0), "var(--bad)"],
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
              </tr>
            </thead>
            <tbody>
              {rows === null ? (
                <tr className="loading-row"><td colSpan={7}>Loading orders…</td></tr>
              ) : error ? (
                <tr className="empty-row"><td colSpan={7}><span className="err-text">{error}</span></td></tr>
              ) : rows.length === 0 ? (
                <tr className="empty-row"><td colSpan={7}>No orders here.</td></tr>
              ) : (
                rows.map((o) => {
                  const d = dateTime(o.createdAt);
                  return (
                    <tr key={o.id} className="click" onClick={() => setOpen(o.id)}>
                      <td><strong>{o.orderNumber}</strong></td>
                      <td>{d.date}<div className="sub">{d.time}</div></td>
                      <td>{o.customer.name}<div className="sub">{o.customer.city}, {o.customer.state}</div></td>
                      <td className="num">{o.itemCount}</td>
                      <td className="num">{money(o.grandTotal, o.currency)}</td>
                      <td><PaymentPill status={o.paymentStatus} /></td>
                      <td><OrderPill status={o.status} /></td>
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

const FLOW: Status[] = ["PENDING_PAYMENT", "PAID", "SHIPPED", "DELIVERED"];

function OrderDrawer({ id, onClose, onChanged }: { id: string | null; onClose: () => void; onChanged: () => void }) {
  const [o, setO] = useState<AdminOrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setO(null);
    setError(null);
    if (!id) return;
    adminService
      .getOrder(id)
      .then((r) => setO(r.data.data))
      .catch((err) => setError(getApiErrorMessage(err, "Couldn't load the order")));
  }, [id]);

  const markPaid = async () => {
    if (!o) return;
    setBusy(true);
    try {
      await adminService.markPaid(o.id);
      const r = await adminService.getOrder(o.id);
      setO(r.data.data);
      toast(`${o.orderNumber} marked as paid`);
      onChanged();
    } catch (err) {
      toast(getApiErrorMessage(err, "Couldn't mark the order as paid"), true);
    } finally {
      setBusy(false);
    }
  };

  const placed = o ? dateTime(o.createdAt) : null;
  const step = o ? FLOW.indexOf(o.status as Status) : -1;
  const closed = o ? ["CANCELLED", "PAYMENT_FAILED", "REFUNDED"].includes(o.status) : false;
  const timeline: Array<[string, string, boolean]> = o
    ? closed
      ? [
          ["Order placed", `${placed!.date}, ${placed!.time}`, true],
          [
            o.status === "PAYMENT_FAILED" ? "Payment failed" : o.status === "REFUNDED" ? "Refunded" : "Cancelled",
            o.status === "PAYMENT_FAILED"
              ? "No order confirmed, stock not deducted"
              : `Stock restored to inventory${o.cancellationReason ? ` · ${o.cancellationReason}` : ""}`,
            true,
          ],
        ]
      : [
          ["Order placed", `${placed!.date}, ${placed!.time}`, true],
          ["Payment captured", step >= 1 ? "Stock deducted from inventory" : "Waiting for payment", step >= 1],
          ["Shipped", "", step >= 2],
          ["Delivered", "", step >= 3],
        ]
    : [];

  return (
    <Drawer
      open={!!id}
      onClose={onClose}
      title={o ? `Order ${o.orderNumber}` : "Order"}
      sub={o ? <>{placed!.date} · <PaymentPill status={o.paymentStatus} /> <OrderPill status={o.status} /></> : null}
      foot={
        <>
          {o?.status === "PENDING_PAYMENT" ? (
            <button className="btn btn-primary" onClick={markPaid} disabled={busy}>
              {busy ? "Saving…" : "Mark as paid"}
            </button>
          ) : null}
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </>
      }
    >
      {!o ? (
        error ? <p className="err-text">{error}</p> : <p className="sub">Loading…</p>
      ) : (
        <>
          <div className="d-sec">
            <h3>Items</h3>
            <div className="items">
              {o.items.map((x) => (
                <div className="item" key={x.sku}>
                  <div>
                    <strong>{x.productName}</strong>
                    <span className="sub"><code>{x.sku}</code></span>
                  </div>
                  <span>{x.quantity} × {money(x.unitPrice, o.currency)}</span>
                </div>
              ))}
            </div>
            <dl className="totals">
              <dt>Subtotal</dt><dd>{money(o.subtotal, o.currency)}</dd>
              <dt>Shipping</dt><dd>{o.shippingTotal ? money(o.shippingTotal, o.currency) : "Free"}</dd>
              <dt>Tax</dt><dd>{money(o.taxTotal, o.currency)}</dd>
              {o.discountTotal ? (<><dt>Discount</dt><dd>−{money(o.discountTotal, o.currency)}</dd></>) : null}
              <dt className="grand">Total</dt><dd className="grand">{money(o.grandTotal, o.currency)}</dd>
            </dl>
          </div>

          <div className="d-sec">
            <h3>Customer</h3>
            <dl className="kv">
              <dt>Name</dt><dd>{o.customer.fullName}</dd>
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
              {timeline.map(([t, s, done]) => (
                <div className={`tl ${done ? "done" : ""}`} key={t}>
                  <i />
                  <div>
                    <strong>{t}</strong>
                    {s ? <span className="sub">{s}</span> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="note">
            <Icon name="info" />
            <span>
              Shipping, tracking numbers and returns arrive with the shipping integration (FR-IN-03, FR-AD-07).
            </span>
          </div>
        </>
      )}
    </Drawer>
  );
}
