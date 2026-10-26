"use client";
import { useCallback, useEffect, useState } from "react";
import adminService from "@/services/admin/admin.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type {
  SellerStockAlert,
  SubmissionCounts,
  SubmissionDetail,
  SubmissionKind,
  SubmissionRow,
  SubmissionStatus,
} from "@/types/api/admin.types";
import { useAdminSession } from "@/components/admin/useAdminSession";
import { refreshAdminCounts } from "@/components/admin/refresh";
import {
  Drawer,
  Icon,
  PRODUCT_STATUS_LABEL,
  Pager,
  SUBMISSION_STATUS,
  SubmissionPill,
  dateTime,
  rangeText,
  toast,
  usePageTitle,
  whenText,
} from "@/components/admin/ui";

const SIZE = 20;
type TabKey = "OPEN" | SubmissionStatus;
/** "To review" is the queue itself: waiting and in review, oldest first. */
const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "OPEN", label: "To review" },
  { key: "SUBMITTED", label: "Waiting" },
  { key: "IN_REVIEW", label: "In review" },
  { key: "CHANGES_REQUESTED", label: "Changes requested" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
  { key: "WITHDRAWN", label: "Withdrawn" },
];
const KIND_LABEL: Record<SubmissionKind, string> = { NEW_PRODUCT: "New product", EDIT: "Edit", DELIST: "Delist" };
const KIND_PILL: Record<SubmissionKind, string> = { NEW_PRODUCT: "p-ok", EDIT: "p-info", DELIST: "p-warn" };
const ACTION_LABEL: Record<string, string> = { UPDATE: "Changed", ADD: "New SKU", DELIST: "Taken off sale" };

type Decision = "approve" | "request-changes" | "reject";
const DECISION: Record<Decision, { label: string; done: string; needsNote: boolean }> = {
  approve: { label: "Approve", done: "approved", needsNote: false },
  "request-changes": { label: "Request changes", done: "sent back for changes", needsNote: true },
  reject: { label: "Reject", done: "rejected", needsNote: true },
};

const OPEN_STATUSES: SubmissionStatus[] = ["SUBMITTED", "IN_REVIEW"];

