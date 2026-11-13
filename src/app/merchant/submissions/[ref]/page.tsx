"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Ico, KIND, LoadError, Loading, SUBMISSION, SubmissionPill, errorText, fmtDate, rel, reviewBy, statusOf, useLoad } from "@/components/seller/ui";
import { useTitle } from "@/components/seller/useSellerSession";
import sellerService from "@/services/seller/seller.service";

const EVENT: Record<string, string> = {
  SUBMITTED: "Submitted",
  IN_REVIEW: "Review started",
  CHANGES_REQUESTED: "Changes requested",
  APPROVED: "Approved",
  REJECTED: "Not approved",
  WITHDRAWN: "Withdrawn",
};

export default function SubmissionDetailPage() {
  const params = useParams<{ ref: string }>();
  const ref = String(params?.ref ?? "").toUpperCase();
  useTitle(ref || "Submission");
  const { data: s, error, loading, reload } = useLoad(() => sellerService.submission(ref), [ref]);
  const [busy, setBusy] = useState(false);

  const withdraw = async () => {
    if (!s || !window.confirm(`Withdraw ${s.reference}? ${s.kind === "NEW_PRODUCT" ? "The product stays a draft." : "Nothing changes on the store."}`)) return;
    setBusy(true);
    try {
      await sellerService.withdraw(s.reference);
      toast.success("Submission withdrawn");
      void reload();
    } catch (e) {
      toast.error(errorText(e, "We couldn't withdraw it."));
    } finally {
      setBusy(false);
    }
  };

  if (loading && !s) return <Loading />;
  if (error) {
    return statusOf(error) === 404 ? (
      <div className="sp-empty">
        <Ico name="doc" />
        <p>We couldn&apos;t find submission {ref}.</p>
        <Link href="/merchant/submissions">All submissions</Link>
      </div>
    ) : (
      <LoadError error={error} onRetry={reload} what="this submission" />
    );
  }
  if (!s) return null;
  const canWithdraw = s.status === "SUBMITTED" || s.status === "CHANGES_REQUESTED";
  const canFix = s.status === "CHANGES_REQUESTED" && s.kind !== "DELIST";

  return (
    <>
      <p className="sp-crumb">
        <Link href="/merchant/submissions">Submissions</Link> / {s.reference}
      </p>
      <div className="sp-ph">
        <div>
          <h1>{s.productName}</h1>
          <p>
            <span className="sp-mono">{s.reference}</span> · {KIND[s.kind]} · sent {rel(s.submittedAt)} <SubmissionPill status={s.status} />
          </p>
        </div>
        <div className="sp-ph-a">
          {canFix ? (
            <Link className="sp-btn sp-btn-pri" href={`/merchant/add/product?edit=${s.parentProductId}`}>
              Fix and resubmit
            </Link>
          ) : null}
          {canWithdraw ? (
            <button type="button" className="sp-btn sp-btn-sec" disabled={busy} onClick={withdraw}>
              Withdraw
            </button>
          ) : null}
          <Link className="sp-btn sp-btn-ghost" href={`/merchant/products?open=${s.parentProductId}`}>
            View product <Ico name="right" />
          </Link>
        </div>
      </div>

      {s.status === "SUBMITTED" || s.status === "IN_REVIEW" ? (
        <div className="sp-alert sp-alert-info" style={{ marginBottom: 16 }}>
          <Ico name="clock" />
          <span>
            {s.status === "IN_REVIEW" ? "Our catalog team is reviewing it now, so it can't be changed or withdrawn until they decide." : "Waiting in the review queue."}{" "}
            We reply by {reviewBy(s.submittedAt)}.
          </span>
        </div>
      ) : null}
      {s.reviewNote ? (
        <div className={`sp-alert sp-alert-${SUBMISSION[s.status].tone === "ok" ? "ok" : SUBMISSION[s.status].tone === "bad" ? "bad" : "warn"}`} style={{ marginBottom: 16 }}>
          <Ico name="doc" />
          <span>
            <b>Note from the catalog team:</b> {s.reviewNote}
          </span>
        </div>
      ) : null}

      <div className="sp-dgrid">
        <section className="sp-card" aria-labelledby="chH" style={{ gridColumn: "1 / -1" }}>
          <div className="sp-ch">
            <h2 id="chH">{s.kind === "EDIT" ? "What changes" : s.kind === "DELIST" ? "What's delisted" : "What's submitted"}</h2>
          </div>
          {s.changes.length ? (
            s.changes.map((c) => (
              <div key={c.sku} style={{ marginTop: 12 }}>
                <p style={{ fontSize: 14, marginBottom: 6 }}>
                  <b className="sp-mono">{c.sku}</b> <span className="sp-muted">· {c.action === "ADD" ? "new" : c.action === "DELIST" ? "delist" : "update"}</span>
                </p>
                {c.fields.length ? (
                  <div className="sp-tw sp-panel">
                    <table>
                      <thead>
                        <tr>
                          <th>Field</th>
                          {c.action === "ADD" ? null : <th>Live now</th>}
                          <th>{c.action === "ADD" ? "Value" : "Your change"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {c.fields.map((f) => (
                          <tr key={f.column}>
                            <td className="sp-mono" style={{ whiteSpace: "nowrap" }}>
                              {f.column}
                            </td>
                            {c.action === "ADD" ? null : <td className="sp-muted" style={{ wordBreak: "break-word" }}>{f.before || "—"}</td>}
                            <td style={{ wordBreak: "break-word" }}>
                              <b>{f.after || "—"}</b>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="sp-muted" style={{ fontSize: 13 }}>
                    No differences from the live version.
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="sp-muted" style={{ fontSize: 13 }}>
              Nothing to show.
            </p>
          )}
        </section>

        <section className="sp-card" aria-labelledby="hiH">
          <div className="sp-ch">
            <h2 id="hiH">History</h2>
          </div>
          <ol className="sp-timeline" style={{ marginTop: 10 }}>
            {s.events.map((e, i) => (
              <li key={i}>
                <span className={`sp-fd sp-${SUBMISSION[e.status]?.tone === "off" ? "info" : SUBMISSION[e.status]?.tone ?? "info"}`}>
                  <Ico name={e.status === "APPROVED" ? "check" : e.status === "REJECTED" ? "x" : e.status === "CHANGES_REQUESTED" ? "doc" : "clock"} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <p>
                    <b>{EVENT[e.status] ?? e.status}</b>
                    {e.note ? ` · ${e.note}` : ""}
                  </p>
                  <small>
                    {fmtDate(e.createdAt)} · {rel(e.createdAt)}
                  </small>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="sp-card" aria-labelledby="dtH">
          <div className="sp-ch">
            <h2 id="dtH">Details</h2>
          </div>
          <dl className="sp-kv" style={{ marginTop: 10 }}>
            <dt>Product code</dt>
            <dd className="sp-mono">{s.parentProductCode}</dd>
            <dt>Sent from</dt>
            <dd>{s.source === "UPLOAD" ? `Upload${s.fileName ? ` · ${s.fileName}` : ""}` : "Form"}</dd>
            <dt>Sent</dt>
            <dd>{fmtDate(s.submittedAt)}</dd>
            {s.decidedAt ? (
              <>
                <dt>Decided</dt>
                <dd>{fmtDate(s.decidedAt)}</dd>
              </>
            ) : null}
            {s.sellerNote ? (
              <>
                <dt>Your note</dt>
                <dd style={{ whiteSpace: "pre-wrap", fontWeight: 400 }}>{s.sellerNote}</dd>
              </>
            ) : null}
          </dl>
        </section>
      </div>
    </>
  );
}
