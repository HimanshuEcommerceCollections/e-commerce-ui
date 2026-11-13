"use client";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import supplierService from "@/services/admin/supplier.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type { SupplierDetail as Detail, SupplierDocument } from "@/types/api/supplier.types";
import { Icon, toast, usePageTitle } from "@/components/admin/ui";
import { SCORING, TRACK, daysUntil, shortDay, stagePill, trackIndex } from "./labels";
import { Initials } from "./SupplierApprovals";
import "./suppliers.css";

type Act = (call: () => Promise<{ data: { data: Detail | null } }>, done?: string) => Promise<boolean>;

const fileName = (disposition: string | undefined, fallback: string) => {
  const m = disposition && /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  return m ? decodeURIComponent(m[1]) : fallback;
};

/** Supplier approvals (design: catalog-supplier-approvals): one application. */
export function SupplierDetail({ id }: { id: string }) {
  const [s, setS] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  usePageTitle(s ? `${s.companyName} · Supplier approvals` : "Supplier approvals");

  const load = useCallback(async () => {
    setError(null);
    try {
      setS((await supplierService.get(id)).data.data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Couldn't load the application"));
    }
  }, [id]);
  useEffect(() => {
    load();
  }, [load]);

  /** Runs a change; the response is the updated application. */
  const act: Act = async (call, done) => {
    setBusy(true);
    try {
      const r = await call();
      if (r.data.data) setS(r.data.data);
      if (done) toast(done);
      return true;
    } catch (err) {
      toast(getApiErrorMessage(err, "That didn't work. Try again."), true);
      return false;
    } finally {
      setBusy(false);
    }
  };

  if (!s) {
    return (
      <section className="sup">
        <p className="sup-crumb"><Link href="/admin/seller-applications">Supplier approvals</Link></p>
        {error ? <p className="err-text">{error}</p> : <p className="sub">Loading…</p>}
      </section>
    );
  }

  const [pc, pl] = stagePill(s);
  const { idx, fail } = trackIndex(s.stage);
  const scoring = SCORING.includes(s.stage);
  const showDocs = !scoring && s.stage !== "AUTO_REJECTED" && s.stage !== "DECLINED";

  return (
    <section className="sup" aria-labelledby="h-sup-d">
      <p className="sup-crumb">
        <Link href="/admin/seller-applications">Supplier approvals</Link> / {s.reference}
      </p>
      <div className="panel pad sup-head">
        <div className="sup-dhead">
          <Initials id={s.id} name={s.companyName} size={60} />
          <div className="grow">
            <h1 id="h-sup-d">{s.companyName}</h1>
            <div className="sup-meta">
              <span className={`pill ${pc}`}>{pl}</span>
              <span>{s.contactName}</span>
              <a className="link" href={`mailto:${s.email}`}>{s.email}</a>
              <span>Applied {shortDay(s.submittedAt)}</span>
            </div>
          </div>
        </div>
        <ol className="sup-trk" aria-label="Stage">
          {TRACK.map((t, i) => (
            <li key={t} className={i < idx ? "done" : i === idx ? (fail ? "fail" : "now") : ""} aria-current={i === idx ? "step" : undefined}>
              <i>{i < idx ? "✓" : i === idx && fail ? "✕" : i + 1}</i>
              {t}
            </li>
          ))}
        </ol>
      </div>

      <div className="sup-det">
        <div className="sup-col">
          {s.stage !== "AUTO_REJECTED" ? <Scorecard s={s} act={act} editable={scoring} busy={busy} /> : null}
          {showDocs ? <Documents s={s} act={act} busy={busy} /> : null}
          <Screening s={s} />
          <Application s={s} />
        </div>
        <aside className="sup-decide" aria-label="Decision">
          <section className="panel pad">
            <h2>{s.stage === "APPROVED" || s.stage === "SUSPENDED" ? "Supplier status" : "Decision"}</h2>
            <Decision s={s} act={act} busy={busy} />
          </section>
        </aside>
      </div>
    </section>
  );
}

// ── Scorecard ───────────────────────────────────────────────────────────────

function Scorecard({ s, act, editable, busy }: { s: Detail; act: Act; editable: boolean; busy: boolean }) {
  const sc = s.scorecard;
  const [note, setNote] = useState(sc.note ?? "");
  const [ovScore, setOvScore] = useState(sc.override === null ? "" : String(sc.override));
  const [ovReason, setOvReason] = useState(sc.overrideReason ?? "");
  const [ovOpen, setOvOpen] = useState(sc.override !== null);
  const total = s.score;

  const rate = (key: string, value: number) => act(() => supplierService.saveScorecard(s.id, { [key]: value }));

  return (
    <section className="panel pad">
      <h2>
        Scorecard <span className="sub sup-h-note">SUP-001 · criteria and weights are placeholders</span>
      </h2>
      <div className="twrap sup-sc">
        <table>
          <thead>
            <tr>
              <th>Criterion</th>
              <th>Weight</th>
              <th>Score (1–5)</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {sc.criteria.map((c) => {
              const v = sc.scores[c.key];
              return (
                <tr key={c.key}>
                  <td>
                    <strong>{c.label}</strong>
                    <span className="sub block">{c.description}</span>
                  </td>
                  <td>{c.weight}%</td>
                  <td>
                    {editable ? (
                      <div className="sup-rate" role="radiogroup" aria-label={c.label}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <label key={n}>
                            <input type="radio" name={`r-${c.key}`} value={n} checked={v === n} disabled={busy} onChange={() => rate(c.key, n)} />
                            <span>{n}</span>
                          </label>
                        ))}
                      </div>
                    ) : v ? (
                      <span><b>{v}</b> / 5</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{v ? Math.round((v / 5) * c.weight) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="sup-total">
        <span>Total</span>
        <b className={total === null ? "" : total >= sc.passMark ? "sup-up" : "sup-dn"}>
          {total ?? "—"} <span className="sub">/ 100</span>
        </b>
        <span className="sub">
          Pass mark {sc.passMark}
          {sc.override !== null ? ` · override of the computed ${sc.computed ?? "—"}` : ""}
        </span>
      </div>
      {sc.override !== null && sc.overrideReason ? <p className="sub">Override reason: {sc.overrideReason}</p> : null}
      {sc.scoredBy ? <p className="sub">Scored by {sc.scoredBy} · {shortDay(sc.scoredAt)}</p> : null}
      {editable ? (
        <>
          <div className="fld sup-gap">
            <label htmlFor="snote">
              Notes <span className="sub">(optional, internal)</span>
            </label>
            <textarea
              className="inp"
              id="snote"
              rows={3}
              placeholder="Anything the next reviewer should know"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={() => note !== (sc.note ?? "") && act(() => supplierService.saveScorecard(s.id, {}, note), "Notes saved")}
            />
          </div>
          {ovOpen ? (
            <div className="sup-override">
              <div className="fld">
                <label htmlFor="ovs">Override score</label>
                <input className="inp" id="ovs" type="number" min={0} max={100} value={ovScore} onChange={(e) => setOvScore(e.target.value)} />
              </div>
              <div className="fld grow">
                <label htmlFor="ovr">Reason (recorded with your name)</label>
                <input className="inp" id="ovr" value={ovReason} onChange={(e) => setOvReason(e.target.value)} placeholder="e.g. Strong references from existing buyers" />
              </div>
              <div className="sup-row">
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={busy}
                  onClick={() => {
                    const n = Number(ovScore);
                    if (ovScore === "" || !Number.isInteger(n) || n < 0 || n > 100) return toast("Enter a whole number from 0 to 100", true);
                    if (ovReason.trim().length < 5) return toast("Add a reason for the override", true);
                    act(() => supplierService.overrideScore(s.id, n, ovReason.trim()), "Score override saved");
                  }}
                >
                  Save override
                </button>
                {sc.override !== null ? (
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={busy}
                    onClick={async () => {
                      if (await act(() => supplierService.overrideScore(s.id, null), "Override removed")) {
                        setOvScore("");
                        setOvReason("");
                        setOvOpen(false);
                      }
                    }}
                  >
                    Remove override
                  </button>
                ) : (
                  <button className="btn btn-secondary btn-sm" onClick={() => setOvOpen(false)}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button className="linkish sup-gap" onClick={() => setOvOpen(true)}>
              Override the score
            </button>
          )}
        </>
      ) : null}
    </section>
  );
}

// ── Documents ───────────────────────────────────────────────────────────────

function Documents({ s, act, busy }: { s: Detail; act: Act; busy: boolean }) {
  const waiting = s.view === "docs" && s.stage === "DOCUMENTS";
  const view = async (d: SupplierDocument) => {
    try {
      const r = await supplierService.documentFile(s.id, d.id);
      const url = URL.createObjectURL(r.data);
      const w = window.open(url, "_blank", "noopener");
      if (!w) {
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName(r.headers["content-disposition"], d.fileName);
        a.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      toast(getApiErrorMessage(err, "Couldn't open the file"), true);
    }
  };

  return (
    <section className="panel pad">
      <h2>
        Documents {waiting ? <span className="pill p-warn">Waiting on supplier</span> : null}
      </h2>
      <ul className="sup-docl">
        {s.requiredDocuments.map((r) => (
          <DocRow key={r.type} s={s} expires={r.expires} label={r.label} doc={s.documents.find((d) => d.type === r.type) ?? null} act={act} busy={busy} onView={view} />
        ))}
        <li>
          <span className={`sup-doc-ic${s.resaleCertificateIssuedAt ? " ok" : ""}`}>
            <Icon name={s.resaleCertificateIssuedAt ? "check" : "file"} />
          </span>
          <div className="grow">
            <strong>Form E-595E (from us)</strong>
            <span className="sub block">Our resale certificate, sent to the supplier at approval</span>
          </div>
          <span className="sup-dacts">
            {s.resaleCertificateIssuedAt ? <span className="pill p-ok">Issued</span> : <span className="pill p-grey">At approval</span>}
          </span>
        </li>
      </ul>
      {s.stage === "DOCUMENTS" || s.stage === "APPROVED" ? (
        <button
          className="btn btn-secondary btn-sm sup-gap"
          disabled={busy}
          onClick={() => act(() => supplierService.remind(s.id), `Reminder emailed to ${s.contactName}`)}
        >
          <Icon name="mail" />
          Send reminder to {s.contactName.split(/\s+/)[0]}
        </button>
      ) : null}
      {s.lastReminderAt ? <p className="sub">Last reminder {shortDay(s.lastReminderAt)}</p> : null}
    </section>
  );
}

function DocRow({
  s,
  label,
  expires,
  doc,
  act,
  busy,
  onView,
}: {
  s: Detail;
  label: string;
  expires: boolean;
  doc: SupplierDocument | null;
  act: Act;
  busy: boolean;
  onView: (d: SupplierDocument) => void;
}) {
  const [asking, setAsking] = useState(false);
  const [why, setWhy] = useState("");
  const [expiry, setExpiry] = useState(doc?.expiresAt ?? "");
  useEffect(() => setExpiry(doc?.expiresAt ?? ""), [doc?.expiresAt]);
  const ex = doc?.expiresAt ? daysUntil(doc.expiresAt) : null;
  const verified = doc?.status === "VERIFIED";

  let detail: ReactNode = "Not uploaded yet";
  if (doc) {
    detail = (
      <>
        {doc.fileName} · uploaded {shortDay(doc.uploadedAt)}
        {doc.expiresAt ? (
          <>
            {" "}· expires {shortDay(doc.expiresAt)}
            {ex !== null && ex <= 30 ? <b className="sup-amber"> ({ex < 0 ? "expired" : `in ${ex} days`})</b> : null}
          </>
        ) : null}
        {verified ? ` · verified${doc.reviewedBy ? ` by ${doc.reviewedBy}` : ""}` : ""}
      </>
    );
  }

  let actions: ReactNode = <span className="pill p-grey">Missing</span>;
  if (doc) {
    actions = (
      <>
        <button className="btn btn-secondary btn-sm" onClick={() => onView(doc)}>View</button>
        {doc.status === "PENDING" && !asking ? (
          <>
            {expires ? (
              <input className="inp sup-date" type="date" aria-label={`${label} expiry date`} value={expiry} onChange={(e) => setExpiry(e.target.value)} />
            ) : null}
            <button
              className="btn btn-primary btn-sm"
              disabled={busy}
              onClick={() => {
                if (expires && !expiry) return toast("Add the expiry date before verifying", true);
                act(() => supplierService.verifyDocument(s.id, doc.id, expires ? expiry : undefined), `${label} verified`);
              }}
            >
              <Icon name="check" />
              Verify
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => setAsking(true)}>Ask again</button>
          </>
        ) : null}
        {asking ? (
          <>
            <label className="sr-only" htmlFor={`rj-${doc.id}`}>What’s wrong with it</label>
            <input className="inp sup-ask" id={`rj-${doc.id}`} autoFocus value={why} onChange={(e) => setWhy(e.target.value)} placeholder="e.g. Signature missing on page 2" />
            <button
              className="btn btn-danger btn-sm"
              disabled={busy}
              onClick={async () => {
                if (!why.trim()) return toast("Tell the supplier what to fix", true);
                if (await act(() => supplierService.rejectDocument(s.id, doc.id, why.trim()), "Asked the supplier to upload it again")) {
                  setAsking(false);
                  setWhy("");
                }
              }}
            >
              Send
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setAsking(false)}>Cancel</button>
          </>
        ) : null}
        {verified ? <span className="pill p-ok">Verified</span> : null}
        {doc.status === "EXPIRED" ? <span className="pill p-bad">Expired</span> : null}
      </>
    );
  }

  return (
    <li>
      <span className={`sup-doc-ic${verified ? " ok" : ""}`}>
        <Icon name={verified ? "check" : "file"} />
      </span>
      <div className="grow">
        <strong>{label}</strong>
        <span className="sub block">{detail}</span>
        {doc?.status === "REJECTED" ? <span className="sup-red block">Re-upload requested: {doc.note}</span> : null}
      </div>
      <span className="sup-dacts">{actions}</span>
    </li>
  );
}

// ── Screening and application ───────────────────────────────────────────────

function Screening({ s }: { s: Detail }) {
  return (
    <section className="panel pad">
      <h2>
        Automatic screening <span className="sub sup-h-note">Run on submit</span>
      </h2>
      {s.screening.length ? (
        <ul className="sup-checks">
          {s.screening.map((c) => (
            <li key={c.key} className={c.passed ? "ok" : "bad"}>
              <span className="ci"><Icon name={c.passed ? "check" : "close"} /></span>
              <span>
                <strong>{c.label}</strong>
                <span className="sub block">{c.passed ? "Passed" : "Failed. Critical requirement"}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="sub">Not run: this lead came from the short “Sell with us” form, before the full application existed.</p>
      )}
      {s.stage === "AUTO_REJECTED" ? (
        <div className="note warn sup-gap">
          <Icon name="alert" />
          <span>Auto-rejected. The applicant was told why and can change their answers. No action needed unless you want to override.</span>
        </div>
      ) : null}
      {s.screeningOverriddenBy ? (
        <p className="sub sup-gap">Override by {s.screeningOverriddenBy} · {shortDay(s.screeningOverriddenAt)}</p>
      ) : null}
    </section>
  );
}

function Application({ s }: { s: Detail }) {
  const A = s.form;
  if (!s.hasForm) {
    return (
      <section className="panel pad">
        <h2>Application</h2>
        <dl className="kv">
          <dt>Contact</dt><dd>{s.contactName} · {s.email} · {s.phone}</dd>
          <dt>Address</dt><dd>{s.address || "—"}</dd>
          <dt>Categories</dt><dd>{s.categories.join(", ") || "—"}</dd>
          <dt>Products</dt><dd>{s.legacyProducts || "—"}</dd>
          <dt>Account</dt><dd>{s.account.exists ? `Yes (${s.account.role})` : "Created when they pass the scorecard"}</dd>
        </dl>
      </section>
    );
  }
  return (
    <section className="panel pad">
      <h2>Application</h2>
      <dl className="kv">
        <dt>Legal name</dt><dd>{A.legalName}{A.tradingName ? ` (trading as ${A.tradingName})` : ""}</dd>
        <dt>Contact</dt><dd>{s.contactName} · {s.email} · {A.phone}</dd>
        <dt>EIN</dt><dd className="mono">{A.ein}</dd>
        <dt>Business type</dt><dd>{A.businessType} · {A.yearsInBusiness} years</dd>
        {A.website ? (<><dt>Website</dt><dd><a className="link" href={A.website} target="_blank" rel="noopener noreferrer">{A.website}</a></dd></>) : null}
        <dt>Address</dt><dd>{[A.street, A.city, A.state, A.zip].filter(Boolean).join(", ")}</dd>
        <dt>Categories</dt><dd>{(A.categories ?? []).join(", ")}</dd>
        <dt>Products to list</dt><dd>{A.productCount}</dd>
        <dt>Own brand</dt><dd>{A.ownBrand === "yes" ? "Yes" : A.ownBrand === "both" ? "Both" : "No, other brands"}</dd>
        <dt>Brands</dt><dd>{A.brands}</dd>
        <dt>Warehouse</dt><dd>{A.usWarehouse === "yes" ? `${A.warehouseState}, US` : "Outside the US"}</dd>
        <dt>Ships to</dt><dd>{A.shipsAllStates === "yes" ? "All 50 states" : "Not all 50 states"}</dd>
        <dt>Handling time</dt><dd>{A.handlingTime}{A.carriers?.length ? ` · ${A.carriers.join(", ")}` : ""}</dd>
        <dt>Product data</dt><dd>{s.productDataLabel} · MOQ {A.moq}</dd>
        {A.notes ? (<><dt>Notes</dt><dd>{A.notes}</dd></>) : null}
      </dl>
    </section>
  );
}

// ── Decision panel ──────────────────────────────────────────────────────────

function Decision({ s, act, busy }: { s: Detail; act: Act; busy: boolean }) {
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [suspending, setSuspending] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [e595, setE595] = useState(false);
  const sc = s.scorecard;
  const total = s.score;
  const scored = Object.keys(sc.scores).length;
  const n = sc.criteria.length;

  const declineForm = (
    <div className="fld sup-gap">
      <label htmlFor="dr">
        Reason the applicant will see <span className="req">*</span>
      </label>
      <textarea className="inp" id="dr" rows={3} autoFocus value={reason} onChange={(e) => setReason(e.target.value)} />
      <button
        className="btn btn-danger sup-wide"
        disabled={busy}
        onClick={() => {
          if (reason.trim().length < 5) return toast("Add a reason", true);
          act(() => supplierService.decline(s.id, reason.trim()), "Declined. The applicant has been emailed.");
        }}
      >
        Decline
      </button>
    </div>
  );
  const openDecline = () => {
    setReason(total !== null && total < sc.passMark ? `Score below our threshold (${total} of 100).` : "");
    setDeclining(true);
  };

  if (SCORING.includes(s.stage)) {
    const tone = total === null ? "" : total >= sc.passMark ? "ok" : "warn";
    const hint =
      total === null
        ? `${scored} of ${n} criteria scored`
        : total >= sc.passMark
          ? `${total} / 100 · above the pass mark`
          : `${total} / 100 · below the pass mark of ${sc.passMark}`;
    return (
      <>
        <p>Score all {n} criteria, then decide.</p>
        <div className={`note sup-gap ${tone}`}>
          <Icon name="info" />
          <span>{hint}</span>
        </div>
        <button
          className="btn btn-primary sup-wide"
          disabled={busy || total === null || total < sc.passMark}
          onClick={() => act(() => supplierService.pass(s.id), `Passed. We’ve asked ${s.contactName} for their documents.`)}
        >
          <Icon name="check" />
          Pass and request documents
        </button>
        <button className="btn btn-secondary sup-wide" onClick={openDecline}>
          Decline application
        </button>
        {declining ? declineForm : null}
      </>
    );
  }

  if (s.stage === "DOCUMENTS") {
    const allOk = s.requiredDocuments.every((r) => s.documents.find((d) => d.type === r.type)?.status === "VERIFIED");
    const missing = s.requiredDocuments.filter((r) => {
      const d = s.documents.find((x) => x.type === r.type);
      return !d || d.status === "REJECTED" || d.status === "EXPIRED";
    }).length;
    return (
      <>
        {s.view === "docs" ? (
          <p>
            Passed with <b>{total ?? "—"}</b>. Waiting for {s.contactName} to upload {missing} more document{missing === 1 ? "" : "s"}.
          </p>
        ) : null}
        <ul className="sup-chk2">
          <li className={allOk ? "ok" : ""}><Icon name={allOk ? "check" : "clock"} />All {s.requiredDocuments.length} documents verified</li>
          <li className={e595 ? "ok" : ""}><Icon name="file" />Form E-595E ready</li>
          <li className={total !== null && total >= sc.passMark ? "ok" : ""}><Icon name="check" />Scorecard passed ({total ?? "—"})</li>
        </ul>
        <label className="sup-check">
          <input type="checkbox" className="chk" checked={e595} onChange={(e) => setE595(e.target.checked)} /> Form E-595E ready to issue
        </label>
        <button
          className="btn btn-primary sup-wide"
          disabled={busy || !allOk}
          onClick={() => {
            if (!e595) return toast("Tick “Ready to issue” for Form E-595E first", true);
            act(() => supplierService.approve(s.id), `${s.companyName} is approved. Product upload is unlocked.`);
          }}
        >
          <Icon name="check" />
          Approve supplier
        </button>
        <p className="sub sup-gap">Activates the account and unlocks product upload. Every product is still reviewed.</p>
        <button className="linkish sup-gap" onClick={openDecline}>Decline instead</button>
        {declining ? declineForm : null}
      </>
    );
  }

  if (s.stage === "APPROVED") {
    return (
      <>
        <dl className="kv">
          <dt>Approved</dt><dd>{shortDay(s.approvedAt)}</dd>
          <dt>By</dt><dd>{s.approvedBy ?? "—"}</dd>
          <dt>Score</dt><dd>{total ?? "—"}</dd>
          {s.reinstatedAt ? (<><dt>Reinstated</dt><dd>{shortDay(s.reinstatedAt)}</dd></>) : null}
        </dl>
        <button className="btn btn-danger sup-wide" onClick={() => setSuspending(true)}>Suspend supplier</button>
        {suspending ? (
          <div className="fld sup-gap">
            <label htmlFor="sr">
              Reason <span className="req">*</span>
            </label>
            <select className="inp" id="sr" value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)}>
              <option value="">Choose a reason</option>
              {s.suspensionReasons.map((r) => <option key={r}>{r}</option>)}
            </select>
            <button
              className="btn btn-danger sup-wide"
              disabled={busy}
              onClick={() => {
                if (!suspendReason) return toast("Choose a reason", true);
                act(() => supplierService.suspend(s.id, suspendReason), "Suspended. Their seller access is blocked.");
              }}
            >
              Suspend
            </button>
          </div>
        ) : null}
        <p className="sub sup-gap">Suspending blocks their Seller Portal access until you reinstate them.</p>
      </>
    );
  }

  if (s.stage === "SUSPENDED") {
    return (
      <>
        <div className="note warn">
          <Icon name="alert" />
          <span>Suspended {shortDay(s.suspendedAt)}{s.suspendedBy ? ` by ${s.suspendedBy}` : ""}: {s.suspensionReason}</span>
        </div>
        <button className="btn btn-secondary sup-wide" disabled={busy} onClick={() => act(() => supplierService.reinstate(s.id), "Reinstated")}>
          Reinstate supplier
        </button>
      </>
    );
  }

  if (s.stage === "DECLINED") {
    return (
      <>
        <div className="note warn">
          <Icon name="alert" />
          <span>Declined {shortDay(s.declinedAt)}{s.declinedBy ? ` by ${s.declinedBy}` : ""}: {s.declineReason}</span>
        </div>
        <button className="btn btn-secondary sup-wide" disabled={busy} onClick={() => act(() => supplierService.reopen(s.id), "Reopened for scoring")}>
          Reopen for scoring
        </button>
      </>
    );
  }

  return (
    <>
      <p>The system rejected this automatically.</p>
      <button
        className="btn btn-secondary sup-wide"
        disabled={busy}
        onClick={() => act(() => supplierService.overrideScreening(s.id), "Override recorded. You can now score this application.")}
      >
        Override and score anyway
      </button>
      <p className="sub sup-gap">Overrides are recorded with your name.</p>
    </>
  );
}