/** Seller products and changes waiting for the catalog team (admins and catalog staff). */
export default function AdminSubmissionsPage() {
  usePageTitle("Submissions");
  const [tab, setTab] = useState<TabKey>("OPEN");
  const [kind, setKind] = useState<SubmissionKind | "">("");
  const [merchantId, setMerchantId] = useState("");
  const [merchants, setMerchants] = useState<Array<{ id: string; label: string }>>([]);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<SubmissionRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [counts, setCounts] = useState<SubmissionCounts | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const { isAdmin } = useAdminSession();

  const load = useCallback(async () => {
    setError(null);
    try {
      const [list, c] = await Promise.all([
        adminService.listSubmissions({
          status: tab === "OPEN" ? undefined : tab,
          kind: kind || undefined,
          merchantId: merchantId || undefined,
          page,
          size: SIZE,
          sort: "submittedAt,asc",
        }),
        adminService.submissionCounts(),
      ]);
      const data = list.data.data!;
      setRows(data.content);
      setTotal(data.totalElements);
      setPages(data.totalPages);
      setCounts(c.data.data);
      // Sellers seen in the queue, for the filter when the account list isn't available.
      setMerchants((m) => {
        const seen = new Map(m.map((x) => [x.id, x]));
        data.content.forEach((r) => seen.has(r.merchant.id) || seen.set(r.merchant.id, { id: r.merchant.id, label: r.merchant.fullName || r.merchant.email }));
        return seen.size === m.length ? m : Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label));
      });
    } catch (err) {
      setRows([]);
      setError(getApiErrorMessage(err, "Couldn't load submissions"));
    }
  }, [tab, kind, merchantId, page]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => setPage(0), [tab, kind, merchantId]);

  // Admins can list every seller account; catalog staff fall back to the sellers in the queue.
  useEffect(() => {
    if (!isAdmin) return;
    adminService
      .listCustomers({ role: "ROLE_MERCHANT", size: 100, sort: "fullName,asc" })
      .then((r) => setMerchants((r.data.data?.content ?? []).map((m) => ({ id: m.id, label: m.fullName || m.email }))))
      .catch(() => {});
  }, [isAdmin]);

  const count = (k: TabKey) => (counts ? (k === "OPEN" ? OPEN_STATUSES.reduce((n, s) => n + (counts[s] ?? 0), 0) : counts[k] ?? 0) : null);

  return (
    <section aria-labelledby="h-subs">
      <div className="page-head">
        <div>
          <h1 id="h-subs">Submissions</h1>
          <p>Seller products and changes waiting for the catalog team, oldest first. Nothing reaches customers until it&apos;s approved.</p>
        </div>
      </div>

      <div className="panel">
        <div className="tabs" role="tablist" aria-label="Submission status">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}>
              {t.label}
              <span className="c">{count(t.key) ?? "…"}</span>
            </button>
          ))}
        </div>
        <div className="toolbar">
          <select className="sel" aria-label="Kind" value={kind} onChange={(e) => setKind(e.target.value as SubmissionKind | "")}>
            <option value="">All kinds</option>
            {(Object.keys(KIND_LABEL) as SubmissionKind[]).map((k) => (
              <option key={k} value={k}>{KIND_LABEL[k]}</option>
            ))}
          </select>
          <select className="sel" aria-label="Seller" value={merchantId} onChange={(e) => setMerchantId(e.target.value)}>
            <option value="">All sellers</option>
            {merchants.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>
        <div className="twrap">
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Seller</th>
                <th>Kind</th>
                <th>Product</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Reviewer</th>
              </tr>
            </thead>
            <tbody>
              {rows === null ? (
                <tr className="loading-row"><td colSpan={7}>Loading submissions…</td></tr>
              ) : error ? (
                <tr className="empty-row"><td colSpan={7}><span className="err-text">{error}</span></td></tr>
              ) : rows.length === 0 ? (
                <tr className="empty-row">
                  <td colSpan={7}>{tab === "OPEN" && !kind && !merchantId ? "Nothing to review. New seller submissions appear here." : "No submissions match."}</td>
                </tr>
              ) : (
                rows.map((s) => {
                  const d = dateTime(s.submittedAt);
                  return (
                    <tr
                      key={s.reference}
                      className="click"
                      tabIndex={0}
                      onClick={() => setOpen(s.reference)}
                      onKeyDown={(e) => e.key === "Enter" && setOpen(s.reference)}
                    >
                      <td><strong>{s.reference}</strong></td>
                      <td>{s.merchant.fullName}<div className="sub">{s.merchant.email}</div></td>
                      <td><span className={`pill ${KIND_PILL[s.kind]}`}>{KIND_LABEL[s.kind]}</span></td>
                      <td>
                        {s.productName}
                        <div className="sub">
                          <code>{s.parentProductCode}</code>
                          {s.skus.length ? ` · ${s.skus.length} SKU${s.skus.length === 1 ? "" : "s"}` : ""}
                        </div>
                      </td>
                      <td>{d.date}<div className="sub">{d.time}</div></td>
                      <td><SubmissionPill status={s.status} /></td>
                      <td>{s.reviewer ? s.reviewer.fullName || s.reviewer.email : <span className="sub">—</span>}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="tfoot">
          <span>{rows ? rangeText(page, SIZE, rows.length, total, "submissions") : ""}</span>
          <Pager page={page} pages={pages} onPage={setPage} />
        </div>
      </div>

      <StockAlerts />

      <SubmissionDrawer
        reference={open}
        onClose={() => setOpen(null)}
        onChanged={() => {
          load();
          refreshAdminCounts();
        }}
      />
    </section>
  );
}

/** Seller stock that dropped to zero in the last 7 days. */
function StockAlerts() {
  const [rows, setRows] = useState<SellerStockAlert[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminService
      .sellerStockAlerts(7)
      .then((r) => setRows(r.data.data ?? []))
      .catch((err) => {
        setRows([]);
        setError(getApiErrorMessage(err, "Couldn't load stock alerts"));
      });
  }, []);

  return (
    <div className="panel" style={{ marginTop: 24 }} aria-labelledby="h-alerts">
      <div className="toolbar">
        <div>
          <h2 id="h-alerts" className="panel-h">Seller stock alerts</h2>
          <span className="sub">Seller SKUs that sold out in the last 7 days. Sellers set their own stock, without review.</span>
        </div>
      </div>
      <div className="twrap">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product</th>
              <th>Seller</th>
              <th className="num">Stock</th>
              <th>Status</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {rows === null ? (
              <tr className="loading-row"><td colSpan={6}>Loading stock alerts…</td></tr>
            ) : error ? (
              <tr className="empty-row"><td colSpan={6}><span className="err-text">{error}</span></td></tr>
            ) : rows.length === 0 ? (
              <tr className="empty-row"><td colSpan={6}>No seller SKUs sold out this week.</td></tr>
            ) : (
              rows.map((a, i) => (
                <tr key={`${a.sku}-${a.at}-${i}`}>
                  <td><code>{a.sku}</code></td>
                  <td>{a.name}<div className="sub"><code>{a.parentProductCode}</code></div></td>
                  <td>{a.seller ?? <span className="sub">—</span>}</td>
                  <td className="num"><span className="qty-out">{a.from} → {a.to}</span></td>
                  <td className="sub">{PRODUCT_STATUS_LABEL[a.status] ?? a.status}</td>
                  <td className="sub">{whenText(a.at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SubmissionDrawer({ reference, onClose, onChanged }: { reference: string | null; onClose: () => void; onChanged: () => void }) {
  const [s, setS] = useState<SubmissionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [note, setNote] = useState("");
  const [noteErr, setNoteErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setS(null);
    setError(null);
    setDecision(null);
    if (!reference) return;
    adminService
      .getSubmission(reference)
      .then((r) => setS(r.data.data))
      .catch((err) => setError(getApiErrorMessage(err, "Couldn't load the submission")));
  }, [reference]);

  const choose = (d: Decision | null) => {
    setDecision(d);
    setNote("");
    setNoteErr(null);
  };

  const run = async (fn: () => Promise<{ data: { data: SubmissionDetail | null } }>, done: string) => {
    if (!s) return;
    setBusy(true);
    try {
      const res = await fn();
      if (res.data.data) setS(res.data.data);
      choose(null);
      toast(`${s.reference} ${done}`);
      onChanged();
    } catch (err) {
      toast(getApiErrorMessage(err, "Couldn't update the submission"), true);
    } finally {
      setBusy(false);
    }
  };

  const claim = () => s && run(() => adminService.claimSubmission(s.reference), "is in review with you");

  const decide = () => {
    if (!s || !decision) return;
    const d = DECISION[decision];
    if (d.needsNote && !note.trim()) {
      setNoteErr(decision === "reject" ? "Add the reason. The seller sees it." : "Say what the seller should change.");
      return;
    }
    run(() => adminService.decideSubmission(s.reference, decision, note.trim() || undefined), d.done);
  };

  const open = !!s && OPEN_STATUSES.includes(s.status);

  return (
    <Drawer
      open={!!reference}
      onClose={onClose}
      title={s ? `Submission ${s.reference}` : "Submission"}
      sub={
        s ? (
          <span className="badges">
            <span className={`pill ${KIND_PILL[s.kind]}`}>{KIND_LABEL[s.kind]}</span>
            <SubmissionPill status={s.status} />
          </span>
        ) : null
      }
      foot={
        open && !decision ? (
          <>
            {s!.status === "SUBMITTED" ? (
              <button className="btn btn-secondary" onClick={claim} disabled={busy}>Claim</button>
            ) : null}
            <button className="btn btn-danger" onClick={() => choose("reject")} disabled={busy}>Reject</button>
            <button className="btn btn-secondary" onClick={() => choose("request-changes")} disabled={busy}>Request changes</button>
            <button className="btn btn-primary" onClick={() => choose("approve")} disabled={busy}>
              <Icon name="check" />
              Approve
            </button>
          </>
        ) : (
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        )
      }
    >
      {!s ? (
        error ? <p className="err-text">{error}</p> : <p className="sub">Loading…</p>
      ) : (
        <>
          {decision ? (
            <div className={`d-sec actbox ${decision === "reject" ? "bad" : ""}`}>
              <div className="form">
                <strong>{DECISION[decision].label} {s.reference}</strong>
                {decision === "approve" ? (
                  <p className="sub">
                    {s.kind === "DELIST"
                      ? "Every SKU of this product is taken off sale."
                      : s.kind === "EDIT"
                        ? "The changes replace the live product. Stock isn't touched."
                        : "The product goes live with the statuses the seller asked for."}
                  </p>
                ) : null}
                <div className="fld">
                  <label htmlFor="subNote">{DECISION[decision].needsNote ? "Note to the seller" : "Note to the seller (optional)"}</label>
                  <textarea
                    className={`inp ${noteErr ? "bad" : ""}`}
                    id="subNote"
                    value={note}
                    maxLength={2000}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  {noteErr ? <span className="err-text">{noteErr}</span> : <span className="hint">The seller gets this by email.</span>}
                </div>
                <div className="actrow">
                  <button className="btn btn-secondary btn-sm" onClick={() => choose(null)} disabled={busy}>Back</button>
                  <button className={`btn btn-sm ${decision === "reject" ? "btn-danger" : "btn-primary"}`} onClick={decide} disabled={busy}>
                    {busy ? "Saving…" : DECISION[decision].label}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="d-sec">
            <h3>Details</h3>
            <dl className="kv">
              <dt>Seller</dt><dd>{s.merchant.fullName}<div className="sub">{s.merchant.email}</div></dd>
              <dt>Product</dt><dd>{s.productName}<div className="sub"><code>{s.parentProductCode}</code></div></dd>
              <dt>Sent as</dt><dd>{s.fileName ? <>File <code>{s.fileName}</code></> : s.source === "FORM" ? "Form" : s.source.toLowerCase()}</dd>
              <dt>Submitted</dt><dd>{whenText(s.submittedAt)}</dd>
              <dt>Reviewer</dt><dd>{s.reviewer ? `${s.reviewer.fullName || s.reviewer.email} · since ${whenText(s.reviewStartedAt)}` : "Not claimed"}</dd>
              {s.decidedAt ? (<><dt>Decided</dt><dd>{whenText(s.decidedAt)}</dd></>) : null}
              {s.sellerNote ? (<><dt>Seller note</dt><dd style={{ whiteSpace: "pre-wrap" }}>{s.sellerNote}</dd></>) : null}
              {s.reviewNote ? (<><dt>Review note</dt><dd style={{ whiteSpace: "pre-wrap" }}>{s.reviewNote}</dd></>) : null}
            </dl>
          </div>

          <div className="d-sec">
            <h3>Changes ({s.changes.length} SKU{s.changes.length === 1 ? "" : "s"})</h3>
            {s.changes.length ? (
              <div className="items">
                {s.changes.map((c) => (
                  <div className="vcard" key={c.sku}>
                    <div className="badges">
                      <code>{c.sku}</code>
                      <span className={`pill ${c.action === "DELIST" ? "p-warn" : c.action === "ADD" ? "p-ok" : "p-info"}`}>{ACTION_LABEL[c.action] ?? c.action}</span>
                    </div>
                    {c.fields.length ? (
                      <div className="twrap diff">
                        <table>
                          <thead>
                            <tr><th>Field</th><th>Before</th><th>After</th></tr>
                          </thead>
                          <tbody>
                            {c.fields.map((f) => (
                              <tr key={f.column}>
                                <td className="sub">{f.column.replaceAll("_", " ")}</td>
                                <td className="before">{f.before ? <del>{f.before}</del> : <span className="sub">—</span>}</td>
                                <td className="after">{f.after ? <ins>{f.after}</ins> : <span className="sub">(cleared)</span>}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <span className="sub">No field changes against the live product.</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="sub">No SKUs in this submission.</p>
            )}
          </div>

          <div className="d-sec">
            <h3>History</h3>
            <div className="timeline">
              {s.events.map((e, i) => (
                <div className="tl done" key={`${e.createdAt}-${i}`}>
                  <i />
                  <div>
                    <strong>{SUBMISSION_STATUS[e.status]?.[0] ?? e.status}</strong>
                    <span className="sub">
                      {whenText(e.createdAt)}
                      {e.actorEmail ? ` · ${e.actorEmail}` : ""}
                    </span>
                    {e.note ? <div style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>{e.note}</div> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Drawer>
  );
}
