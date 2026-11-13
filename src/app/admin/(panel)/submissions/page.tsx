"use client";
import "../../_styles/catalog-review.css";
import { useCallback, useEffect, useState } from "react";
import adminService from "@/services/admin/admin.service";
import reviewQueueService from "@/services/admin/reviewQueue.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type { SellerStockAlert, SubmissionDetail, SubmissionKind } from "@/types/api/admin.types";
import type { QueueCheck, QueueCounts, QueueDecision, QueueItem, QueueItemDetail, QueueView } from "@/types/api/reviewQueue.types";
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
  useDebounced,
  usePageTitle,
  whenText,
} from "@/components/admin/ui";

const SIZE = 25;
const TABS: Array<{ key: QueueView; label: string; count: keyof QueueCounts }> = [
  { key: "all", label: "All", count: "all" },
  { key: "mine", label: "Assigned to me", count: "mine" },
  { key: "new", label: "New products", count: "new" },
  { key: "price", label: "Price changes", count: "price" },
  { key: "delist", label: "Delisting", count: "delist" },
  { key: "flagged", label: "Flagged", count: "flagged" },
  { key: "due", label: "Due soon & overdue", count: "due" },
  { key: "reviewed", label: "Reviewed by me", count: "reviewed" },
];
const KIND_LABEL: Record<SubmissionKind, string> = { NEW_PRODUCT: "New product", EDIT: "Edit", DELIST: "Delisting" };
const TYPE: Record<QueueItem["type"], [string, string]> = {
  new: ["p-info", "New product"],
  edit: ["p-grey", "Edit"],
  price: ["p-warn", "Price change"],
  delist: ["p-bad", "Delisting"],
};
/** Queue-row flag text per check, as in the design. */
const FLAG: Record<string, string> = {
  required: "Missing required fields",
  duplicates: "Possible duplicate",
  brand: "Restricted brand",
  price_change: "Big price change",
  margin: "Below margin floor",
  mrp: "Price above MRP",
  stock_on_hand: "Stock still on hand",
};
const ACTION_LABEL: Record<string, string> = { UPDATE: "Changed", ADD: "New SKU", DELIST: "Taken off sale" };
const FIX_OPTIONS = ["Photos", "Title", "Description", "Price", "Category", "Fiber content", "Country of origin", "Weight or size", "Other"];
const REJECT_REASONS = [
  "Restricted or counterfeit brand",
  "Prohibited product",
  "Duplicate of an existing listing",
  "Price looks like an error",
  "Doesn’t meet quality standards",
  "Other",
];

const usd = (n: number) => `$${n.toFixed(2)}`;
const signed = (p: number) => `${p >= 0 ? "+" : "−"}${Math.abs(p).toFixed(1)}%`;

function SlaText({ item }: { item: QueueItem }) {
  const s = item.sla;
  if (!s) return <span className="sub">—</span>;
  const pct = Math.min(100, (s.businessHours / 48) * 100);
  const colour = s.state === "overdue" ? "var(--bad)" : s.state === "due_soon" ? "var(--warn)" : "var(--leaf)";
  const days = Math.ceil(s.hoursLeft / 24);
  return (
    <>
      {s.state === "overdue" ? (
        <span><span className="over">Overdue</span> <span className="sub">by {Math.ceil(-s.hoursLeft)} h</span></span>
      ) : s.state === "due_soon" ? (
        <span className="soon">Due in {Math.ceil(s.hoursLeft)} h</span>
      ) : (
        <span>Due in {days} business day{days === 1 ? "" : "s"}</span>
      )}
      <div className="sla-bar" aria-hidden="true"><i style={{ width: `${pct}%`, background: colour }} /></div>
    </>
  );
}

function Flags({ checks }: { checks: QueueCheck[] }) {
  const notPassed = checks.filter((c) => c.status !== "pass");
  if (!checks.length) return <span className="sub">—</span>;
  return (
    <div className="flags">
      {notPassed.length ? (
        notPassed.map((c) => (
          <span key={c.key} className={`pill ${c.status === "fail" ? "p-bad" : "p-warn"}`} title={c.detail}>
            {FLAG[c.key] ?? c.label}
          </span>
        ))
      ) : (
        <span className="pill p-ok">All checks passed</span>
      )}
    </div>
  );
}

