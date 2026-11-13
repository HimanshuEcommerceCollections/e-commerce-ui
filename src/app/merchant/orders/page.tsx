"use client";
import { useState } from "react";
import { Ico, LoadError, Loading, Pill, Thumb, fmtDate, money, useLoad } from "@/components/seller/ui";
import { useTitle } from "@/components/seller/useSellerSession";
import sellerService from "@/services/seller/seller.service";
import type { SellerOrder, SellerOrderFilter } from "@/types/api/seller.types";

const TABS: [SellerOrderFilter | "", string][] = [
  ["", "All"],
  ["TO_SHIP", "To ship"],
  ["SHIPPED", "Shipped"],
  ["DELIVERED", "Delivered"],
  ["CANCELLED", "Cancelled or refunded"],
];
const SIZE = 20;

function OrderStatus({ o }: { o: SellerOrder }) {
  switch (o.status) {
    case "PAID":
    case "CONFIRMED":
      return <Pill tone="warn">To ship{o.fulfilmentStatus && o.fulfilmentStatus !== "UNFULFILLED" ? ` · ${o.fulfilmentStatus.toLowerCase()}` : ""}</Pill>;
    case "SHIPPED":
      return <Pill tone="info">Shipped{o.shippedAt ? ` ${fmtDate(o.shippedAt)}` : ""}</Pill>;
    case "DELIVERED":
      return <Pill tone="ok">Delivered{o.deliveredAt ? ` ${fmtDate(o.deliveredAt)}` : ""}</Pill>;
    case "CANCELLED":
      return <Pill tone="off">Cancelled</Pill>;
    case "REFUNDED":
      return <Pill tone="off">Refunded</Pill>;
    default:
      return <Pill tone="off">{o.status}</Pill>;
  }
}

const monthLabel = (period: string) => {
  const [y, m] = period.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
};

