"use client";
import { useEffect, useRef, useState, type DragEvent } from "react";
import adminService from "@/services/admin/admin.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type { CatalogImportReport } from "@/types/api/admin.types";
import { Icon, toast } from "./ui";

type Stage =
  | { kind: "pick"; error?: string }
  | { kind: "uploading"; file: File; percent: number }
  | { kind: "done"; report: CatalogImportReport; seconds: number };

const ACCEPT = ".csv,.xlsx";
const MAX_BYTES = 10 * 1024 * 1024; // CATALOG_IMPORT_MAX_FILE_SIZE on the server

function saveFile(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

const csvCell = (v: string | number | null) => {
  const s = v === null ? "" : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};

/** Bulk catalog import (FR-IM-01..07): upload → server validates → per-row report. */
export default function ImportDialog({ open, onClose, onImported }: { open: boolean; onClose: () => void; onImported: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [stage, setStage] = useState<Stage>({ kind: "pick" });
  const [drag, setDrag] = useState(false);
  const [tab, setTab] = useState<"errors" | "imported">("errors");

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      setStage({ kind: "pick" });
      d.showModal();
    } else if (!open && d.open) d.close();
  }, [open]);

  const close = () => {
    if (stage.kind === "uploading") return; // the upload can't be cancelled server-side
    onClose();
  };

  const run = async (file: File) => {
    const name = file.name.toLowerCase();
    if (!name.endsWith(".csv") && !name.endsWith(".xlsx")) {
      setStage({ kind: "pick", error: "Upload a .csv or .xlsx file." });
      return;
    }
    if (file.size > MAX_BYTES) {
      setStage({ kind: "pick", error: "The file is larger than 10 MB. Split it into smaller files." });
      return;
    }
    const started = performance.now();
    setStage({ kind: "uploading", file, percent: 0 });
    try {
      const res = await adminService.importCatalog(file, (percent) =>
        setStage((s) => (s.kind === "uploading" ? { ...s, percent } : s))
      );
      const report = res.data.data!;
      setTab(report.errors.length ? "errors" : "imported");
      setStage({ kind: "done", report, seconds: (performance.now() - started) / 1000 });
      if (report.importedRows) onImported();
    } catch (err) {
      setStage({ kind: "pick", error: getApiErrorMessage(err, "The import failed. Please try again.") });
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) run(f);
  };

  const downloadTemplate = async () => {
    try {
      const res = await adminService.downloadTemplate();
      saveFile("catalog-import-template.csv", res.data);
    } catch (err) {
      toast(getApiErrorMessage(err, "Couldn't download the template"), true);
    }
  };

  const downloadErrors = (r: CatalogImportReport) => {
    const lines = [["Row", "SKU", "Reason"], ...r.errors.map((e) => [e.row, e.sku, e.reason])];
    const csv = lines.map((l) => l.map(csvCell).join(",")).join("\r\n");
    saveFile(`${r.fileName.replace(/\.[^.]+$/, "")}-errors.csv`, new Blob([csv], { type: "text/csv" }));
  };

  return (
    <dialog ref={ref} aria-labelledby="impTitle" onCancel={(e) => { e.preventDefault(); close(); }} onClick={(e) => e.target === ref.current && close()}>
      <div className="d-head">
        <div>
          <h2 id="impTitle">Import products</h2>
          <div className="sub">
            Bulk upload from the catalog template. SKU_ID and Parent_Product_ID are generated when left blank.
          </div>
        </div>
        <button className="x" onClick={close} aria-label="Close" disabled={stage.kind === "uploading"}>
          <Icon name="close" />
        </button>
      </div>

      <div className="m-body">
        {stage.kind === "pick" ? (
          <>
            {stage.error ? (
              <div className="note warn" role="alert">
                <Icon name="info" />
                <span>{stage.error}</span>
              </div>
            ) : null}
            <div
              className={`drop ${drag ? "drag" : ""}`}
              onDragEnter={(e) => { e.preventDefault(); setDrag(true); }}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDrag(false); }}
              onDrop={onDrop}
            >
              <Icon name="upload" />
              <strong>Drag your catalog file here</strong>
              <span className="sub">CSV or Excel (.xlsx), up to 10 MB · images as URLs, never embedded</span>
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
                <label className="btn btn-secondary btn-sm" style={{ cursor: "pointer" }}>
                  Choose file
                  <input
                    type="file"
                    accept={ACCEPT}
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (f) run(f);
                    }}
                  />
                </label>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span className="sub">
                Mandatory per row: Product_Name, Category, Selling_Price, Inventory_Qty, Image_1_URL, Product_Status.
              </span>
              <button className="link" onClick={downloadTemplate} style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                <Icon name="download" size={16} /> Download template
              </button>
            </div>
          </>
        ) : null}

        {stage.kind === "uploading" ? (
          <>
            <div className="item" style={{ border: "1px solid var(--line)", borderRadius: 12 }}>
              <Icon name="file" className="leaf" />
              <div>
                <strong>{stage.file.name}</strong>
                <span className="sub">
                  {stage.percent < 100 ? "Uploading…" : "Validating rows and creating SKUs…"}
                </span>
              </div>
              <span className="sub">{stage.percent}%</span>
            </div>
            <div className="progress">
              <i style={{ width: `${stage.percent < 100 ? stage.percent * 0.6 : 85}%` }} />
            </div>
          </>
        ) : null}

        {stage.kind === "done" ? <Result report={stage.report} seconds={stage.seconds} tab={tab} setTab={setTab} /> : null}
      </div>

      <div className="d-foot">
        {stage.kind === "done" ? (
          <>
            {stage.report.errors.length ? (
              <button className="btn btn-secondary" onClick={() => downloadErrors(stage.report)}>
                <Icon name="download" />
                Download error report
              </button>
            ) : null}
            <button className="btn btn-secondary" onClick={() => setStage({ kind: "pick" })}>
              Import another file
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                onClose();
                const r = stage.report;
                toast(`${r.importedRows} SKUs imported${r.failedRows ? `, ${r.failedRows} rows failed` : ""}`);
              }}
            >
              Done
            </button>
          </>
        ) : (
          <button className="btn btn-secondary" onClick={close} disabled={stage.kind === "uploading"}>
            {stage.kind === "uploading" ? "Importing…" : "Cancel"}
          </button>
        )}
      </div>
    </dialog>
  );
}

