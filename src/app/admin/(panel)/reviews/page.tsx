"use client";
import { useCallback, useEffect, useState } from "react";
import adminService from "@/services/admin/admin.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type { AdminProductReview, ReviewStatus } from "@/types/api/admin.types";
import { refreshAdminCounts } from "@/components/admin/refresh";
import { Icon, Pager, REVIEW_STATUS, Stars, StatusPill, rangeText, toast, usePageTitle, whenText } from "@/components/admin/ui";

const SIZE = 20;
const TABS: Array<{ key: ReviewStatus; label: string }> = [
  { key: "PENDING", label: "Pending" },
  { key: "PUBLISHED", label: "Published" },
  { key: "REJECTED", label: "Rejected" },
];

/** Customer reviews wait here until catalog staff publish them (admins and catalog staff). */
export default function AdminReviewsPage() {
  usePageTitle("Product reviews");
  const [tab, setTab] = useState<ReviewStatus>("PENDING");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<AdminProductReview[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      // Pending: oldest first, like any queue; the rest newest first.
      const r = await adminService.listReviews({ status: tab, page, size: SIZE, sort: tab === "PENDING" ? "createdAt,asc" : "createdAt,desc" });
      const data = r.data.data!;
      setRows(data.content);
      setTotal(data.totalElements);
      setPages(data.totalPages);
    } catch (err) {
      setRows([]);
      setError(getApiErrorMessage(err, "Couldn't load reviews"));
    }
  }, [tab, page]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => setPage(0), [tab]);

  const changed = () => {
    load();
    refreshAdminCounts();
  };

  return (
    <section aria-labelledby="h-reviews">
      <div className="page-head">
        <div>
          <h1 id="h-reviews">Product reviews</h1>
          <p>Customer reviews appear on the store once published. The author is emailed either way.</p>
        </div>
      </div>

      <div className="panel">
        <div className="tabs" role="tablist" aria-label="Review status">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}>
              {t.label}
              {tab === t.key && rows ? <span className="c">{total}</span> : null}
            </button>
          ))}
        </div>
        {rows === null ? (
          <p className="sub pad">Loading reviews…</p>
        ) : error ? (
          <p className="err-text pad">{error}</p>
        ) : rows.length === 0 ? (
          <p className="sub pad">{tab === "PENDING" ? "No reviews waiting. New customer reviews appear here." : "No reviews here."}</p>
        ) : (
          <div className="items flat">
            {rows.map((r) => (
              <ReviewCard key={`${r.id}-${r.status}`} r={r} onChanged={changed} />
            ))}
          </div>
        )}
        <div className="tfoot">
          <span>{rows ? rangeText(page, SIZE, rows.length, total, "reviews") : ""}</span>
          <Pager page={page} pages={pages} onPage={setPage} />
        </div>
      </div>
    </section>
  );
}

function ReviewCard({ r, onChanged }: { r: AdminProductReview; onChanged: () => void }) {
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const act = async (fn: () => Promise<unknown>, done: string) => {
    setBusy(true);
    try {
      await fn();
      toast(done);
      onChanged();
    } catch (err) {
      toast(getApiErrorMessage(err, "Couldn't update the review"), true);
      setBusy(false);
    }
  };

  return (
    <article className="vcard review">
      <div className="review-head">
        <div style={{ minWidth: 0 }}>
          <Stars rating={r.rating} /> <strong style={{ display: "inline" }}>{r.title}</strong>
          <span className="sub">
            {r.productName}
            {r.variant ? ` · ${r.variant}` : ""} · <code>{r.sku}</code>
          </span>
        </div>
        <StatusPill map={REVIEW_STATUS} status={r.status} />
      </div>
      <p className="review-body">{r.body}</p>
      <span className="sub">
        {r.author} ({r.customer.email}){r.verifiedBuyer ? " · verified buyer" : ""} · {r.recommend ? "recommends it" : "doesn't recommend it"} ·{" "}
        {whenText(r.createdAt)}
      </span>
      {r.moderatorNote ? <span className="sub">Note: {r.moderatorNote}</span> : null}
      {rejecting ? (
        <div className="actbox bad">
          <div className="form">
            <div className="fld">
              <label htmlFor={`rj-${r.id}`}>Reason (optional, emailed to the author)</label>
              <input className="inp" id={`rj-${r.id}`} value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="actrow">
              <button className="btn btn-secondary btn-sm" onClick={() => setRejecting(false)} disabled={busy}>Back</button>
              <button
                className="btn btn-danger btn-sm"
                disabled={busy}
                onClick={() => act(() => adminService.rejectReview(r.id, note.trim() || undefined), "Review rejected")}
              >
                {busy ? "Saving…" : "Reject review"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="actrow" style={{ justifyContent: "flex-start" }}>
          {r.status !== "PUBLISHED" ? (
            <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => act(() => adminService.publishReview(r.id), "Review published")}>
              <Icon name="check" />
              Publish
            </button>
          ) : null}
          {r.status !== "REJECTED" ? (
            <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => setRejecting(true)}>
              {r.status === "PUBLISHED" ? "Unpublish…" : "Reject…"}
            </button>
          ) : null}
        </div>
      )}
    </article>
  );
}
