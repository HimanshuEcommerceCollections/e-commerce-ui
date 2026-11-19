"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OrdersTabs, dateOf, saveBlob, ticketHref, usd } from "@/components/seller/orders";
import { Ico, LoadError, Loading, Pill, errorText, useLoad } from "@/components/seller/ui";
import { useTitle } from "@/components/seller/useSellerSession";
import sellerService from "@/services/seller/seller.service";

const utc = (iso: string, opts: Intl.DateTimeFormatOptions) => dateOf(iso, { ...opts, timeZone: "UTC" });

/** Orders & earnings › Earnings & payouts (designs/seller/seller-orders.html, #earnings). */
export default function SellerEarningsPage() {
  useTitle("Earnings & payouts");
  const router = useRouter();
  const load = useLoad(() => sellerService.payouts());
  const p = load.data;

  const statement = async (reference: string) => {
    try {
      saveBlob((await sellerService.payoutStatement(reference)).data, `statement-${reference}.csv`);
    } catch (e) {
      toast.error(errorText(e, "We couldn't download this statement."));
    }
  };

  return (
    <>
      <div className="sp-ph">
        <div>
          <h1>Orders &amp; earnings</h1>
          <p>What you&apos;ve earned, what&apos;s coming next, and every payout we&apos;ve sent.</p>
        </div>
        <div className="sp-ph-a">
          <Link className="sp-btn sp-btn-sec" href={ticketHref("payments")}>
            <Ico name="mail" />
            Question about a payout?
          </Link>
        </div>
      </div>
      <OrdersTabs active="earnings" />

      {load.error && !p ? (
        <LoadError error={load.error} onRetry={load.reload} what="your earnings" />
      ) : !p ? (
        <Loading />
      ) : (
        <>
          <div className="sp-dstats">
            <div className="sp-dstat">
              <span className="sp-k">
                <i style={{ background: "var(--leaf)" }} />
                Next payout
              </span>
              <b>{usd(p.next.amount)}</b>
              <small>{utc(p.next.scheduledFor, { weekday: "long", month: "short", day: "numeric" })}</small>
            </div>
            <div className="sp-dstat">
              <span className="sp-k">
                <i style={{ background: "var(--blue)" }} />
                Waiting on delivery
              </span>
              <b>{usd(p.waiting.amount)}</b>
              <small>
                {p.waiting.orders} order{p.waiting.orders === 1 ? "" : "s"} shipped or in a return
              </small>
            </div>
            <div className="sp-dstat">
              <span className="sp-k">
                <i style={{ background: "var(--navy)" }} />
                Sales this month
              </span>
              <b>{usd(p.month.sales)}</b>
              <small>
                {p.month.orders} order{p.month.orders === 1 ? "" : "s"}
              </small>
            </div>
            <div className="sp-dstat">
              <span className="sp-k">
                <i style={{ background: "var(--amber)" }} />
                Paid out · last 4 weeks
              </span>
              <b>{usd(p.paidLastFourWeeks.amount)}</b>
              <small>
                {p.paidLastFourWeeks.payouts} payout{p.paidLastFourWeeks.payouts === 1 ? "" : "s"}
              </small>
            </div>
          </div>

          <div className="sp-od">
            <div className="sp-stack2">
              <section className="sp-card">
                <div className="sp-ch">
                  <h2>Next payout</h2>
                  <Pill tone="ok">Scheduled</Pill>
                </div>
                <div className="sp-po-next">
                  <div>
                    <b className="sp-big">{usd(p.next.amount)}</b>
                    <p className="sp-muted" style={{ fontSize: 14 }}>
                      Paid {utc(p.next.scheduledFor, { weekday: "long", month: "long", day: "numeric" })} for orders delivered since your last payout.
                    </p>
                  </div>
                </div>
                {p.next.orders.length ? (
                  <div className="sp-otw">
                    <table className="sp-otable" style={{ marginTop: 14 }}>
                      <thead>
                        <tr>
                          <th>Order</th>
                          <th>Delivered</th>
                          <th className="sp-r">Sales</th>
                          <th className="sp-r">Commission</th>
                          <th className="sp-r">You earn</th>
                        </tr>
                      </thead>
                      <tbody>
                        {p.next.orders.map((o) => (
                          <tr key={o.orderNumber} className="sp-go" onClick={() => router.push(`/merchant/orders/${encodeURIComponent(o.orderNumber)}`)}>
                            <td className="sp-c-id">
                              <Link className="sp-oid" href={`/merchant/orders/${encodeURIComponent(o.orderNumber)}`}>
                                {o.orderNumber}
                              </Link>
                            </td>
                            <td className="sp-c-due">{dateOf(o.deliveredAt)}</td>
                            <td className="sp-r sp-num sp-hide-m">{usd(o.sales - o.refunds)}</td>
                            <td className="sp-r sp-num sp-hide-m">−{usd(o.commission)}</td>
                            <td className="sp-r sp-num sp-c-tot">
                              <b>{usd(o.net)}</b>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="sp-muted" style={{ marginTop: 12 }}>
                    No delivered orders waiting for payout.
                  </p>
                )}
              </section>
            </div>
            <aside className="sp-side2">
              <section className="sp-card">
                <div className="sp-ch">
                  <h2>How you get paid</h2>
                </div>
                <ul className="sp-lines" style={{ fontSize: 14 }}>
                  <li className="sp-li2">
                    <Ico name="clock" />
                    <span>
                      <b>Every {p.schedule.payoutDay}</b>
                      <small>For orders delivered by the {p.schedule.cutoffDay} before, with no return open</small>
                    </span>
                  </li>
                  <li className="sp-li2">
                    <Ico name="cart" />
                    <span>
                      <b>{Math.round(p.commissionRate * 100)}% commission</b>
                      <small>On the item price the customer keeps</small>
                    </span>
                  </li>
                  <li className="sp-li2">
                    <Ico name="shield" />
                    <span>
                      <b>Returns</b>
                      <small>An order is paid out once its return is settled; refunded items aren&apos;t paid</small>
                    </span>
                  </li>
                </ul>
                <div className="sp-bank" style={{ marginTop: 12 }}>
                  <Ico name="lock" />
                  <span>Paid to the bank account on your seller agreement</span>
                </div>
                <Link className="sp-btn sp-btn-sec sp-btn-sm" style={{ width: "100%", marginTop: 10 }} href={ticketHref("payments")}>
                  Change bank details
                </Link>
                <p className="sp-note-s">For your security, bank changes go through our payments team.</p>
              </section>
            </aside>
          </div>

          <section className="sp-card" style={{ marginTop: 18 }}>
            <div className="sp-ch">
              <h2>Payout history</h2>
            </div>
            {p.history.length ? (
              <div className="sp-otw">
                <table className="sp-otable">
                  <thead>
                    <tr>
                      <th>Payout</th>
                      <th>Orders delivered</th>
                      <th className="sp-r">Sales</th>
                      <th className="sp-r">Commission</th>
                      <th className="sp-r">Refunds</th>
                      <th className="sp-r">{p.history.some((h) => h.status === "PAID") ? "Paid" : "Amount"}</th>
                      <th>
                        <span className="sp-sr">Statement</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.history.map((h) => (
                      <tr key={h.reference}>
                        <td className="sp-c-id">
                          <b className="sp-oid">{h.reference}</b>
                          <span className="sp-osub">
                            {h.status === "PAID" && h.paidAt
                              ? `Paid ${dateOf(h.paidAt, { month: "short", day: "numeric", year: "numeric" })}`
                              : `Scheduled ${utc(h.scheduledFor, { month: "short", day: "numeric", year: "numeric" })}`}
                          </span>
                        </td>
                        <td className="sp-c-due">
                          {dateOf(h.periodFrom)} – {dateOf(h.periodTo)} · {h.orders} order{h.orders === 1 ? "" : "s"}
                        </td>
                        <td className="sp-r sp-num sp-hide-m">{usd(h.sales)}</td>
                        <td className="sp-r sp-num sp-hide-m">−{usd(h.commission)}</td>
                        <td className="sp-r sp-num sp-hide-m">{h.refunds ? `−${usd(h.refunds)}` : "—"}</td>
                        <td className="sp-r sp-num sp-c-tot">
                          <b>{usd(h.net)}</b>
                        </td>
                        <td className="sp-c-act">
                          <button type="button" className="sp-btn sp-btn-ghost sp-btn-sm" onClick={() => statement(h.reference)}>
                            <Ico name="download" />
                            Statement
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="sp-muted">No payouts yet. Your first one is sent the Friday after your first delivered order.</p>
            )}
          </section>
        </>
      )}
    </>
  );
}
