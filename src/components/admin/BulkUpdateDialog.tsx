"use client";
import { useState } from "react";
import adminService from "@/services/admin/admin.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type { BulkUpdateReport } from "@/types/api/admin.types";
import { ErrorNote, FileDrop, Uploading, fileProblem, saveFile, seconds, toCsv, useModal } from "./files";
import { Icon, toast } from "./ui";

type Stage =
  | { kind: "pick"; error?: string }
  | { kind: "uploading"; file: File; percent: number }
  | { kind: "done"; report: BulkUpdateReport };

const COLUMNS: Array<[string, string]> = [
  ["SKU_ID", "Required. The SKU to change."],
  ["Selling_Price, MRP, Cost", "Prices. Selling price can't be above MRP."],
  ["Tax_Code, Tax_Rate", "Tax rate in percent, 0–100."],
  ["Inventory_Qty", "Sets stock on hand to this number."],
  ["Inventory_Adjustment", "Adds or removes units (e.g. 12 or -3). Use instead of Inventory_Qty."],
  ["Low_Stock_Threshold", "Per-SKU low-stock alert level."],
  ["Product_Status", "ACTIVE to publish, INACTIVE to unpublish, DRAFT or ARCHIVED."],
];

/**
 * Price, stock and publish changes after go-live (FR-IM-10, FR-IM-11): a sheet of
 * SKU_ID plus only the columns to change, without re-uploading product content.
 */
export default function BulkUpdateDialog({ open, onClose, onUpdated }: { open: boolean; onClose: () => void; onUpdated: () => void }) {
  const [stage, setStage] = useState<Stage>({ kind: "pick" });
  const ref = useModal(open, () => setStage({ kind: "pick" }));

  const close = () => {
    if (stage.kind === "uploading") return;
    onClose();
  };

  const run = async (file: File) => {
    const problem = fileProblem(file);
    if (problem) return setStage({ kind: "pick", error: problem });
    setStage({ kind: "uploading", file, percent: 0 });
    try {
      const res = await adminService.bulkUpdate(file, (percent) =>
        setStage((s) => (s.kind === "uploading" ? { ...s, percent } : s))
      );
      const report = res.data.data!;
      setStage({ kind: "done", report });
      if (report.updatedRows) onUpdated();
    } catch (err) {
      setStage({ kind: "pick", error: getApiErrorMessage(err, "The update failed. Please try again.") });
    }
  };

  const downloadSample = () => {
    const csv = toCsv([
      ["SKU_ID", "Selling_Price", "MRP", "Inventory_Qty", "Product_Status"],
      ["GS-CL-MEN-001-BLK-M", "19.99", "24.99", "40", "ACTIVE"],
    ]);
    saveFile("catalog-bulk-update-sample.csv", new Blob([csv], { type: "text/csv" }));
  };

  const downloadErrors = (r: BulkUpdateReport) => {
    const csv = toCsv([["Row", "SKU", "Reason"], ...r.errors.map((e) => [e.row, e.sku, e.reason])]);
    saveFile(`${r.fileName.replace(/\.[^.]+$/, "")}-errors.csv`, new Blob([csv], { type: "text/csv" }));
  };

  return (
    <dialog ref={ref} aria-labelledby="bulkTitle" onCancel={(e) => { e.preventDefault(); close(); }} onClick={(e) => e.target === ref.current && close()}>
      <div className="d-head">
        <div>
          <h2 id="bulkTitle">Bulk update price, stock &amp; status</h2>
          <div className="sub">Change existing SKUs only. Leave out any column you don&apos;t want to change.</div>
        </div>
        <button className="x" onClick={close} aria-label="Close" disabled={stage.kind === "uploading"}>
          <Icon name="close" />
        </button>
      </div>

      <div className="m-body">
        {stage.kind === "pick" ? (
          <>
            <ErrorNote text={stage.error} />
            <FileDrop title="Drag your update sheet here" hint="CSV or Excel (.xlsx), up to 10 MB" onFile={run} />
            <div className="d-sec">
              <h3>Columns</h3>
              <dl className="kv cols">
                {COLUMNS.map(([c, d]) => (
                  <div key={c} style={{ display: "contents" }}>
                    <dt><code>{c}</code></dt>
                    <dd className="sub">{d}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="link" onClick={downloadSample} style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                <Icon name="download" size={16} /> Download sample sheet
              </button>
            </div>
          </>
        ) : null}

        {stage.kind === "uploading" ? <Uploading file={stage.file} percent={stage.percent} working="Applying changes…" /> : null}

        {stage.kind === "done" ? <Result report={stage.report} /> : null}
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
            <button className="btn btn-secondary" onClick={() => setStage({ kind: "pick" })}>Upload another file</button>
            <button
              className="btn btn-primary"
              onClick={() => {
                onClose();
                const r = stage.report;
                toast(`${r.updatedRows} SKUs updated${r.failedRows ? `, ${r.failedRows} rows failed` : ""}`);
              }}
            >
              Done
            </button>
          </>
        ) : (
          <button className="btn btn-secondary" onClick={close} disabled={stage.kind === "uploading"}>
            {stage.kind === "uploading" ? "Updating…" : "Cancel"}
          </button>
        )}
      </div>
    </dialog>
  );
}

function Result({ report: r }: { report: BulkUpdateReport }) {
  return (
    <>
      <div className={`note ${r.failedRows ? "warn" : ""}`}>
        <Icon name="info" />
        <span>
          <b>{r.fileName}</b>: {r.totalRows.toLocaleString()} rows processed in {seconds(r.durationMs)}.
          {r.failedRows ? " Failed rows were skipped; the other rows were applied." : ""}
        </span>
      </div>
      <div className="steps4">
        <div className="res ok"><b>{r.updatedRows}</b><span>SKUs updated</span></div>
        <div className="res upd"><b>{r.unchangedRows}</b><span>Already up to date</span></div>
        <div className="res fail"><b>{r.failedRows}</b><span>Rows failed</span></div>
        <div className="res"><b>{r.columns.length}</b><span>Columns applied</span></div>
      </div>
      {r.columns.length ? (
        <div className="chips">{r.columns.map((c) => <code key={c}>{c}</code>)}</div>
      ) : null}
      <div className="panel">
        <div className="twrap" style={{ maxHeight: 320, overflowY: "auto" }}>
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
        </div>
      </div>
    </>
  );
}
