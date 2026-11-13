"use client";
import Link from "next/link";
import { useState } from "react";
import { Ico, KIND, LoadError, Loading, SubmissionPill, fmtDate, rel, useLoad } from "@/components/seller/ui";
import { useTitle } from "@/components/seller/useSellerSession";
import sellerService from "@/services/seller/seller.service";
import type { SubmissionStatus } from "@/types/api/seller.types";

const TABS: [SubmissionStatus | "", string][] = [
  ["", "All"],
  ["SUBMITTED", "Submitted"],
  ["IN_REVIEW", "In review"],
  ["CHANGES_REQUESTED", "Changes requested"],
  ["APPROVED", "Approved"],
  ["REJECTED", "Not approved"],
  ["WITHDRAWN", "Withdrawn"],
];
const SIZE = 25;

export default function SubmissionsPage() {
  useTitle("Submissions");
  const [status, setStatus] = useState<SubmissionStatus | "">("");
  const [page, setPage] = useState(0);
  const { data, error, loading, reload } = useLoad(
    () => sellerService.submissions({ page, size: SIZE, status: status || undefined, sort: "submittedAt,desc" }),
    [status, page]
  );

  return (
    <>
      <div className="sp-ph">
        <div>
          <h1>Submissions</h1>
          <p>Everything you&apos;ve sent to our catalog team: new products, changes and delisting requests, with their review status.</p>
        </div>
        <Link className="sp-btn sp-btn-pri" href="/merchant/add">
          <Ico name="plus" />
          Add products
        </Link>
      </div>
      <div className="sp-panel">
        <div className="sp-ptools">
          <div className="sp-tabs" role="tablist" aria-label="Filter by status">
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
              </button>
            ))}
          </div>
        </div>
        {error ? (
          <div style={{ padding: 16 }}>
            <LoadError error={error} onRetry={reload} what="your submissions" />
          </div>
        ) : loading && !data ? (
          <Loading />
        ) : (
          <div className="sp-tw">
            <table className="sp-resp">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Sent</th>
                  <th>Decided</th>
                </tr>
              </thead>
              <tbody>
                {data?.content.length ? (
                  data.content.map((s) => (
                    <tr key={s.reference}>
                      <td>
                        <Link className="sp-mono" href={`/merchant/submissions/${s.reference}`}>
                          {s.reference}
                        </Link>
                      </td>
                      <td className="sp-c-wide">
                        <b style={{ color: "var(--navy)" }}>{s.productName}</b>
                        <small className="sp-muted" style={{ display: "block" }}>
                          <span className="sp-mono">{s.parentProductCode}</span>
                          {s.skus.length ? ` · ${s.skus.length} SKU${s.skus.length === 1 ? "" : "s"}` : ""} · {s.source === "UPLOAD" ? "Upload" : "Form"}
                        </small>
                      </td>
                      <td>{KIND[s.kind]}</td>
                      <td>
                        <SubmissionPill status={s.status} />
                      </td>
                      <td className="sp-num">{rel(s.submittedAt)}</td>
                      <td className="sp-num">{s.decidedAt ? fmtDate(s.decidedAt) : <span className="sp-muted">—</span>}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", color: "var(--muted)", padding: 32 }}>
                      {status ? "No submissions with this status." : "You haven't submitted anything yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {data && data.totalPages > 1 ? (
          <div className="sp-pager">
            <span>
              Page {data.number + 1} of {data.totalPages} · {data.totalElements} submissions
            </span>
            <span style={{ display: "flex", gap: 6 }}>
              <button type="button" className="sp-btn sp-btn-sec sp-btn-sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              <button type="button" className="sp-btn sp-btn-sec sp-btn-sm" disabled={page + 1 >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </span>
          </div>
        ) : null}
      </div>
    </>
  );
}