export default function SellerOrdersPage() {
  useTitle("Orders and earnings");
  const [status, setStatus] = useState<SellerOrderFilter | "">("");
  const [page, setPage] = useState(0);
  const [months, setMonths] = useState(6);
  const orders = useLoad(() => sellerService.orders({ page, size: SIZE, status: status || undefined }), [status, page]);
  const earnings = useLoad(() => sellerService.earnings(months), [months]);
  const e = earnings.data;

  return (
    <>
      <div className="sp-ph">
        <div>
          <h1>Orders and earnings</h1>
          <p>Paid orders that include your products, and what they add up to. We pack, ship and handle customers; you see your lines only.</p>
        </div>
      </div>

      <section className="sp-card" aria-labelledby="erH" style={{ marginBottom: 16 }}>
        <div className="sp-ch">
          <h2 id="erH">Earnings by month</h2>
          <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <Pill tone="off">Payout schedule coming soon</Pill>
            <label className="sp-sr" htmlFor="sp-months">
              Period
            </label>
            <select id="sp-months" className="sp-inp sp-sm-inp" value={months} onChange={(ev) => setMonths(Number(ev.target.value))}>
              <option value={3}>Last 3 months</option>
              <option value={6}>Last 6 months</option>
              <option value={12}>Last 12 months</option>
            </select>
          </span>
        </div>
        <p className="sp-cd">
          Gross sales are your lines in orders paid that month; refunds are money returned to customers that month. Payout dates, fees
          and statements will show here once payouts are set up.
        </p>
        {earnings.error ? (
          <LoadError error={earnings.error} onRetry={earnings.reload} what="your earnings" />
        ) : !e ? (
          <Loading />
        ) : (
          <>
            <div className="sp-earn">
              <div>
                <span>Gross sales</span>
                <b>{money(e.totals.gross)}</b>
              </div>
              <div>
                <span>Refunds</span>
                <b>{money(e.totals.refunds)}</b>
              </div>
              <div>
                <span>Net</span>
                <b>{money(e.totals.net)}</b>
              </div>
            </div>
            <div className="sp-tw sp-panel" style={{ marginTop: 14 }}>
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Orders</th>
                    <th>Units</th>
                    <th>Gross</th>
                    <th>Refunds</th>
                    <th>Net</th>
                  </tr>
                </thead>
                <tbody>
                  {e.periods.map((p) => (
                    <tr key={p.period}>
                      <td>{monthLabel(p.period)}</td>
                      <td className="sp-num">{p.orders}</td>
                      <td className="sp-num">{p.units}</td>
                      <td className="sp-num">{money(p.gross)}</td>
                      <td className="sp-num">{p.refunds ? `−${money(p.refunds)}` : money(0)}</td>
                      <td className="sp-num">
                        <b>{money(p.net)}</b>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="sp-help" style={{ marginTop: 8 }}>
              Amounts in {e.currency}, before tax and shipping. Months are calendar months (UTC).
            </p>
          </>
        )}
      </section>

      <div className="sp-panel">
        <div className="sp-ptools">
          <div className="sp-tabs" role="tablist" aria-label="Filter orders">
            {TABS.map(([k, label]) => (
              <button
                key={k || "all"}
                type="button"
                role="tab"
                aria-selected={status === k}
                onClick={() => {
                  setStatus(k);
                  setPage(0);
                }}
              >
                {label}
                {k === "TO_SHIP" && e?.openOrders ? <span className="sp-n">{e.openOrders}</span> : null}
              </button>
            ))}
          </div>
        </div>
        {orders.error ? (
          <div style={{ padding: 16 }}>
            <LoadError error={orders.error} onRetry={orders.reload} what="your orders" />
          </div>
        ) : orders.loading && !orders.data ? (
          <Loading />
        ) : (
          <div className="sp-tw">
            <table className="sp-resp">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Your items</th>
                  <th>Ships to</th>
                  <th>Status</th>
                  <th>Your total</th>
                </tr>
              </thead>
              <tbody>
                {orders.data?.content.length ? (
                  orders.data.content.map((o) => (
                    <tr key={o.orderNumber}>
                      <td>
                        <b className="sp-mono">{o.orderNumber}</b>
                        <small className="sp-muted" style={{ display: "block" }}>
                          Paid {fmtDate(o.paidAt)}
                        </small>
                      </td>
                      <td className="sp-c-wide">
                        <ul style={{ listStyle: "none", display: "grid", gap: 6 }}>
                          {o.items.map((i) => (
                            <li key={i.sku} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                              <Thumb src={i.imageUrl} size={36} />
                              <span style={{ minWidth: 0 }}>
                                <b style={{ fontSize: 13 }}>
                                  {i.quantity} × {i.productName}
                                </b>
                                <small className="sp-muted" style={{ display: "block", fontSize: 12 }}>
                                  <span className="sp-mono">{i.sku}</span> · {money(i.unitPrice)} each
                                  {i.returnedQuantity ? ` · ${i.returnedQuantity} returned` : ""}
                                </small>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td>{o.shipTo}</td>
                      <td>
                        <OrderStatus o={o} />
                      </td>
                      <td className="sp-num">
                        <b>{money(o.subtotal)}</b>
                        {o.refunded ? (
                          <small className="sp-zero-t">−{money(o.refunded)} refunded</small>
                        ) : null}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>
                      <div className="sp-empty">
                        <Ico name="cart" />
                        <p>{status ? "No orders here." : "No orders yet. When shoppers buy your products, they show up here."}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {orders.data && orders.data.totalPages > 1 ? (
          <div className="sp-pager">
            <span>
              Page {orders.data.number + 1} of {orders.data.totalPages} · {orders.data.totalElements} orders
            </span>
            <span style={{ display: "flex", gap: 6 }}>
              <button type="button" className="sp-btn sp-btn-sec sp-btn-sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              <button
                type="button"
                className="sp-btn sp-btn-sec sp-btn-sm"
                disabled={page + 1 >= orders.data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </span>
          </div>
        ) : null}
      </div>
    </>
  );
}
