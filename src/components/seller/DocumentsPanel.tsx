"use client";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import sellerService, { saveBlob } from "@/services/seller/seller.service";
import type { SellerDocument } from "@/types/api/seller.types";
import { Dialog, FieldError, Ico, Loading, Pill, errorText, fmtDate, statusOf, useLoad } from "./ui";

/** The documents a seller keeps on file (seller_documents.type). */
export const DOC_TYPES: { type: string; label: string; help: string; expires: boolean }[] = [
  { type: "W9", label: "W-9 form", help: "IRS form with your EIN and legal name. Signed and dated.", expires: false },
  { type: "AGREEMENT", label: "Seller agreement", help: "Download our agreement, sign it and upload it here.", expires: false },
  { type: "INSURANCE", label: "Certificate of insurance", help: "General liability insurance, with its expiry date.", expires: true },
];

const SOON_DAYS = 30;
const daysLeft = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);

/** The newest document of each type. */
export function currentDocuments(docs: SellerDocument[]) {
  const latest = new Map<string, SellerDocument>();
  for (const d of [...docs].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))) if (!latest.has(d.type)) latest.set(d.type, d);
  return latest;
}

/** Documents that need the seller: rejected, expired, or expiring within 30 days. */
export interface DocumentTask {
  doc: SellerDocument;
  level: "bad" | "warn";
  title: string;
  detail: string;
}

export function documentTasks(docs: SellerDocument[]): DocumentTask[] {
  return Array.from(currentDocuments(docs).values()).flatMap((d): DocumentTask[] => {
    if (d.status === "REJECTED") return [{ doc: d, level: "bad" as const, title: `${d.label} wasn't accepted`, detail: d.note ?? "Upload a new copy." }];
    if (d.status === "EXPIRED") return [{ doc: d, level: "bad" as const, title: `${d.label} has expired`, detail: "Upload a current one to keep selling." }];
    if (d.expiresAt && d.status === "VERIFIED" && daysLeft(d.expiresAt) <= SOON_DAYS) {
      const n = daysLeft(d.expiresAt);
      return [{ doc: d, level: "warn" as const, title: `Your ${d.label.toLowerCase()} expires in ${n} day${n === 1 ? "" : "s"}`, detail: `Upload a new one before ${fmtDate(d.expiresAt)} to keep selling.` }];
    }
    return [];
  });
}

function DocStatus({ doc }: { doc: SellerDocument }) {
  if (doc.status === "VERIFIED" && doc.expiresAt && daysLeft(doc.expiresAt) <= SOON_DAYS) {
    return <Pill tone="warn" icon="clock">Expires soon</Pill>;
  }
  switch (doc.status) {
    case "VERIFIED":
      return <Pill tone="ok" icon="check">Verified</Pill>;
    case "PENDING":
      return <Pill tone="info">In review</Pill>;
    case "REJECTED":
      return <Pill tone="bad">Not accepted</Pill>;
    default:
      return <Pill tone="bad">Expired</Pill>;
  }
}