function Result({
  report: r,
  seconds,
  tab,
  setTab,
}: {
  report: CatalogImportReport;
  seconds: number;
  tab: "errors" | "imported";
  setTab: (t: "errors" | "imported") => void;
}) {
  const generated = r.imported.filter((i) => i.generated).length;
  return (
    <>
      <div className={`note ${r.failedRows ? "warn" : ""}`}>
        <Icon name="info" />
        <span>
          <b>{r.fileName}</b>: {r.totalRows.toLocaleString()} rows processed in {seconds.toFixed(1)} s.
          {r.failedRows ? " Failed rows were skipped; the rest of the file was imported." : " Every row was imported."}
          {generated ? ` ${generated} SKUs were generated.` : ""}
        </span>
      </div>
      <div className="steps4">
        <div className="res ok"><b>{r.importedRows}</b><span>SKUs imported</span></div>
        <div className="res upd"><b>{r.parentProductsCreated}</b><span>New products</span></div>
        <div className="res fail"><b>{r.failedRows}</b><span>Rows failed</span></div>
        <div className="res flag"><b>{r.ignoredColumns.length}</b><span>Columns not stored yet</span></div>
      </div>
      {r.ignoredColumns.length ? (
        <details>
          <summary className="sub" style={{ cursor: "pointer" }}>
            Columns accepted but not stored yet ({r.ignoredColumns.length})
          </summary>
          <div className="chips" style={{ marginTop: 8 }}>
            {r.ignoredColumns.map((c) => <code key={c}>{c}</code>)}
          </div>
        </details>
      ) : null}
      <div className="panel">
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === "errors"} onClick={() => setTab("errors")}>
            Row errors<span className="c">{r.errors.length}</span>
          </button>
          <button role="tab" aria-selected={tab === "imported"} onClick={() => setTab("imported")}>
            Imported SKUs<span className="c">{r.imported.length}</span>
          </button>
        </div>
        <div className="twrap" style={{ maxHeight: 320, overflowY: "auto" }}>
          {tab === "errors" ? (
            <table>
              <thead><tr><th className="num">Row</th><th>SKU</th><th>Reason</th></tr></thead>
              <tbody>
                {r.errors.length ? (
                  r.errors.map((e) => (
                    <tr key={e.row}>
                      <td className="num">{e.row}</td>
                      <td>{e.sku ? <code>{e.sku}</code> : <span className="sub">—</span>}</td>
                      <td style={{ whiteSpace: "normal" }}>{e.reason}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="empty-row"><td colSpan={3}>No row errors.</td></tr>
                )}
              </tbody>
            </table>
          ) : (
            <table>
              <thead><tr><th className="num">Row</th><th>SKU</th><th>Product</th><th /></tr></thead>
              <tbody>
                {r.imported.length ? (
                  r.imported.map((i) => (
                    <tr key={i.row}>
                      <td className="num">{i.row}</td>
                      <td><code>{i.sku}</code></td>
                      <td><code>{i.parentProductId}</code></td>
                      <td>{i.generated ? <span className="pill p-info">Generated</span> : null}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="empty-row"><td colSpan={4}>Nothing was imported.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
