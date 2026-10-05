"use client";
import { useState } from "react";
import adminService from "@/services/admin/admin.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type { CatalogImportReport } from "@/types/api/admin.types";
import { ErrorNote, FileDrop, Uploading, fileProblem, saveFile, seconds, toCsv, useModal } from "./files";
import { Icon, toast } from "./ui";

type Stage =
  | { kind: "pick"; error?: string }
  | { kind: "uploading"; file: File; percent: number }
  | { kind: "done"; report: CatalogImportReport };

type Tab = "errors" | "images" | "warnings" | "imported";

/**
 * Bulk catalog import (FR-IM-01..09): upload → server validates → per-row report.
 * Existing SKUs are updated (FR-IM-09); broken image URLs are imported and flagged (FR-IM-08).
 */
export default function ImportDialog({ open, onClose, onImported }: { open: boolean; onClose: () => void; onImported: () => void }) {
  const [stage, setStage] = useState<Stage>({ kind: "pick" });
  const [tab, setTab] = useState<Tab>("errors");
  const ref = useModal(open, () => setStage({ kind: "pick" }));

  const close = () => {
    if (stage.kind === "uploading") return; // the upload can't be cancelled server-side
    onClose();
  };

  const run = async (file: File) => {
    const problem = fileProblem(file);
    if (problem) return setStage({ kind: "pick", error: problem });
    setStage({ kind: "uploading", file, percent: 0 });
    try {
      const res = await adminService.importCatalog(file, (percent) =>
        setStage((s) => (s.kind === "uploading" ? { ...s, percent } : s))
      );
      const report = res.data.data!;
      setTab(report.errors.length ? "errors" : report.imageErrors?.length ? "images" : report.warnings?.length ? "warnings" : "imported");
      setStage({ kind: "done", report });
      if (report.importedRows) onImported();
    } catch (err) {
      setStage({ kind: "pick", error: getApiErrorMessage(err, "The import failed. Please try again.") });
    }
  };

  const downloadTemplate = async () => {
    try {
      const res = await adminService.downloadTemplate();
      saveFile("catalog-import-template.csv", res.data);
    } catch (err) {
      toast(getApiErrorMessage(err, "Couldn't download the template"), true);
    }
  };

  // One file with every problem, so catalog staff can fix the sheet in one pass (FR-IM-07).
  const downloadErrors = (r: CatalogImportReport) => {
    const csv = toCsv([
      ["Type", "Row", "SKU", "Column", "URL", "Reason"],
      ...r.errors.map((e) => ["Error", e.row, e.sku, "", "", e.reason]),
      ...(r.imageErrors ?? []).map((e) => ["Image", e.row, e.sku, e.column, e.url, e.reason]),
      ...(r.warnings ?? []).map((w) => ["Warning", w.row, w.sku, "", "", w.message]),
    ]);
    saveFile(`${r.fileName.replace(/\.[^.]+$/, "")}-report.csv`, new Blob([csv], { type: "text/csv" }));
  };

  const problems = (r: CatalogImportReport) => r.errors.length + (r.imageErrors?.length ?? 0) + (r.warnings?.length ?? 0);

  return (
    <dialog ref={ref} aria-labelledby="impTitle" onCancel={(e) => { e.preventDefault(); close(); }} onClick={(e) => e.target === ref.current && close()}>
      <div className="d-head">
        <div>
          <h2 id="impTitle">Import products</h2>
          <div className="sub">
            Bulk upload from the catalog template. Existing SKUs are updated; SKU_ID and Parent_Product_ID are generated when left blank.
          </div>
        </div>
        <button className="x" onClick={close} aria-label="Close" disabled={stage.kind === "uploading"}>
          <Icon name="close" />
        </button>
      </div>

      <div className="m-body">
        {stage.kind === "pick" ? (
          <>
            <ErrorNote text={stage.error} />
            <FileDrop
              title="Drag your catalog file here"
              hint="CSV or Excel (.xlsx), up to 10 MB · images as URLs, never embedded"
              onFile={run}
            />
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
          <Uploading file={stage.file} percent={stage.percent} working="Validating rows, checking images and saving SKUs…" />
        ) : null}

        {stage.kind === "done" ? <Result report={stage.report} tab={tab} setTab={setTab} /> : null}
      </div>

      <div className="d-foot">
        {stage.kind === "done" ? (
          <>
            {problems(stage.report) ? (
              <button className="btn btn-secondary" onClick={() => downloadErrors(stage.report)}>
                <Icon name="download" />
                Download report
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

function Result({ report: r, tab, setTab }: { report: CatalogImportReport; tab: Tab; setTab: (t: Tab) => void }) {
  const generated = r.imported.filter((i) => i.generated).length;
  const imageErrors = r.imageErrors ?? [];
  const warnings = r.warnings ?? [];
  const tabs: Array<[Tab, string, number]> = [
    ["errors", "Row errors", r.errors.length],
    ["images", "Image errors", imageErrors.length],
    ["warnings", "Warnings", warnings.length],
    ["imported", "Imported SKUs", r.imported.length],
  ];
  return (
    <>
      <div className={`note ${r.failedRows || imageErrors.length ? "warn" : ""}`}>
        <Icon name="info" />
        <span>
          <b>{r.fileName}</b>: {r.totalRows.toLocaleString()} rows processed in {seconds(r.durationMs)}.
          {r.failedRows ? " Failed rows were skipped; the rest of the file was imported." : " Every row was imported."}
          {generated ? ` ${generated} SKUs were generated.` : ""}
          {imageErrors.length ? " Products with broken image URLs were imported and flagged." : ""}
          {r.imagesChecked === false ? " Image URLs weren't checked (checks are off on the server)." : ""}
        </span>
      </div>
      <div className="steps4">
        <div className="res ok"><b>{r.createdRows ?? r.importedRows}</b><span>SKUs created</span></div>
        <div className="res upd"><b>{r.updatedRows ?? 0}</b><span>SKUs updated</span></div>
        <div className="res fail"><b>{r.failedRows}</b><span>Rows failed</span></div>
        <div className="res flag"><b>{imageErrors.length}</b><span>Image errors</span></div>
      </div>
      <p className="sub">
        {r.parentProductsCreated} new products · {r.parentProductsUpdated ?? 0} products updated
        {warnings.length ? ` · ${warnings.length} warnings` : ""}
      </p>
      {r.ignoredColumns.length ? (
        <details>
          <summary className="sub" style={{ cursor: "pointer" }}>
            Columns accepted but not stored ({r.ignoredColumns.length})
          </summary>
          <div className="chips" style={{ marginTop: 8 }}>
            {r.ignoredColumns.map((c) => <code key={c}>{c}</code>)}
          </div>
        </details>
      ) : null}
      <div className="panel">
        <div className="tabs" role="tablist">
          {tabs.map(([key, label, n]) => (
            <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}>
              {label}<span className="c">{n}</span>
            </button>
          ))}
        </div>
        <div className="twrap" style={{ maxHeight: 320, overflowY: "auto" }}>
          {tab === "errors" ? (
            <table>
              <thead><tr><th className="num">Row</th><th>SKU</th><th>Reason</th></tr></thead>
              <tbody>
                {r.errors.length ? (
                  r.errors.map((e, i) => (
                    <tr key={`${e.row}-${i}`}>
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
          ) : tab === "images" ? (
            <table>
              <thead><tr><th className="num">Row</th><th>SKU</th><th>Column</th><th>Problem</th></tr></thead>
              <tbody>
                {imageErrors.length ? (
                  imageErrors.map((e, i) => (
                    <tr key={`${e.row}-${e.column}-${i}`}>
                      <td className="num">{e.row}</td>
                      <td>{e.sku ? <code>{e.sku}</code> : <span className="sub">—</span>}</td>
                      <td className="sub">{e.column}</td>
                      <td style={{ whiteSpace: "normal", minWidth: 200 }}>
                        {e.reason}
                        <a className="sub url" href={e.url} target="_blank" rel="noreferrer">{e.url}</a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="empty-row"><td colSpan={4}>{r.imagesChecked === false ? "Image URLs weren't checked." : "Every image URL loaded."}</td></tr>
                )}
              </tbody>
            </table>
          ) : tab === "warnings" ? (
            <table>
              <thead><tr><th className="num">Row</th><th>SKU</th><th>Warning</th></tr></thead>
              <tbody>
                {warnings.length ? (
                  warnings.map((w, i) => (
                    <tr key={`${w.row}-${i}`}>
                      <td className="num">{w.row}</td>
                      <td>{w.sku ? <code>{w.sku}</code> : <span className="sub">—</span>}</td>
                      <td style={{ whiteSpace: "normal" }}>{w.message}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="empty-row"><td colSpan={3}>No warnings.</td></tr>
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
                      <td>
                        {i.action === "UPDATED" ? <span className="pill p-grey">Updated</span> : <span className="pill p-ok">New</span>}{" "}
                        {i.generated ? <span className="pill p-info">Generated</span> : null}
                      </td>
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
