"use client";
import { useCallback, useEffect, useState } from "react";
import adminService from "@/services/admin/admin.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type { AdminSellerApplication, SellerApplicationStatus } from "@/types/api/admin.types";
import { HandleForm } from "@/components/admin/Inbox";
import {
  APPLICATION_STATUS,
  Drawer,
  Icon,
  Pager,
  StatusPill,
  dateTime,
  rangeText,
  useDebounced,
  usePageTitle,
  whenText,
} from "@/components/admin/ui";

const SIZE = 20;
const TABS: Array<{ key: SellerApplicationStatus | "ALL"; label: string }> = [
  { key: "NEW", label: "New" },
  { key: "CONTACTED", label: "Contacted" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
  { key: "ALL", label: "All" },
];

/** Applications from the "Sell with us" page (admin only). */
export default function AdminSellerApplicationsPage() {
  usePageTitle("Seller applications");
  const [tab, setTab] = useState<SellerApplicationStatus | "ALL">("NEW");
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<AdminSellerApplication[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await adminService.listSellerApplications({ status: tab === "ALL" ? undefined : tab, q: q || undefined, page, size: SIZE });
      const data = r.data.data!;
      setRows(data.content);
      setTotal(data.totalElements);
      setPages(data.totalPages);
    } catch (err) {
      setRows([]);
      setError(getApiErrorMessage(err, "Couldn't load applications"));
    }
  }, [tab, q, page]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => setPage(0), [tab, q]);

  return (
    <section aria-labelledby="h-apps">
      <div className="page-head">
        <div>
          <h1 id="h-apps">Seller applications</h1>
          <p>Businesses that asked to sell with us. Contact them, then approve or reject.</p>
        </div>
      </div>

      <div className="panel">
        <div className="tabs" role="tablist" aria-label="Application status">
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
            <span className="sr-only">Search applications</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, phone, city or reference" />
          </label>
        </div>
        <div className="twrap">
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Name</th>
                <th>Email / Phone</th>
                <th>Categories</th>
                <th>City / State</th>
                <th>Received</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows === null ? (
                <tr className="loading-row"><td colSpan={7}>Loading applications…</td></tr>
              ) : error ? (
                <tr className="empty-row"><td colSpan={7}><span className="err-text">{error}</span></td></tr>
              ) : rows.length === 0 ? (
                <tr className="empty-row"><td colSpan={7}>{q ? `No applications match “${q}”.` : "No applications here."}</td></tr>
              ) : (
                rows.map((a) => {
                  const d = dateTime(a.createdAt);
                  return (
                    <tr key={a.id} className="click" tabIndex={0} onClick={() => setOpen(a.id)} onKeyDown={(e) => e.key === "Enter" && setOpen(a.id)}>
                      <td><strong>{a.reference}</strong></td>
                      <td>{a.fullName}</td>
                      <td>{a.email}<div className="sub">{a.phone}</div></td>
                      <td className="trunc">{a.categories.join(", ")}</td>
                      <td>{a.city}, {a.state}</td>
                      <td>{d.date}<div className="sub">{d.time}</div></td>
                      <td><StatusPill map={APPLICATION_STATUS} status={a.status} /></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="tfoot">
          <span>{rows ? rangeText(page, SIZE, rows.length, total, "applications") : ""}</span>
          <Pager page={page} pages={pages} onPage={setPage} />
        </div>
      </div>

      <ApplicationDrawer id={open} onClose={() => setOpen(null)} onChanged={load} />
    </section>
  );
}

function ApplicationDrawer({ id, onClose, onChanged }: { id: string | null; onClose: () => void; onChanged: () => void }) {
  const [a, setA] = useState<AdminSellerApplication | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setA(null);
    setError(null);
    if (!id) return;
    adminService
      .getSellerApplication(id)
      .then((r) => setA(r.data.data))
      .catch((err) => setError(getApiErrorMessage(err, "Couldn't load the application")));
  }, [id]);

  return (
    <Drawer
      open={!!id}
      onClose={onClose}
      title={a ? a.fullName : "Application"}
      sub={a ? <span className="badges">{a.reference} <StatusPill map={APPLICATION_STATUS} status={a.status} /></span> : null}
      foot={
        <>
          {a ? (
            <a className="btn btn-secondary" href={`mailto:${a.email}?subject=${encodeURIComponent(`Your seller application ${a.reference}`)}`}>
              <Icon name="mail" />
              Email
            </a>
          ) : null}
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </>
      }
    >
      {!a ? (
        error ? <p className="err-text">{error}</p> : <p className="sub">Loading…</p>
      ) : (
        <>
          <div className="d-sec">
            <h3>What they sell</h3>
            <div className="chips" style={{ marginBottom: 8 }}>
              {a.categories.map((c) => <span key={c} className="pill p-grey">{c}</span>)}
            </div>
            <p className="msg">{a.products}</p>
          </div>
          <div className="d-sec">
            <h3>Contact</h3>
            <dl className="kv">
              <dt>Email</dt><dd><a className="link" href={`mailto:${a.email}`}>{a.email}</a></dd>
              <dt>Phone</dt><dd><a className="link" href={`tel:${a.phone.replace(/[^\d+]/g, "")}`}>{a.phone}</a></dd>
              <dt>Address</dt><dd>{a.street}, {a.city}, {a.state} {a.postalCode}</dd>
              <dt>Received</dt><dd>{whenText(a.createdAt)}</dd>
              <dt>Consent</dt><dd>{a.consentAt ? `Agreed to be contacted, ${whenText(a.consentAt)}` : "—"}</dd>
            </dl>
          </div>
          <HandleForm
            id={a.id}
            status={a.status}
            note={a.adminNote}
            handledBy={a.handledBy}
            updatedAt={a.updatedAt}
            statuses={APPLICATION_STATUS}
            onSave={async (data) => {
              const r = await adminService.updateSellerApplication(a.id, data);
              setA({ ...a, ...(r.data.data ?? data) });
            }}
            onSaved={onChanged}
          />
          {a.status === "APPROVED" ? (
            <div className="note">
              <Icon name="info" />
              <span>Approving records the decision only. Give the seller a Merchant account under Customers (change the role from the account&apos;s detail).</span>
            </div>
          ) : null}
        </>
      )}
    </Drawer>
  );
}
