"use client";
import { useCallback, useEffect, useState } from "react";
import payoutsService, { type AdminPayout } from "@/services/admin/payouts.service";
import { getApiErrorMessage } from "@/lib/apiError";
import { Icon, Pager, rangeText, toast, usePageTitle } from "@/components/admin/ui";

const SIZE = 20;
const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const day = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

/**
 * Seller payouts for the payments team: each Friday the delivered orders of
 * the week before are closed into one payout per seller (the cron does it on
 * Vercel; "Close this week" does it by hand). Mark a payout paid once the
 * money is sent; the seller sees it in Earnings & payouts.
 */
export default function PayoutsPage() {
  usePageTitle("Seller payouts");
  const [tab, setTab] = useState<"SCHEDULED" | "PAID">("SCHEDULED");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<AdminPayout[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const d = (await payoutsService.list({ status: tab, page, size: SIZE })).data.data!;
      setRows(d.content);
      setTotal(d.totalElements);
      setPages(d.totalPages);
    } catch (e) {
      setError(getApiErrorMessage(e, "Couldn't load payouts."));
    }
  }, [tab, page]);
  useEffect(() => {
    void load();
  }, [load]);

  const close = async () => {
    setBusy("close");
    try {
      const res = await payoutsService.closeWeek();
      toast(res.data.message || "Done");
      setTab("SCHEDULED");
      setPage(0);
      void load();
    } catch (e) {
      toast(getApiErrorMessage(e, "Couldn't close the week."), true);
    } finally {
      setBusy(null);
    }
  };
  const paid = async (p: AdminPayout) => {
    if (!window.confirm(`Mark ${p.reference} (${usd(p.net)} to ${p.seller}) as paid? Do this once the money is sent.`)) return;
    setBusy(p.reference);
    try {
      await payoutsService.markPaid(p.reference);
      toast(`${p.reference} marked as paid`);
      void load();
    } catch (e) {
      toast(getApiErrorMessage(e, "Couldn't mark it paid."), true);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Seller payouts</h1>
          <p>Every Friday, orders delivered by the Sunday before (with no return open) become one payout per seller. Mark each paid once the money is sent.</p>
        </div>
        <div className="actions">
          <button className="btn btn-secondary" onClick={close} disabled={busy === "close"}>
            <Icon name="refresh" />
            {busy === "close" ? "Closing…" : "Close this week"}
          </button>
        </div>
      </div>
      <div className="panel">
        <div className="tabs" role="tablist">
          {(["SCHEDULED", "PAID"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => {
                setTab(t);
                setPage(0);
              }}
            >
              {t === "SCHEDULED" ? "To pay" : "Paid"}
            </button>
          ))}
        </div>
        <div className="twrap">
          <table>
            <thead>
              <tr>
                <th>Payout</th>
                <th>Seller</th>
                <th>{tab === "PAID" ? "Paid" : "Scheduled for"}</th>
                <th className="num">Orders</th>
                <th className="num">Sales</th>
                <th className="num">Commission</th>
                <th className="num">Refunds</th>
                <th className="num">Pay</th>
                <th>
                  <span className="sr-only">Action</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {error ? (
                <tr>
                  <td colSpan={9} className="empty-row">
                    {error}
                  </td>
                </tr>
              ) : !rows ? (
                <tr>
                  <td colSpan={9} className="loading-row">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-row">
                    {tab === "SCHEDULED" ? "Nothing to pay. Payouts appear here each Friday." : "No payouts marked paid yet."}
                  </td>
                </tr>
              ) : (
                rows.map((p) => (
                  <tr key={p.reference}>
                    <td>
                      <b>{p.reference}</b>
                    </td>
                    <td>
                      {p.seller}
                      <div className="sub">{p.sellerEmail}</div>
                    </td>
                    <td>
                      {tab === "PAID" && p.paidAt
                        ? new Date(p.paidAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : day(p.scheduledFor)}
                      {p.paidBy ? <div className="sub">{p.paidBy}</div> : null}
                    </td>
                    <td className="num">{p.orders}</td>
                    <td className="num">{usd(p.sales)}</td>
                    <td className="num">−{usd(p.commission)}</td>
                    <td className="num">{p.refunds ? `−${usd(p.refunds)}` : "—"}</td>
                    <td className="num">
                      <b>{usd(p.net)}</b>
                    </td>
                    <td>
                      {p.status === "SCHEDULED" ? (
                        <button className="btn btn-primary btn-sm" disabled={busy === p.reference} onClick={() => paid(p)}>
                          <Icon name="check" />
                          Mark paid
                        </button>
                      ) : (
                        <span className="pill p-ok">Paid</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="tfoot">
          <span>{rows ? rangeText(page, SIZE, rows.length, total, "payouts") : ""}</span>
          <Pager page={page} pages={pages} onPage={setPage} />
        </div>
      </div>
    </>
  );
}
