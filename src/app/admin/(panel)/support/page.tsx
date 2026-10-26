"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import adminService from "@/services/admin/admin.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type { AdminSupportMessage, SupportMessageStatus } from "@/types/api/admin.types";
import { HandleForm } from "@/components/admin/Inbox";
import {
  Drawer,
  Icon,
  Pager,
  SUPPORT_STATUS,
  StatusPill,
  dateTime,
  rangeText,
  useDebounced,
  usePageTitle,
  whenText,
} from "@/components/admin/ui";

const SIZE = 20;
const TABS: Array<{ key: SupportMessageStatus | "ALL"; label: string }> = [
  { key: "OPEN", label: "Open" },
  { key: "IN_PROGRESS", label: "In progress" },
  { key: "CLOSED", label: "Closed" },
  { key: "ALL", label: "All" },
];

/** Messages from the help center's contact form (admin only). */
export default function AdminSupportPage() {
  usePageTitle("Support messages");
  const [tab, setTab] = useState<SupportMessageStatus | "ALL">("OPEN");
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<AdminSupportMessage[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await adminService.listSupportMessages({ status: tab === "ALL" ? undefined : tab, q: q || undefined, page, size: SIZE });
      const data = r.data.data!;
      setRows(data.content);
      setTotal(data.totalElements);
      setPages(data.totalPages);
    } catch (err) {
      setRows([]);
      setError(getApiErrorMessage(err, "Couldn't load messages"));
    }
  }, [tab, q, page]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => setPage(0), [tab, q]);

  return (
    <section aria-labelledby="h-support">
      <div className="page-head">
        <div>
          <h1 id="h-support">Support messages</h1>
          <p>Questions sent from the help center. Reply by email, then record what was done here.</p>
        </div>
      </div>

      <div className="panel">
        <div className="tabs" role="tablist" aria-label="Message status">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}>
              {t.label}
              {tab === t.key && rows ? <span className="c">{total}</span> : null}
            </button>
          ))}
        </div>
        <div className="toolbar">
          <label className="search">
            <Icon name="search" />
            <span className="sr-only">Search messages</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, ticket or order #" />
          </label>
        </div>
        <div className="twrap">
          <table>
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Name / Email</th>
                <th>Topic</th>
                <th>Order #</th>
                <th>Received</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows === null ? (
                <tr className="loading-row"><td colSpan={6}>Loading messages…</td></tr>
              ) : error ? (
                <tr className="empty-row"><td colSpan={6}><span className="err-text">{error}</span></td></tr>
              ) : rows.length === 0 ? (
                <tr className="empty-row"><td colSpan={6}>{q ? `No messages match “${q}”.` : "No messages here."}</td></tr>
              ) : (
                rows.map((m) => {
                  const d = dateTime(m.createdAt);
                  return (
                    <tr key={m.id} className="click" tabIndex={0} onClick={() => setOpen(m.id)} onKeyDown={(e) => e.key === "Enter" && setOpen(m.id)}>
                      <td><strong>{m.ticketNumber}</strong></td>
                      <td>{m.name}<div className="sub">{m.email}</div></td>
                      <td>{m.topic}<div className="sub trunc">{m.message}</div></td>
                      <td>{m.orderNumber ?? <span className="sub">—</span>}</td>
                      <td>{d.date}<div className="sub">{d.time}</div></td>
                      <td><StatusPill map={SUPPORT_STATUS} status={m.status} /></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="tfoot">
          <span>{rows ? rangeText(page, SIZE, rows.length, total, "messages") : ""}</span>
          <Pager page={page} pages={pages} onPage={setPage} />
        </div>
      </div>

      <MessageDrawer id={open} onClose={() => setOpen(null)} onChanged={load} />
    </section>
  );
}

function MessageDrawer({ id, onClose, onChanged }: { id: string | null; onClose: () => void; onChanged: () => void }) {
  const [m, setM] = useState<AdminSupportMessage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setM(null);
    setError(null);
    if (!id) return;
    adminService
      .getSupportMessage(id)
      .then((r) => setM(r.data.data))
      .catch((err) => setError(getApiErrorMessage(err, "Couldn't load the message")));
  }, [id]);

  return (
    <Drawer
      open={!!id}
      onClose={onClose}
      title={m ? `Ticket ${m.ticketNumber}` : "Message"}
      sub={m ? <span className="badges">{m.topic} <StatusPill map={SUPPORT_STATUS} status={m.status} /></span> : null}
      foot={
        <>
          {m ? (
            <a className="btn btn-secondary" href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.topic} [${m.ticketNumber}]`)}`}>
              <Icon name="mail" />
              Reply by email
            </a>
          ) : null}
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </>
      }
    >
      {!m ? (
        error ? <p className="err-text">{error}</p> : <p className="sub">Loading…</p>
      ) : (
        <>
          <div className="d-sec">
            <h3>Message</h3>
            <p className="msg">{m.message}</p>
          </div>
          <div className="d-sec">
            <h3>From</h3>
            <dl className="kv">
              <dt>Name</dt><dd>{m.name}</dd>
              <dt>Email</dt><dd><a className="link" href={`mailto:${m.email}`}>{m.email}</a></dd>
              <dt>Order #</dt>
              <dd>
                {m.orderNumber ? (
                  m.orderId ? <Link className="link" href={`/admin/orders?id=${m.orderId}`}>{m.orderNumber}</Link> : <>{m.orderNumber} <span className="sub">(no such order)</span></>
                ) : (
                  "—"
                )}
              </dd>
              <dt>Received</dt><dd>{whenText(m.createdAt)}</dd>
            </dl>
          </div>
          <HandleForm
            id={m.id}
            status={m.status}
            note={m.adminNote}
            handledBy={m.handledBy}
            updatedAt={m.updatedAt}
            statuses={SUPPORT_STATUS}
            onSave={async (data) => {
              const r = await adminService.updateSupportMessage(m.id, data);
              setM({ ...m, ...(r.data.data ?? data) });
            }}
            onSaved={onChanged}
          />
        </>
      )}
    </Drawer>
  );
}