/** The catalog team's review queue: every customer-facing change from sellers, oldest first. */
export default function AdminSubmissionsPage() {
  usePageTitle("Review queue");
  const [tab, setTab] = useState<QueueView>("all");
  const [kind, setKind] = useState<SubmissionKind | "">("");
  const [merchantId, setMerchantId] = useState("");
  const [q, setQ] = useState("");
  const debouncedQ = useDebounced(q.trim(), 300);
  const [merchants, setMerchants] = useState<Array<{ id: string; label: string }>>([]);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<QueueItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [counts, setCounts] = useState<QueueCounts | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const { isAdmin } = useAdminSession();

  const load = useCallback(async () => {
    setError(null);
    try {
      const [list, c] = await Promise.all([
        reviewQueueService.list({
          view: tab,
          kind: kind || undefined,
          merchantId: merchantId || undefined,
          q: debouncedQ || undefined,
          page,
          size: SIZE,
        }),
        reviewQueueService.counts(),
      ]);
      const data = list.data.data!;
      setRows(data.content);
      setTotal(data.totalElements);
      setPages(data.totalPages);
      setCounts(c.data.data);
      setSelected((s) => new Set(Array.from(s).filter((ref) => data.content.some((r) => r.reference === ref && r.sla))));
      // Sellers seen in the queue, for the filter when the account list isn't available.
      setMerchants((m) => {
        const seen = new Map(m.map((x) => [x.id, x]));
        data.content.forEach((r) => seen.has(r.merchant.id) || seen.set(r.merchant.id, { id: r.merchant.id, label: r.merchant.fullName || r.merchant.email }));
        return seen.size === m.length ? m : Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label));
      });
    } catch (err) {
      setRows([]);
      setError(getApiErrorMessage(err, "Couldn't load the review queue"));
    }
  }, [tab, kind, merchantId, debouncedQ, page]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    setPage(0);
    setSelected(new Set());
  }, [tab, kind, merchantId, debouncedQ]);

  // Admins can list every seller account; catalog staff fall back to the sellers in the queue.
  useEffect(() => {
    if (!isAdmin) return;
    adminService
      .listCustomers({ role: "ROLE_MERCHANT", size: 100, sort: "fullName,asc" })
      .then((r) => setMerchants((r.data.data?.content ?? []).map((m) => ({ id: m.id, label: m.fullName || m.email }))))
      .catch(() => {});
  }, [isAdmin]);

  const changed = () => {
    load();
    refreshAdminCounts();
  };

  const claim = async (ref: string) => {
    try {
      await adminService.claimSubmission(ref);
      toast("Assigned to you");
      changed();
    } catch (err) {
      toast(getApiErrorMessage(err, "Couldn't assign it"), true);
    }
  };

  const reviewed = tab === "reviewed";
  const selItems = (rows ?? []).filter((r) => selected.has(r.reference));
  const oneBatch = selItems.length > 0 && selItems.every((i) => i.batch && i.batch === selItems[0].batch);
  const anyFlagged = selItems.some((i) => i.flagged);
  const bulkReady = oneBatch && !anyFlagged;
  const toggle = (ref: string, on: boolean) =>
    setSelected((s) => {
      const n = new Set(s);
      if (on) n.add(ref);
      else n.delete(ref);
      return n;
    });

  const bulkApprove = async () => {
    setBusy(true);
    try {
      const res = await reviewQueueService.bulkApprove(Array.from(selected));
      const r = res.data.data!;
      toast(
        r.skipped ? `${r.approved} approved, ${r.skipped} skipped: ${r.results.find((x) => !x.approved)?.error ?? ""}` : `${r.approved} products approved and live`,
        r.skipped > 0,
      );
      setSelected(new Set());
      changed();
    } catch (err) {
      toast(getApiErrorMessage(err, "Couldn't approve the selection"), true);
    } finally {
      setBusy(false);
    }
  };

  const openNext = (current: string, fallback: string | null) => {
    const list = (rows ?? []).filter((r) => r.sla);
    const at = list.findIndex((r) => r.reference === current);
    const next = at >= 0 ? list[at + 1]?.reference ?? null : fallback;
    setOpen(next ?? fallback);
  };

  return (
    <section aria-labelledby="h-subs">
      <div className="page-head">
        <div>
          <h1 id="h-subs">Review queue</h1>
          <p>
            Every customer-facing change from sellers. We commit to a decision within <b>2 business days</b> of submission, oldest first.
            Nothing reaches customers until it&apos;s approved.
          </p>
        </div>
      </div>

      <div className="stats" aria-label="Queue summary">
        <button className="stat" aria-pressed={tab === "all"} onClick={() => setTab("all")}>
          <span><i style={{ background: "var(--navy)" }} />Waiting</span>
          <b>{counts ? counts.all : "…"}</b>
          <small>{counts ? `${counts.mine} assigned to me` : ""}</small>
        </button>
        <button className="stat amber" aria-pressed={tab === "due"} onClick={() => setTab("due")}>
          <span><i style={{ background: "var(--warn)" }} />Due within 1 day</span>
          <b>{counts ? counts.dueSoon : "…"}</b>
          <small>waiting over 1 business day</small>
        </button>
        <button className="stat red" aria-pressed={false} onClick={() => setTab("due")}>
          <span><i style={{ background: "var(--bad)" }} />Overdue</span>
          <b>{counts ? counts.overdue : "…"}</b>
          <small>past the 2-day commitment</small>
        </button>
        <button className="stat" aria-pressed={tab === "reviewed"} onClick={() => setTab("reviewed")}>
          <span><i style={{ background: "var(--leaf)" }} />Reviewed by me today</span>
          <b>{counts ? counts.reviewedToday : "…"}</b>
          <small>approved, changes or rejected</small>
        </button>
      </div>

      {counts && counts.overdue > 0 ? (
        <div className="callout bad" style={{ marginBottom: 14 }} role="alert">
          <Icon name="alert" />
          <span>
            <b>{counts.overdue} item{counts.overdue > 1 ? "s are" : " is"} past the 2-day commitment.</b> Review{" "}
            {counts.overdue > 1 ? "them" : "it"} first, or tell the Catalog Manager so we can update the seller.
          </span>
        </div>
      ) : null}

      <div className="panel">
        <div className="tabs" role="tablist" aria-label="Queue views">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}>
              {t.label}
              <span className="c">{counts ? counts[t.count] : "…"}</span>
            </button>
          ))}
        </div>
        <div className="toolbar">
          <label className="search">
            <Icon name="search" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search product, SKU, reference or seller" aria-label="Search" />
          </label>
          <select className="sel" aria-label="Type" value={kind} onChange={(e) => setKind(e.target.value as SubmissionKind | "")}>
            <option value="">All types</option>
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
        {selItems.length ? (
          <div className="bulk show">
            <b>{selItems.length} selected</b>
            <span className="sub">
              {oneBatch ? `from upload ${selItems[0].fileName}` : "Bulk approve works within one upload batch"}
            </span>
            {oneBatch && anyFlagged ? <span className="warn-text">Flagged items must be reviewed one by one</span> : null}
            <button className="btn btn-primary btn-sm" disabled={!bulkReady || busy} onClick={bulkApprove}>
              <Icon name="check" />
              {busy ? "Approving…" : `Approve ${selItems.length}`}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelected(new Set())}>Clear</button>
          </div>
        ) : null}
        <div className="twrap">
          {reviewed ? (
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Type</th>
                  <th>Decision</th>
                  <th>Reason / note</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {rows === null ? (
                  <tr className="loading-row"><td colSpan={5}>Loading…</td></tr>
                ) : error ? (
                  <tr className="empty-row"><td colSpan={5}><span className="err-text">{error}</span></td></tr>
                ) : rows.length === 0 ? (
                  <tr className="empty-row"><td colSpan={5}>No decisions yet.</td></tr>
                ) : (
                  rows.map((s) => (
                    <tr key={s.reference} className="click" tabIndex={0} onClick={() => setOpen(s.reference)} onKeyDown={(e) => e.key === "Enter" && setOpen(s.reference)}>
                      <td className="wrap">
                        <strong>{s.productName}</strong>
                        <div className="sub">{s.merchant.fullName} · {s.reference}</div>
                      </td>
                      <td><span className={`pill ${TYPE[s.type][0]}`}>{TYPE[s.type][1]}</span></td>
                      <td><SubmissionPill status={s.status} /></td>
                      <td className="wrap" style={{ maxWidth: 360, whiteSpace: "pre-wrap" }}>{s.reviewNote || "—"}</td>
                      <td className="sub">{whenText(s.decidedAt ?? s.updatedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40 }}><span className="sr-only">Select</span></th>
                  <th>Item</th>
                  <th>Type</th>
                  <th>Seller</th>
                  <th>Checks</th>
                  <th>Waiting</th>
                  <th>Reviewer</th>
                </tr>
              </thead>
              <tbody>
                {rows === null ? (
                  <tr className="loading-row"><td colSpan={7}>Loading the queue…</td></tr>
                ) : error ? (
                  <tr className="empty-row"><td colSpan={7}><span className="err-text">{error}</span></td></tr>
                ) : rows.length === 0 ? (
                  <tr className="empty-row">
                    <td colSpan={7}>{tab === "all" && !kind && !merchantId && !debouncedQ ? "The queue is empty. Nice work." : "Nothing matches these filters."}</td>
                  </tr>
                ) : (
                  rows.map((s) => {
                    const d = dateTime(s.submittedAt);
                    return (
                      <tr
                        key={s.reference}
                        className={`click ${selected.has(s.reference) ? "selected" : ""}`}
                        tabIndex={0}
                        onClick={() => setOpen(s.reference)}
                        onKeyDown={(e) => e.key === "Enter" && setOpen(s.reference)}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="chk"
                            checked={selected.has(s.reference)}
                            onChange={(e) => toggle(s.reference, e.target.checked)}
                            aria-label={`Select ${s.productName}`}
                          />
                        </td>
                        <td className="wrap">
                          <strong>{s.productName}</strong>
                          <div className="sub">
                            <code>{s.parentProductCode}</code> · {s.reference}
                            {s.fileName ? ` · ${s.fileName}` : ""}
                          </div>
                        </td>
                        <td>
                          <span className={`pill ${TYPE[s.type][0]}`}>{TYPE[s.type][1]}</span>
                          {s.priceChange ? (
                            <div className="sub" style={{ marginTop: 3 }}>
                              {usd(s.priceChange.from)} → <b>{usd(s.priceChange.to)}</b>{" "}
                              <span className={s.priceChange.percent < 0 ? "dn" : "up"}>{signed(s.priceChange.percent)}</span>
                            </div>
                          ) : null}
                        </td>
                        <td>{s.merchant.fullName}<div className="sub">{s.merchant.email}</div></td>
                        <td><Flags checks={s.checks} /></td>
                        <td className="sla-cell">
                          <SlaText item={s} />
                          <span className="sub">Submitted {d.date}, {d.time}</span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {s.assignedToMe ? (
                            <span className="pill p-info">Me</span>
                          ) : s.reviewer ? (
                            <span className="sub">{s.reviewer.fullName || s.reviewer.email}</span>
                          ) : s.status === "SUBMITTED" ? (
                            <button className="btn btn-secondary btn-sm" onClick={() => claim(s.reference)}>Assign to me</button>
                          ) : (
                            <span className="sub">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="tfoot">
          <span>{rows ? rangeText(page, SIZE, rows.length, total, reviewed ? "decisions" : "items · oldest first") : ""}</span>
          <Pager page={page} pages={pages} onPage={setPage} />
        </div>
      </div>

      <StockAlerts />

      <ReviewDrawer
        reference={open}
        onClose={() => setOpen(null)}
        onOpen={setOpen}
        onDecided={(ref, next) => {
          changed();
          if (next !== undefined) openNext(ref, next);
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

function ReviewDrawer({
  reference,
  onClose,
  onOpen,
  onDecided,
}: {
  reference: string | null;
  onClose: () => void;
  onOpen: (ref: string) => void;
  /** `next` set: "Approve and open next" (null when there's nothing after it). */
  onDecided: (ref: string, next?: string | null) => void;
}) {
  const [s, setS] = useState<SubmissionDetail | null>(null);
  const [item, setItem] = useState<QueueItemDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState<QueueDecision | null>(null);
  const [note, setNote] = useState("");
  const [fixes, setFixes] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [formErr, setFormErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchAll = useCallback(async (ref: string) => {
    const [detail, insight] = await Promise.all([adminService.getSubmission(ref), reviewQueueService.item(ref)]);
    setS(detail.data.data);
    setItem(insight.data.data);
  }, []);

  useEffect(() => {
    setS(null);
    setItem(null);
    setError(null);
    setDecision(null);
    if (!reference) return;
    fetchAll(reference).catch((err) => setError(getApiErrorMessage(err, "Couldn't load the submission")));
  }, [reference, fetchAll]);

  const choose = (d: QueueDecision | null) => {
    setDecision(d);
    setNote("");
    setFixes([]);
    setReason("");
    setFormErr(null);
  };

  const claim = async () => {
    if (!s) return;
    setBusy(true);
    try {
      await adminService.claimSubmission(s.reference);
      await fetchAll(s.reference);
      toast(`${s.reference} is in review with you`);
      onDecided(s.reference);
    } catch (err) {
      toast(getApiErrorMessage(err, "Couldn't assign it"), true);
    } finally {
      setBusy(false);
    }
  };

  const decide = async (andNext: boolean) => {
    if (!s || !decision) return;
    const text = note.trim();
    if (decision === "request-changes" && (!fixes.length || text.length < 5)) {
      setFormErr(`${!fixes.length ? "Choose what needs fixing" : ""}${!fixes.length && text.length < 5 ? " and " : ""}${text.length < 5 ? "add a note the seller can act on" : ""}`);
      return;
    }
    if (decision === "reject" && !reason) {
      setFormErr("Choose a reason");
      return;
    }
    if (decision === "reject" && reason === "Other" && text.length < 5) {
      setFormErr("Explain the reason to the seller");
      return;
    }
    setBusy(true);
    try {
      await reviewQueueService.decide(s.reference, {
        decision,
        note: text || undefined,
        fixes: decision === "request-changes" ? fixes : undefined,
        reason: decision === "reject" ? reason : undefined,
      });
      toast(
        decision === "approve"
          ? "Approved. The seller has been notified."
          : decision === "reject"
            ? "Rejected. The seller has been notified."
            : "Sent back with your notes.",
      );
      choose(null);
      if (andNext) {
        onDecided(s.reference, item?.next ?? null);
      } else {
        await fetchAll(s.reference);
        onDecided(s.reference);
      }
    } catch (err) {
      toast(getApiErrorMessage(err, "Couldn't save the decision"), true);
    } finally {
      setBusy(false);
    }
  };

  const isOpen = !!s && (s.status === "SUBMITTED" || s.status === "IN_REVIEW");
  const blocked = !!item?.blocked;

  return (
    <Drawer
      open={!!reference}
      onClose={onClose}
      title={s ? s.productName : "Submission"}
      sub={
        s ? (
          <span className="badges">
            {item ? <span className={`pill ${TYPE[item.type][0]}`}>{TYPE[item.type][1]}</span> : null}
            <SubmissionPill status={s.status} />
            <span>{s.reference}</span>
          </span>
        ) : null
      }
      foot={
        isOpen && !decision ? (
          <>
            {item?.previous ? (
              <button className="btn btn-secondary btn-sm" onClick={() => onOpen(item.previous!)} aria-label="Previous item">‹</button>
            ) : null}
            {item?.next ? (
              <button className="btn btn-secondary btn-sm" onClick={() => onOpen(item.next!)} aria-label="Next item">›</button>
            ) : null}
            {s!.status === "SUBMITTED" ? (
              <button className="btn btn-secondary" onClick={claim} disabled={busy}>Assign to me</button>
            ) : null}
            <button className="btn btn-danger" onClick={() => choose("reject")} disabled={busy}>Reject</button>
            <button className="btn btn-secondary" onClick={() => choose("request-changes")} disabled={busy}>Request changes</button>
            <button className="btn btn-primary" onClick={() => choose("approve")} disabled={busy || blocked} title={blocked ? "A required check failed" : undefined}>
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
          {item?.sla && isOpen ? (
            <div className="d-sec">
              <div className="sla-cell" style={{ maxWidth: 260 }}>
                <SlaText item={item} />
              </div>
            </div>
          ) : null}

          {isOpen && blocked && !decision ? (
            <div className="d-sec">
              <div className="callout bad">
                <Icon name="alert" />
                <span>A required check failed. Request changes or reject. It can&apos;t be approved as it is.</span>
              </div>
            </div>
          ) : null}

          {decision ? (
            <div className={`d-sec actbox ${decision === "reject" ? "bad" : ""}`}>
              <div className="form">
                {decision === "approve" ? (
                  <>
                    <strong>Approve {s.reference}</strong>
                    <p className="sub">
                      {s.kind === "DELIST"
                        ? "The product is hidden and the listing is closed."
                        : s.kind === "EDIT"
                          ? "The pending version replaces the live one. Stock isn't touched."
                          : "The product goes live on the store."}{" "}
                      The seller is notified.
                    </p>
                    <div className="fld">
                      <label htmlFor="rqNote">Note to seller (optional)</label>
                      <textarea className="inp" id="rqNote" value={note} maxLength={1800} onChange={(e) => setNote(e.target.value)} />
                    </div>
                  </>
                ) : decision === "request-changes" ? (
                  <>
                    <strong>Request changes to {s.reference}</strong>
                    <fieldset className="fld" style={{ border: 0, padding: 0, margin: 0 }}>
                      <legend style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>What needs fixing? *</legend>
                      <div className="chips">
                        {FIX_OPTIONS.map((x) => (
                          <label key={x} className="chip">
                            <input
                              type="checkbox"
                              checked={fixes.includes(x)}
                              onChange={(e) => setFixes((f) => (e.target.checked ? [...f, x] : f.filter((y) => y !== x)))}
                            />
                            <span>{x}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    <div className="fld">
                      <label htmlFor="rqNote">Notes for the seller *</label>
                      <textarea
                        className={`inp ${formErr ? "bad" : ""}`}
                        id="rqNote"
                        value={note}
                        maxLength={1800}
                        placeholder="Tell them exactly what to change, e.g. “Main photo is 800 px. Upload one at least 1000 px.”"
                        onChange={(e) => setNote(e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <strong>Reject {s.reference}</strong>
                    <div className="fld">
                      <label htmlFor="rqReason">Reason *</label>
                      <select className={`sel inp ${formErr && !reason ? "bad" : ""}`} id="rqReason" value={reason} onChange={(e) => setReason(e.target.value)}>
                        <option value="">Choose a reason</option>
                        {REJECT_REASONS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <div className="fld">
                      <label htmlFor="rqNote">Message to seller (recommended)</label>
                      <textarea className="inp" id="rqNote" value={note} maxLength={1800} onChange={(e) => setNote(e.target.value)} />
                    </div>
                    <div className="callout warn">
                      <Icon name="alert" />
                      <span>
                        Rejecting closes this submission. {s.kind === "NEW_PRODUCT" ? "The seller would need to submit it again." : "The live version stays as it is."}
                      </span>
                    </div>
                  </>
                )}
                {formErr ? <span className="err-text">{formErr}</span> : <span className="hint sub">The seller gets this by email. Your name and the time are saved with the decision.</span>}
                <div className="actrow">
                  <button className="btn btn-secondary btn-sm" onClick={() => choose(null)} disabled={busy}>Back</button>
                  {decision === "approve" && item?.next ? (
                    <button className="btn btn-secondary btn-sm" onClick={() => decide(false)} disabled={busy}>Approve</button>
                  ) : null}
                  <button
                    className={`btn btn-sm ${decision === "reject" ? "btn-danger" : "btn-primary"}`}
                    onClick={() => decide(decision === "approve" && !!item?.next)}
                    disabled={busy}
                  >
                    {busy
                      ? "Saving…"
                      : decision === "approve"
                        ? item?.next
                          ? "Approve and open next"
                          : "Approve"
                        : decision === "reject"
                          ? "Reject"
                          : "Send back to seller"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {item ? (
            <div className="d-sec">
              <h3>Automatic checks</h3>
              <ul className="checks">
                {item.checks.map((c) => (
                  <li key={c.key} className={c.status}>
                    <span className="ci"><Icon name={c.status === "pass" ? "check" : c.status === "warn" ? "alert" : "close"} /></span>
                    <span>
                      <b>{c.label}</b>
                      <small>{c.detail}</small>
                      <span className="sr-only">{c.status === "pass" ? "passed" : c.status === "warn" ? "needs a look" : "failed"}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="d-sec">
            <h3>Details</h3>
            <dl className="kv">
              <dt>Seller</dt><dd>{s.merchant.fullName}<div className="sub">{s.merchant.email}</div></dd>
              <dt>Product</dt><dd>{s.productName}<div className="sub"><code>{s.parentProductCode}</code></div></dd>
              <dt>Sent as</dt><dd>{s.fileName ? <>File <code>{s.fileName}</code></> : s.source === "FORM" ? "Form" : s.source.toLowerCase()}</dd>
              <dt>Submitted</dt><dd>{whenText(s.submittedAt)}</dd>
              <dt>Reviewer</dt><dd>{s.reviewer ? `${s.reviewer.fullName || s.reviewer.email} · since ${whenText(s.reviewStartedAt)}` : "Not assigned"}</dd>
              {s.decidedAt ? (<><dt>Decided</dt><dd>{whenText(s.decidedAt)}</dd></>) : null}
              {s.sellerNote ? (<><dt>Seller&apos;s note</dt><dd style={{ whiteSpace: "pre-wrap" }}>{s.sellerNote}</dd></>) : null}
              {s.reviewNote ? (<><dt>Review note</dt><dd style={{ whiteSpace: "pre-wrap" }}>{s.reviewNote}</dd></>) : null}
            </dl>
          </div>

          <div className="d-sec">
            <h3>{s.kind === "EDIT" ? "Live vs pending" : s.kind === "DELIST" ? "Delisting request" : "New product"} ({s.changes.length} SKU{s.changes.length === 1 ? "" : "s"})</h3>
            {s.kind === "DELIST" ? (
              <div className="callout warn" style={{ marginBottom: 12 }}>
                <Icon name="alert" />
                <span>Approving this hides the product from the store and closes the listing. It can&apos;t be bought after that.</span>
              </div>
            ) : null}
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
                            <tr><th>Field</th><th>Live now</th><th>Pending</th></tr>
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

          {item && s.kind === "EDIT" ? (
            <div className="d-sec">
              <h3>Price history</h3>
              {item.priceHistory.length ? (
                <ul className="ph-list">
                  {item.priceHistory.map((h, i) => (
                    <li key={`${h.at}-${i}`}>
                      <span>
                        <b>{h.action === "price.change_requested" ? "Requested" : "Changed"}</b> · <code>{h.sku}</code> · {h.before ?? "—"} → {h.after ?? "—"}
                        <div className="sub">{whenText(h.at)} · {h.actor ?? "System"} · {h.source}</div>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="sub">No earlier price changes for these SKUs.</p>
              )}
            </div>
          ) : null}

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
