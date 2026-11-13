"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Ico, Pill, downloadCsv, errorText, reviewBy } from "@/components/seller/ui";
import { useTitle } from "@/components/seller/useSellerSession";
import sellerService, { saveBlob } from "@/services/seller/seller.service";
import type { RowCheck, SubmissionReport, UploadCheck } from "@/types/api/seller.types";

/** The master columns sellers fill most; the template has them all (required ones in red). */
const COLS = [
  "SKU_ID",
  "Parent_Product_ID",
  "Product_Name",
  "Brand",
  "Category",
  "Subcategory",
  "Product_Status",
  "Color",
  "Size",
  "MRP",
  "Selling_Price",
  "Inventory_Qty",
  "Long_Description",
  "Weight",
  "Dimensions",
  "Image_1_URL",
  "Image_2_URL",
];
const REQUIRED = ["Product_Name", "Category", "Product_Status", "Selling_Price", "Inventory_Qty", "Image_1_URL"];
const MAX_BYTES = 10 * 1024 * 1024;

type Filter = "all" | "FIX" | "NOTE" | "OK";

/** Minimal RFC 4180 reader, only to copy the seller's own rows into "rows to fix". */
function parseCsv(text: string): string[][] {
  const out: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else q = false;
      } else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") {
      row.push(cur);
      cur = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cur);
      out.push(row);
      row = [];
      cur = "";
    } else cur += ch;
  }
  if (cur || row.length) {
    row.push(cur);
    out.push(row);
  }
  return out;
}