/** Upload of a new document (a replacement supersedes the current one of its type). */
export function UploadDocumentDialog({ type, onClose, onDone }: { type: string | null; onClose: () => void; onDone: () => void }) {
  const [kind, setKind] = useState(type ?? "INSURANCE");
  const [file, setFile] = useState<File | null>(null);
  const [expires, setExpires] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const spec = DOC_TYPES.find((d) => d.type === kind) ?? DOC_TYPES[0];

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!file) return setErr("Choose the file first");
    if (file.size > 10 * 1024 * 1024) return setErr("That file is over 10 MB");
    if (spec.expires && (!expires || new Date(`${expires}T00:00`) <= new Date())) return setErr("Enter an expiry date in the future");
    setBusy(true);
    setErr("");
    try {
      await sellerService.uploadDocument(file, kind, spec.expires ? expires : undefined);
      toast.success(`${spec.label} sent for checking`);
      onDone();
      onClose();
    } catch (e2) {
      setErr(statusOf(e2) === 404 ? "Document upload isn't available yet. Try again later." : errorText(e2, "We couldn't upload the file. Try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={type !== null} onClose={onClose} label="Upload a document">
      <form onSubmit={submit} noValidate>
        <div className="sp-dh">
          <h2>Upload {spec.label.toLowerCase()}</h2>
          <button type="button" className="sp-btn sp-btn-ghost sp-btn-sm" aria-label="Close" onClick={onClose}>
            <Ico name="x" />
          </button>
        </div>
        <p className="sp-muted">{spec.help} PDF, JPG or PNG, up to 10 MB. Our team checks it before it counts.</p>
        <label className="sp-field" htmlFor="sp-doc-type">
          <span className="sp-lab">Document</span>
          <select id="sp-doc-type" className="sp-inp" value={kind} onChange={(e) => setKind(e.target.value)}>
            {DOC_TYPES.map((d) => (
              <option key={d.type} value={d.type}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <label className="sp-drop" htmlFor="sp-doc-file">
          <span style={{ color: "var(--navy)" }}>
            <Ico name="upload" />
          </span>
          <span>
            <b>{file ? file.name : "Choose a file"}</b>
            {file ? null : " or drag it here"}
          </span>
          <input
            ref={fileInput}
            id="sp-doc-file"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="sp-sr"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setErr("");
            }}
          />
        </label>
        {spec.expires ? (
          <label className="sp-field" htmlFor="sp-doc-exp">
            <span className="sp-lab">Expiry date</span>
            <input id="sp-doc-exp" className="sp-inp" type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
          </label>
        ) : null}
        <FieldError id="sp-doc-e">{err}</FieldError>
        <div className="sp-df">
          <button type="button" className="sp-btn sp-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="sp-btn sp-btn-pri" disabled={busy}>
            {busy ? "Uploading…" : "Submit document"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

async function download(fn: () => ReturnType<typeof sellerService.agreement>, fallback: string) {
  try {
    saveBlob(await fn(), fallback);
  } catch (e) {
    toast.error(statusOf(e) === 404 ? "That file isn't available yet." : errorText(e, "Download failed. Try again."));
  }
}

/**
 * The seller's documents: status and expiry, download, upload a replacement,
 * and the seller agreement to sign. Until the documents API is live (404) it
 * shows an empty state rather than an error.
 */
export function DocumentsPanel({ compact = false }: { compact?: boolean }) {
  const { data, error, loading, reload } = useLoad(() => sellerService.documents());
  const [uploading, setUploading] = useState<string | null>(null);
  const unavailable = !!error && statusOf(error) === 404;
  const current = currentDocuments(data ?? []);

  let body;
  if (loading && !data) body = <Loading label="Loading documents…" />;
  else if (unavailable)
    body = (
      <div className="sp-empty">
        <Ico name="doc" />
        <p>Your documents will show here once they&apos;re on file with us.</p>
      </div>
    );
  else if (error)
    body = (
      <p className="sp-muted" style={{ fontSize: 13 }}>
        {errorText(error, "We couldn't load your documents.")}{" "}
        <button type="button" className="sp-lnk" onClick={reload}>
          Try again
        </button>
      </p>
    );
  else
    body = (
      <ul className="sp-docs">
        {DOC_TYPES.map((t) => {
          const d = current.get(t.type);
          return (
            <li key={t.type}>
              <Ico name="doc" />
              <span className="sp-dn-t">
                <b>{t.label}</b>
                <small>
                  {d
                    ? [
                        d.expiresAt ? `Expires ${fmtDate(d.expiresAt)}` : null,
                        `Uploaded ${fmtDate(d.uploadedAt)}`,
                        compact ? null : d.fileName,
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    : "Not on file"}
                </small>
                {d?.note && d.status !== "VERIFIED" ? <small style={{ color: "var(--red)" }}>{d.note}</small> : null}
              </span>
              {d ? <DocStatus doc={d} /> : <Pill tone="off">Missing</Pill>}
              {d && !compact ? (
                <button type="button" className="sp-btn sp-btn-ghost sp-btn-sm" onClick={() => download(() => sellerService.documentFile(d.id), d.fileName)}>
                  <Ico name="download" />
                  Download
                </button>
              ) : null}
              {!d || d.status === "REJECTED" || d.status === "EXPIRED" || (t.expires && d.expiresAt && daysLeft(d.expiresAt) <= SOON_DAYS) || !compact ? (
                <button type="button" className="sp-btn sp-btn-sec sp-btn-sm" onClick={() => setUploading(t.type)}>
                  {d ? "Upload new" : "Upload"}
                </button>
              ) : null}
            </li>
          );
        })}
        <li>
          <Ico name="shield" />
          <span className="sp-dn-t">
            <b>Our seller agreement</b>
            <small>The terms you sign with us</small>
          </span>
          <button type="button" className="sp-btn sp-btn-ghost sp-btn-sm" onClick={() => download(() => sellerService.agreement(), "seller-agreement.pdf")}>
            <Ico name="download" />
            Download
          </button>
        </li>
      </ul>
    );

  return (
    <>
      {body}
      {compact && !unavailable ? (
        <p style={{ marginTop: 10 }}>
          <Link className="sp-lnk" href="/merchant/documents">
            Manage documents <Ico name="right" />
          </Link>
        </p>
      ) : null}
      <UploadDocumentDialog key={uploading ?? "none"} type={uploading} onClose={() => setUploading(null)} onDone={reload} />
    </>
  );
}
