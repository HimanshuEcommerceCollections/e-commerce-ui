"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import sellerTicketsService, { type AdminTicketList } from "@/services/admin/sellerTickets.service";
import { getApiErrorMessage } from "@/lib/apiError";
import { Icon, Pager, rangeText, useDebounced, usePageTitle } from "@/components/admin/ui";
import type { TicketStatus, TicketTab } from "@/types/api/seller.types";

const SIZE = 25;
const TABS: [TicketTab, string, keyof AdminTicketList["counts"] | null][] = [
  ["open", "With our team", "open"],
  ["waiting", "Waiting for seller", "waiting"],
  ["resolved", "Resolved", "resolved"],
  ["all", "All", null],
];
const STATUS_PILL: Record<TicketStatus, [string, string]> = {
  OPEN: ["p-info", "With our team"],
  WAITING: ["p-warn", "Waiting for seller"],
  RESOLVED: ["p-ok", "Resolved"],
};
const when = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/** Seller Help & support tickets for the catalog, support and payments teams. */
export default function SellerTicketsPage() {
  usePageTitle("Seller tickets");
  const [tab, setTab] = useState<TicketTab>("open");
  const [mine, setMine] = useState(false);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<AdminTicketList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const query = useDebounced(q.trim(), 300);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData((await sellerTicketsService.list({ tab, q: query || undefined, mine, page, size: SIZE })).data.data);
    } catch (e) {
      setError(getApiErrorMessage(e, "Couldn't load seller tickets."));
    }
  }, [tab, query, mine, page]);
  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Seller tickets</h1>
          <p>Questions and problems sellers raise from Help &amp; support, routed to a team by topic. Urgent tickets come first.</p>
        </div>
      </div>
      <div className="panel">
        <div className="tabs" role="tablist">
          {TABS.map(([k, label, count]) => (
            <button
              key={k}
              role="tab"
              aria-selected={tab === k}
              onClick={() => {
                setTab(k);
                setPage(0);
              }}
            >
              {label}
              {count && data ? <span className="c">{data.counts[count]}</span> : null}
            </button>
          ))}
        </div>
        <div className="toolbar" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", padding: "12px 16px" }}>
          <label className="search">
            <Icon name="search" />
            <span className="sr-only">Search tickets</span>
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
              placeholder="Reference, subject or seller"
            />
          </label>
          <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 14 }}>
            <input
              type="checkbox"
              checked={mine}
              onChange={(e) => {
                setMine(e.target.checked);
                setPage(0);
              }}
            />
            Assigned to me
          </label>
          {data?.counts.urgent ? <span className="pill p-bad">{data.counts.urgent} urgent</span> : null}
        </div>
        <div className="twrap">
          <table>
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Seller</th>
                <th>Topic · team</th>
                <th>Assigned</th>
                <th>Last message</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {error ? (
                <tr>
                  <td colSpan={6} className="empty-row">
                    {error}
                  </td>
                </tr>
              ) : !data ? (
                <tr>
                  <td colSpan={6} className="loading-row">
                    Loading…
                  </td>
                </tr>
              ) : data.content.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-row">
                    No tickets here.
                  </td>
                </tr>
              ) : (
                data.content.map((t) => (
                  <tr key={t.reference}>
                    <td>
                      <Link className="link" href={`/admin/seller-tickets/${t.reference}`}>
                        <b>{t.subject}</b>
                      </Link>
                      <div className="sub">
                        {t.reference}
                        {t.urgent ? " · Urgent" : ""}
                      </div>
                    </td>
                    <td>
                      {t.seller.company ?? t.seller.name}
                      <div className="sub">{t.seller.email}</div>
                    </td>
                    <td>
                      {t.topicLabel}
                      <div className="sub">{t.team}</div>
                    </td>
                    <td>{t.assignee ?? <span className="sub">Unassigned</span>}</td>
                    <td>
                      {when(t.lastMessageAt)}
                      <div className="sub">{t.lastMessage ? (t.lastMessage.role === "SELLER" ? "from seller" : `from ${t.lastMessage.name}`) : ""}</div>
                    </td>
                    <td>
                      <span className={`pill ${STATUS_PILL[t.status][0]}`}>{STATUS_PILL[t.status][1]}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="tfoot">
          <span>{data ? rangeText(page, SIZE, data.content.length, data.totalElements, "tickets") : ""}</span>
          <Pager page={page} pages={data?.totalPages ?? 0} onPage={setPage} />
        </div>
      </div>
    </>
  );
}
