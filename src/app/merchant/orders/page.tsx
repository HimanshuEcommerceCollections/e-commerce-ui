"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { OrderStatePill, OrdersTabs, ShipDialog, dateOf, dueClass, saveBlob, shipDue, ticketHref, usd } from "@/components/seller/orders";
import { Ico, LoadError, Loading, Thumb, errorText, rel, useLoad } from "@/components/seller/ui";
import { useTitle } from "@/components/seller/useSellerSession";
import sellerService from "@/services/seller/seller.service";
import type { SellerOrderRow, SellerOrderTab } from "@/types/api/seller.types";

const SIZE = 25;
const TABS: [SellerOrderTab, string][] = [
  ["new", "To ship"],
  ["shipped", "Shipped"],
  ["delivered", "Delivered"],
  ["return", "Returns"],
  ["cancelled", "Cancelled"],
  ["all", "All"],
];

/** What the status column says beyond the pill. */
function detailOf(o: SellerOrderRow) {
  switch (o.state) {
    case "new": {
      const [level, text] = shipDue(o);
      return <span className={dueClass(level)}>{text}</span>;
    }
    case "shipped":
      return `${o.carrier ?? "Shipped"}${o.shippedAt ? ` · shipped ${rel(o.shippedAt)}` : ""}`;
    case "delivered":
      return `Delivered ${o.deliveredAt ? dateOf(o.deliveredAt) : ""}${o.payout.status === "PAID" ? " · paid" : ""}`;
    case "return":
      return o.returnReason ?? "Return requested";
    case "returned":
      return "Return approved · refunded";
    default:
      return o.cancellationReason ?? "Cancelled";
  }
}

function ItemsCell({ o }: { o: SellerOrderRow }) {
  const first = o.items[0];
  const more = o.items.length - 1;
  return (
    <span className="sp-oitems">
      <Thumb src={first?.imageUrl ?? null} size={40} />
      <span style={{ minWidth: 0 }}>
        <b>{first?.productName ?? "Item"}</b>
        <span className="sp-osub">
          Qty {first?.quantity ?? 0}
          {more ? ` · +${more} more item${more > 1 ? "s" : ""}` : ""}
        </span>
      </span>
    </span>
  );
}

