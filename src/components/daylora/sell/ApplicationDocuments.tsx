"use client";

import { useRef, useState } from "react";
import { DayloraIcon } from "../DayloraIcons";
import onboardingService from "@/services/supplier/onboarding.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type { MyApplication, RequiredDocument, SupplierDocument } from "@/types/api/supplier.types";
import { DOC_ACCEPT, MAX_DOC_BYTES, docsDone, fileNameFrom, fileSize, saveBlob } from "./applicationRules";
import { DocIcon, DownloadIcon } from "./icons";

const DESCRIPTION: Record<string, string> = {
  W9: "IRS form with your EIN and legal name. Signed and dated.",
  AGREEMENT: "Download our agreement, sign it and upload it here.",
  INSURANCE: "General liability insurance. We’ll remind you 30 days before it expires.",
};

const PILL: Record<string, [string, string]> = {
  PENDING: ["ok", "Uploaded"],
  VERIFIED: ["ok", "Verified"],
  REJECTED: ["bad", "Upload again"],
  EXPIRED: ["bad", "Expired"],
};

const todayIso = () => new Date().toISOString().slice(0, 10);
const daysTo = (iso: string) => Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${todayIso()}T00:00:00Z`)) / 86_400_000);

/** "Upload your documents": W-9, signed seller agreement, certificate of insurance. */
export function ApplicationDocuments({
  app,
  onChange,
  onLater,
  onSubmitted,
}: {
  app: MyApplication;
  onChange: (a: MyApplication) => void;
  onLater: () => void;
  onSubmitted: () => void;
}) {
  const done = docsDone(app);
  const total = app.requiredDocuments.length;
  const [agreementError, setAgreementError] = useState<string | null>(null);

  const downloadAgreement = async () => {
    setAgreementError(null);
    try {
      const r = await onboardingService.agreement();
      saveBlob(fileNameFrom(r.headers["content-disposition"], "seller-agreement.html"), r.data);
    } catch (err) {
      setAgreementError(getApiErrorMessage(err, "We couldn't download the agreement. Please try again."));
    }
  };

  const replaced = (doc: SupplierDocument) =>
    onChange({ ...app, documents: [...app.documents.filter((d) => d.type !== doc.type), doc] });

  return (
    <>
      <h1 className="obh1" tabIndex={-1}>
        Upload your documents
      </h1>
      <p className="obd">Good news: your application passed our review. Upload these {total} documents and we’ll activate your account.</p>
      <div className="prog" aria-hidden="true">
        <i style={{ width: `${(done / total) * 100}%` }} />
      </div>
      <p className="hint mb">
        {done} of {total} uploaded
      </p>
      <div className="docs">
        {app.requiredDocuments.map((r) => (
          <DocumentCard
            key={r.type}
            req={r}
            doc={app.documents.find((d) => d.type === r.type) ?? null}
            onUploaded={replaced}
            extra={
              r.type === "AGREEMENT" ? (
                <>
                  <button className="btn btn-ghost btn-sm dl" type="button" onClick={downloadAgreement}>
                    <DownloadIcon />
                    Download the seller agreement
                  </button>
                  {agreementError ? (
                    <p className="err show">
                      <DayloraIcon name="alert" />
                      {agreementError}
                    </p>
                  ) : null}
                </>
              ) : null
            }
          />
        ))}
      </div>
      <div className="form-card fromus">
        <span className="doc-ic info">
          <DayloraIcon name="shield" />
        </span>
        <p>
          <b>From us:</b> once approved, we’ll send you our signed <b>Form E-595E</b> (resale certificate) so you don’t charge us sales tax.
        </p>
      </div>
      <div className="obnav">
        <button type="button" className="btn btn-secondary" onClick={onLater}>
          Save and finish later
        </button>
        <span />
        <button type="button" className="btn btn-primary" disabled={done < total} onClick={onSubmitted}>
          Submit documents
        </button>
      </div>
    </>
  );
}

function DocumentCard({
  req,
  doc,
  extra,
  onUploaded,
}: {
  req: RequiredDocument;
  doc: SupplierDocument | null;
  extra: React.ReactNode;
  onUploaded: (d: SupplierDocument) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [expiry, setExpiry] = useState(doc?.expiresAt ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [viewError, setViewError] = useState<string | null>(null);
  const ok = doc && doc.status !== "REJECTED" && doc.status !== "EXPIRED";
  const id = `f-${req.type}`;

  const expiryProblem = (v: string) => {
    if (!v) return "Add the expiry date first";
    if (v <= todayIso()) return "This certificate has already expired. Upload a current one.";
    return null;
  };
  const expiryWarn = expiry && !expiryProblem(expiry) && daysTo(expiry) < 30 ? "Expires in under 30 days. You’ll need to upload a new one soon." : null;

  const choose = async (f: File | undefined) => {
    if (!f) return;
    setError(null);
    if (!/\.(pdf|jpe?g|png)$/i.test(f.name)) return setError("That file type isn’t accepted. Upload a PDF, JPG or PNG.");
    if (f.size > MAX_DOC_BYTES) return setError(`That file is ${(f.size / 1048576).toFixed(1)} MB. The limit is 10 MB.`);
    if (req.expires) {
      const p = expiryProblem(expiry);
      if (p) return setError(p);
    }
    setBusy(f.name);
    try {
      const r = await onboardingService.upload(req.type, f, req.expires ? expiry : undefined);
      onUploaded(r.data.data!);
    } catch (err) {
      setError(getApiErrorMessage(err, "We couldn't upload that file. Please try again."));
    } finally {
      setBusy(null);
    }
  };

  const view = async () => {
    if (!doc) return;
    setViewError(null);
    try {
      const r = await onboardingService.documentFile(doc.id);
      saveBlob(doc.fileName, r.data);
    } catch (err) {
      setViewError(getApiErrorMessage(err, "We couldn't open that file."));
    }
  };

  const [pillTone, pillText] = doc ? PILL[doc.status] : ["off", "Needed"];
  return (
    <section className={`form-card doc${ok ? " is-ok" : ""}`} aria-labelledby={`dh-${req.type}`}>
      <div className="doc-h">
        <span className={`doc-ic${ok ? " ok" : ""}`}>{ok ? <DayloraIcon name="check" /> : <DocIcon />}</span>
        <div className="grow">
          <h2 id={`dh-${req.type}`}>
            {req.label} <span className="req">*</span>
          </h2>
          <p className="cd">{DESCRIPTION[req.type] ?? ""}</p>
        </div>
        <span className={`pill ${pillTone}`}>{pillText}</span>
      </div>
      {extra}
      {doc?.status === "REJECTED" && doc.note ? (
        <div className="alert bad">
          <DayloraIcon name="alert" />
          <span>We couldn’t accept this file: {doc.note}</span>
        </div>
      ) : null}
      {req.expires ? (
        <div className={`field exp${error && !expiry ? " invalid" : ""}`}>
          <label htmlFor={`exp-${req.type}`}>
            Expiry date <span className="req">*</span>
          </label>
          <input className="input" type="date" id={`exp-${req.type}`} min={todayIso()} value={expiry} onChange={(e) => { setExpiry(e.target.value); setError(null); }} />
          {expiryWarn ? (
            <p className="err show warn">
              <DayloraIcon name="alert" />
              {expiryWarn}
            </p>
          ) : null}
        </div>
      ) : null}
      {doc ? (
        <div className="fileline">
          <span className="fi">
            <DocIcon />
          </span>
          <span className="grow">
            <b>{doc.fileName}</b>
            <small>
              {fileSize(doc.sizeBytes)}
              {doc.expiresAt ? ` · expires ${doc.expiresAt}` : ""}
            </small>
          </span>
          <button className="btn btn-ghost btn-sm" type="button" onClick={view}>
            View
          </button>
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => input.current?.click()} disabled={!!busy}>
            Replace
          </button>
        </div>
      ) : (
        <label className={`drop${error ? " bad" : ""}`} htmlFor={id}>
          <b>{busy ? `Uploading ${busy}…` : "Choose a file"}</b>
          <span className="hint">PDF, JPG or PNG · up to 10 MB</span>
        </label>
      )}
      <input
        ref={input}
        className="sr-only"
        type="file"
        id={id}
        accept={DOC_ACCEPT}
        disabled={!!busy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          choose(f);
        }}
      />
      {busy && doc ? <p className="hint">Uploading {busy}…</p> : null}
      {error ? (
        <p className="err show" role="alert">
          <DayloraIcon name="alert" />
          {error}
        </p>
      ) : null}
      {viewError ? (
        <p className="err show">
          <DayloraIcon name="alert" />
          {viewError}
        </p>
      ) : null}
    </section>
  );
}