export default function BulkUploadPage() {
  useTitle("Bulk upload");
  const [file, setFile] = useState<File | null>(null);
  const [checking, setChecking] = useState(false);
  const [check, setCheck] = useState<UploadCheck | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<SubmissionReport | null>(null);
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const step = report ? 4 : check ? 3 : file ? 2 : 1;
  const reset = () => {
    setFile(null);
    setCheck(null);
    setReport(null);
    setFilter("all");
    setNote("");
  };

  async function choose(f: File | undefined) {
    if (!f) return;
    if (!/\.(csv|xlsx)$/i.test(f.name)) return toast.error("Upload a .csv or .xlsx file. Save older .xls files as .xlsx first.");
    if (f.size > MAX_BYTES) return toast.error("That file is over 10 MB. Split it into smaller files.");
    setFile(f);
    setCheck(null);
    setChecking(true);
    try {
      const res = (await sellerService.checkFile(f)).data.data!;
      setCheck(res);
      setFilter(res.toFix ? "FIX" : "all");
    } catch (e) {
      toast.error(errorText(e, "We couldn't read that file."));
      setFile(null);
    } finally {
      setChecking(false);
    }
  }

  async function template() {
    try {
      saveBlob(await sellerService.downloadTemplate(), "catalog-import-template.csv");
      toast.success("Template downloaded");
    } catch (e) {
      toast.error(errorText(e, "Download failed. Try again."));
    }
  }

  async function rowsToFix() {
    if (!check || !file) return;
    const bad = check.rows.filter((r) => r.status === "FIX");
    const reasons = (r: RowCheck) => r.issues.filter((i) => i.level === "error").map((i) => i.message).join("; ");
    if (/\.csv$/i.test(file.name)) {
      // The seller's own columns, plus the reasons, so they can fix and re-upload this file.
      const table = parseCsv(await file.text());
      const header = table[0] ?? [];
      const byRow = new Map(bad.map((r) => [r.row, r]));
      const rows = table.slice(1).flatMap((cells, i) => {
        const r = byRow.get(i + 2);
        return r ? [[...header.map((_, c) => cells[c] ?? ""), reasons(r)]] : [];
      });
      downloadCsv("rows-to-fix.csv", [...header, "Errors"], rows);
    } else {
      downloadCsv("rows-to-fix.csv", ["Row", "SKU_ID", "Product_Name", "Errors"], bad.map((r) => [r.row, r.sku, r.name, reasons(r)]));
    }
    toast.success(`Downloaded ${bad.length} row${bad.length === 1 ? "" : "s"} with the errors in a column`);
  }

  async function submit() {
    if (!file) return;
    setBusy(true);
    try {
      setReport((await sellerService.submitFile(file, note.trim() || undefined)).data.data!);
      window.scrollTo({ top: 0 });
    } catch (e) {
      toast.error(errorText(e, "We couldn't submit the file. Try again."));
    } finally {
      setBusy(false);
    }
  }

  const steps = ["Get the template", "Upload your file", "Check results", "Submit"];
  const sendable = check ? check.ready + check.withNote : 0;
  const list = check ? check.rows.filter((r) => filter === "all" || r.status === filter) : [];

  return (
    <>
      <p className="sp-crumb">
        <Link href="/merchant/add">Add products</Link> / Bulk upload
      </p>
      <div className="sp-ph">
        <div>
          <h1>Bulk upload</h1>
          <p>Add or update many products at once with our template. You&apos;ll see any problems row by row before anything is sent.</p>
        </div>
      </div>
      <ol className="sp-bsteps" aria-label="Bulk upload steps">
        {steps.map((n, i) => (
          <li key={n} aria-current={step === i + 1 ? "step" : undefined} className={step > i + 1 ? "sp-done" : ""}>
            <i>{step > i + 1 ? "✓" : i + 1}</i>
            {n}
          </li>
        ))}
      </ol>

      {report ? (
        <div className="sp-card">
          <div className="sp-done-box">
            <span className={`sp-big-ic ${report.submissions.length ? "sp-ok" : "sp-warn"}`}>
              <Ico name={report.submissions.length ? "check" : "warn"} />
            </span>
            <h2>
              {report.submissions.length
                ? `${report.submissions.length} product${report.submissions.length === 1 ? "" : "s"} submitted for review`
                : "Nothing was sent for review"}
            </h2>
            <p>
              From {report.fileName}.{" "}
              {report.failedRows ? `${report.failedRows} row${report.failedRows === 1 ? "" : "s"} with errors weren't sent. Fix them and upload them again. ` : ""}
              {report.submissions.length ? (
                <>
                  We&apos;ll review within <b>2 business days</b> (by {reviewBy()}) and email you when they&apos;re live or if anything
                  needs changing.
                </>
              ) : null}
            </p>
            <dl className="sp-kv" style={{ margin: "8px 0" }}>
              <dt>Rows in file</dt>
              <dd>{report.totalRows}</dd>
              {report.draftsSaved.length ? (
                <>
                  <dt>Saved as drafts</dt>
                  <dd>{report.draftsSaved.length}</dd>
                </>
              ) : null}
              {report.stockUpdates.length ? (
                <>
                  <dt>Stock updated now</dt>
                  <dd>{report.stockUpdates.length} SKU{report.stockUpdates.length === 1 ? "" : "s"}</dd>
                </>
              ) : null}
              {report.unchangedRows ? (
                <>
                  <dt>Unchanged</dt>
                  <dd>{report.unchangedRows}</dd>
                </>
              ) : null}
            </dl>
            {report.submissions.length ? (
              <div className="sp-tw sp-panel" style={{ width: "100%", textAlign: "left" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Product</th>
                      <th>SKUs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.submissions.map((s) => (
                      <tr key={s.reference}>
                        <td>
                          <Link className="sp-mono" href={`/merchant/submissions/${s.reference}`}>
                            {s.reference}
                          </Link>
                        </td>
                        <td>{s.productName}</td>
                        <td className="sp-num">{s.skus.length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            {report.errors.length ? (
              <div className="sp-alert sp-alert-warn" style={{ textAlign: "left", width: "100%" }}>
                <Ico name="warn" />
                <div>
                  <b>Rows not sent</b>
                  <ul className="sp-issues" style={{ marginTop: 6 }}>
                    {report.errors.slice(0, 20).map((e, i) => (
                      <li key={i}>
                        Row {e.row}
                        {e.sku ? ` (${e.sku})` : ""}: {e.reason}
                      </li>
                    ))}
                  </ul>
                  {report.errors.length > 20 ? <p>…and {report.errors.length - 20} more.</p> : null}
                </div>
              </div>
            ) : null}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
              <button type="button" className="sp-btn sp-btn-pri" onClick={reset}>
                <Ico name="upload" />
                Upload another file
              </button>
              <Link className="sp-btn sp-btn-sec" href="/merchant/submissions">
                Track submissions
              </Link>
            </div>
          </div>
        </div>
      ) : check && file ? (
        <>
          <div className="sp-fileline" style={{ margin: "0 0 18px" }}>
            <span className="sp-fi">
              <Ico name="sheet" />
            </span>
            <span style={{ minWidth: 0, flex: 1 }}>
              <b>{file.name}</b>
              <small>{check.totalRows} rows checked just now</small>
            </span>
            <button type="button" className="sp-btn sp-btn-ghost sp-btn-sm" onClick={reset}>
              Upload a new file
            </button>
          </div>
          <div className="sp-sumrow">
            <div>
              <span>Rows in file</span>
              <b>{check.totalRows}</b>
            </div>
            <div className="sp-ok">
              <span>
                <span className="sp-dot8" style={{ background: "var(--leaf)" }} />
                Ready to submit
              </span>
              <b>{check.ready}</b>
            </div>
            <div className="sp-warn">
              <span>
                <span className="sp-dot8" style={{ background: "var(--amber)" }} />
                Ready, with a note
              </span>
              <b>{check.withNote}</b>
            </div>
            <div className="sp-bad">
              <span>
                <span className="sp-dot8" style={{ background: "var(--red)" }} />
                Need fixing
              </span>
              <b>{check.toFix}</b>
            </div>
          </div>
          {check.toFix ? (
            <div className="sp-alert sp-alert-warn" style={{ marginBottom: 16 }}>
              <Ico name="warn" />
              <span>
                <b>
                  {sendable} row{sendable === 1 ? "" : "s"} can be submitted now.
                </b>{" "}
                The {check.toFix} row{check.toFix === 1 ? "" : "s"} with errors won&apos;t be sent. Download them, fix them in your file and
                upload again.
              </span>
            </div>
          ) : null}
          {check.ignoredColumns.length ? (
            <div className="sp-alert sp-alert-info" style={{ marginBottom: 16 }}>
              <Ico name="info" />
              <span>
                We don&apos;t read these columns, so they&apos;re ignored: <span className="sp-mono">{check.ignoredColumns.join(", ")}</span>
              </span>
            </div>
          ) : null}
          <div className="sp-panel">
            <div className="sp-ptools">
              <div className="sp-tabs" role="tablist">
                {(
                  [
                    ["all", "All", check.totalRows],
                    ["FIX", "Need fixing", check.toFix],
                    ["NOTE", "With a note", check.withNote],
                    ["OK", "Ready", check.ready],
                  ] as [Filter, string, number][]
                ).map(([k, l, n]) => (
                  <button key={k} type="button" role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}>
                    {l}
                    <span className="sp-n">{n}</span>
                  </button>
                ))}
              </div>
              {check.toFix ? (
                <button type="button" className="sp-btn sp-btn-sec sp-btn-sm" onClick={rowsToFix}>
                  <Ico name="download" />
                  Download rows to fix
                </button>
              ) : null}
            </div>
            <div className="sp-tw">
              <table className="sp-resp">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>SKU</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>What to fix</th>
                  </tr>
                </thead>
                <tbody>
                  {list.length ? (
                    list.map((r) => (
                      <tr key={r.row}>
                        <td className="sp-mono">{r.row}</td>
                        <td className="sp-mono" style={{ whiteSpace: "nowrap" }}>
                          {r.sku || "—"}
                        </td>
                        <td className="sp-c-wide">{r.name || "—"}</td>
                        <td>{r.status === "OK" ? <Pill tone="ok">Ready</Pill> : r.status === "NOTE" ? <Pill tone="warn">Note</Pill> : <Pill tone="bad">Fix</Pill>}</td>
                        <td className="sp-c-wide">
                          {r.issues.length ? (
                            <ul className="sp-issues">
                              {r.issues.map((i, k) => (
                                <li key={k} className={i.level === "warning" ? "sp-w" : ""}>
                                  {i.message}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="sp-muted">No problems</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", color: "var(--muted)", padding: 28 }}>
                        Nothing here.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <label className="sp-field" htmlFor="sp-bnote" style={{ marginTop: 16, maxWidth: 560 }}>
            <span className="sp-lab">
              Note for our reviewer <span className="sp-opt">Optional</span>
            </span>
            <input id="sp-bnote" className="sp-inp" maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Autumn range" />
          </label>
          <div className="sp-actionbar">
            <span className="sp-note">Rows with a note go through. Image links are checked when you submit.</span>
            <button type="button" className="sp-btn sp-btn-sec" onClick={reset}>
              Cancel
            </button>
            <button type="button" className="sp-btn sp-btn-grn" disabled={!sendable || busy} onClick={submit}>
              {busy ? (
                <>
                  <span className="sp-spin" />
                  Submitting…
                </>
              ) : (
                `Submit ${sendable} row${sendable === 1 ? "" : "s"} for review`
              )}
            </button>
          </div>
        </>
      ) : (
        <div className="sp-tmpl">
          <section className="sp-card">
            <div className="sp-sec-h">
              <span className="sp-n">1</span>
              <div>
                <h2>Download the template</h2>
                <p className="sp-cd">Keep the column names as they are. Leave SKU_ID and Parent_Product_ID empty to have codes made for you.</p>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <button className="sp-btn sp-btn-sec" type="button" onClick={template}>
                <Ico name="download" />
                Template (.csv)
              </button>
            </div>
            <p className="sp-help" style={{ marginTop: 14 }}>
              Main columns · <span style={{ color: "var(--red)" }}>red</span> = required. Open it in Excel and save as .xlsx if you prefer.
            </p>
            <div className="sp-cols">
              {COLS.map((c) => (
                <span key={c} className={REQUIRED.includes(c) ? "sp-r" : ""}>
                  {c}
                </span>
              ))}
            </div>
            <p className="sp-help" style={{ marginTop: 12 }}>
              Upload a file with your existing SKUs to update them: stock changes apply at once, everything else is reviewed.
            </p>
          </section>
          <section className="sp-card">
            <div className="sp-sec-h">
              <span className="sp-n">2</span>
              <div>
                <h2>Upload your file</h2>
                <p className="sp-cd">CSV or Excel. We check every row in a few seconds, before anything is sent.</p>
              </div>
            </div>
            <label
              className={`sp-drop ${over ? "sp-on" : ""}`}
              htmlFor="sp-bfile"
              onDragEnter={(e) => {
                e.preventDefault();
                setOver(true);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={() => setOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setOver(false);
                void choose(e.dataTransfer.files[0]);
              }}
            >
              <span style={{ color: "var(--navy)" }}>
                <Ico name="upload" />
              </span>
              <b>Drag your file here or click to choose</b>
              <span className="sp-help">.csv or .xlsx · max 10 MB</span>
              <input
                ref={input}
                id="sp-bfile"
                type="file"
                accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="sp-sr"
                onChange={(e) => {
                  void choose(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            {file && checking ? (
              <div className="sp-fileline">
                <span className="sp-fi">
                  <Ico name="sheet" />
                </span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <b>{file.name}</b>
                  <small>
                    <span className="sp-spin" style={{ width: 12, height: 12, verticalAlign: -2 }} /> Checking rows…
                  </small>
                </span>
              </div>
            ) : null}
          </section>
        </div>
      )}
    </>
  );
}