/** Orders & earnings › Orders (designs/seller/seller-orders.html). */
export default function SellerOrdersPage() {
  useTitle("Orders & earnings");
  const router = useRouter();
  const [tab, setTab] = useState<SellerOrderTab>("new");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [shipping, setShipping] = useState<SellerOrderRow | null>(null);
  const list = useLoad(() => sellerService.orderList({ tab, q: query || undefined, page, size: SIZE }), [tab, query, page]);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t && TABS.some(([k]) => k === t)) setTab(t as SellerOrderTab);
  }, []);
  useEffect(() => {
    const id = setTimeout(() => {
      setQuery(q.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(id);
  }, [q]);

  const d = list.data;
  const c = d?.counts;
  const s = d?.stats;
  const pick = (t: SellerOrderTab) => {
    setTab(t);
    setPage(0);
  };
  const download = async () => {
    try {
      saveBlob((await sellerService.ordersCsv(tab)).data, "orders.csv");
      toast.success("Orders downloaded (CSV)");
    } catch (e) {
      toast.error(errorText(e, "We couldn't download your orders."));
    }
  };

  return (
    <>
      <div className="sp-ph">
        <div>
          <h1>Orders &amp; earnings</h1>
          <p>Orders for your products, what to ship next, and what you&apos;ll be paid.</p>
        </div>
        <div className="sp-ph-a">
          <Link className="sp-btn sp-btn-sec" href={ticketHref("orders")}>
            <Ico name="mail" />
            Problem with an order?
          </Link>
          <button type="button" className="sp-btn sp-btn-sec" onClick={download}>
            <Ico name="download" />
            Download orders
          </button>
        </div>
      </div>
      <OrdersTabs active="orders" />

      {c && s ? (
        <div className="sp-dstats">
          <button type="button" className={`sp-dstat ${s.late ? "sp-bad" : s.dueToday ? "sp-warn" : ""}`} onClick={() => pick("new")}>
            <span className="sp-k">
              <i style={{ background: "var(--amber)" }} />
              To ship
            </span>
            <b>{c.new}</b>
            <small>
              {s.late ? (
                <>
                  <span className="sp-due-bad">{s.late} late</span>
                  {s.dueToday ? ` · ${s.dueToday} due today` : ""}
                </>
              ) : s.dueToday ? (
                `${s.dueToday} due today`
              ) : (
                "Nothing due today"
              )}
            </small>
          </button>
          <button type="button" className="sp-dstat" onClick={() => pick("shipped")}>
            <span className="sp-k">
              <i style={{ background: "var(--blue)" }} />
              On the way
            </span>
            <b>{c.shipped}</b>
            <small>Shipped, not delivered yet</small>
          </button>
          <button type="button" className="sp-dstat" onClick={() => pick("delivered")}>
            <span className="sp-k">
              <i style={{ background: "var(--leaf)" }} />
              Delivered · 30 days
            </span>
            <b>{s.delivered30Days}</b>
            <small>{usd(s.delivered30DaysSales)} in sales</small>
          </button>
          <button type="button" className={`sp-dstat ${c.return ? "sp-warn" : ""}`} onClick={() => pick("return")}>
            <span className="sp-k">
              <i style={{ background: "var(--red)" }} />
              Returns
            </span>
            <b>{c.return}</b>
            <small>{c.return ? "Needs your answer" : "No open returns"}</small>
          </button>
        </div>
      ) : null}

      {s?.late ? (
        <div className="sp-alert sp-alert-bad" style={{ marginBottom: 16 }}>
          <Ico name="alert" />
          <span>
            <b>
              {s.late} order{s.late > 1 ? "s are" : " is"} past the ship-by time.
            </b>{" "}
            Ship {s.late > 1 ? "them" : "it"} now, or <Link href={ticketHref("orders")}>tell us</Link> if you can&apos;t. Late shipments count against your seller rating.
          </span>
        </div>
      ) : null}

      <section className="sp-ocard" aria-label="Orders">
        <div className="sp-otools">
          <div className="sp-tabs" role="tablist" aria-label="Order status">
            {TABS.map(([k, label]) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => pick(k)}>
                {label}
                {c ? <span className="sp-n">{c[k]}</span> : null}
              </button>
            ))}
          </div>
          <label className="sp-srch">
            <Ico name="search" />
            <span className="sp-sr">Search orders</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order number, product or city" />
          </label>
        </div>
        {list.error && !d ? (
          <div style={{ padding: 16 }}>
            <LoadError error={list.error} onRetry={list.reload} what="your orders" />
          </div>
        ) : !d ? (
          <Loading />
        ) : d.content.length ? (
          <div className="sp-otw">
            <table className="sp-otable">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Items</th>
                  <th className="sp-hide-l">Ship to</th>
                  <th>{tab === "new" ? "Ship by" : "Status detail"}</th>
                  <th className="sp-r">Total</th>
                  <th>Status</th>
                  <th>
                    <span className="sp-sr">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {d.content.map((o) => (
                  <tr
                    key={o.orderNumber}
                    className="sp-go"
                    onClick={(e) => {
                      if (!(e.target as HTMLElement).closest("a,button")) router.push(`/merchant/orders/${encodeURIComponent(o.orderNumber)}`);
                    }}
                  >
                    <td className="sp-c-id">
                      <Link className="sp-oid" href={`/merchant/orders/${encodeURIComponent(o.orderNumber)}`}>
                        {o.orderNumber}
                      </Link>
                      <span className="sp-osub">{rel(o.paidAt)}</span>
                    </td>
                    <td className="sp-c-it">
                      <ItemsCell o={o} />
                    </td>
                    <td className="sp-c-to sp-hide-l">
                      {o.shipToCity}, {o.shipToState}
                    </td>
                    <td className="sp-c-due">{detailOf(o)}</td>
                    <td className="sp-c-tot sp-r sp-num">
                      <b>{usd(o.sales)}</b>
                      <span className="sp-osub">You earn {usd(o.net)}</span>
                    </td>
                    <td className="sp-c-st">
                      <OrderStatePill state={o.state} />
                    </td>
                    <td className="sp-c-act">
                      {o.state === "new" && o.ownsAll ? (
                        <button type="button" className="sp-btn sp-btn-pri sp-btn-sm" onClick={() => setShipping(o)}>
                          <Ico name="box" />
                          Mark as shipped
                        </button>
                      ) : o.state === "return" ? (
                        <Link className="sp-btn sp-btn-sec sp-btn-sm" href={`/merchant/orders/${encodeURIComponent(o.orderNumber)}`}>
                          Review return
                        </Link>
                      ) : (
                        <Link className="sp-btn sp-btn-ghost sp-btn-sm" href={`/merchant/orders/${encodeURIComponent(o.orderNumber)}`}>
                          View
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="sp-oempty">{tab === "new" && !query ? "Nothing to ship right now. New orders show up here first." : "No orders here."}</p>
        )}
        {d && d.totalPages > 1 ? (
          <div className="sp-pager">
            <button type="button" className="sp-btn sp-btn-sec sp-btn-sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <span className="sp-muted">
              Page {page + 1} of {d.totalPages}
            </span>
            <button type="button" className="sp-btn sp-btn-sec sp-btn-sm" disabled={page + 1 >= d.totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        ) : null}
      </section>
      {d ? (
        <p className="sp-help" style={{ marginTop: 12 }}>
          You earn the item total less our {Math.round(d.commissionRate * 100)}% commission. Ship within 2 days of the order.
        </p>
      ) : null}

      <ShipDialog
        order={shipping}
        onClose={() => setShipping(null)}
        onDone={() => {
          setShipping(null);
          void list.reload();
        }}
      />
    </>
  );
}
