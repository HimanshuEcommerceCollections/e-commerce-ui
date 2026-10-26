"use client";
import { useEffect, useState } from "react";
import { getApiErrorMessage } from "@/lib/apiError";
import { refreshAdminCounts } from "./refresh";
import { toast, whenText } from "./ui";

// Shared by the admin inbox pages: support messages and seller applications.

/** Status and private note of one inbox item, saved together. */
export function HandleForm<S extends string>({
  id,
  status,
  note,
  handledBy,
  updatedAt,
  statuses,
  onSave,
  onSaved,
}: {
  id: string;
  status: S;
  note: string | null;
  handledBy: string | null;
  updatedAt: string | null;
  statuses: Record<string, [string, string]>;
  onSave: (data: { status: S; adminNote: string }) => Promise<void>;
  onSaved: () => void;
}) {
  const [s, setS] = useState<S>(status);
  const [n, setN] = useState(note ?? "");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setS(status);
    setN(note ?? "");
  }, [id, status, note]);
  const dirty = s !== status || n.trim() !== (note ?? "");

  const save = async () => {
    setBusy(true);
    try {
      await onSave({ status: s, adminNote: n.trim() });
      toast("Saved");
      refreshAdminCounts();
      onSaved();
    } catch (err) {
      toast(getApiErrorMessage(err, "Couldn't save"), true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="d-sec">
      <h3>Handling</h3>
      <div className="form">
        <div className="fld">
          <label htmlFor={`st-${id}`}>Status</label>
          <select className="sel inp" id={`st-${id}`} value={s} onChange={(e) => setS(e.target.value as S)}>
            {Object.entries(statuses).map(([k, [label]]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </div>
        <div className="fld">
          <label htmlFor={`nt-${id}`}>Admin note</label>
          <textarea className="inp" id={`nt-${id}`} value={n} maxLength={2000} onChange={(e) => setN(e.target.value)} />
          <span className="hint">
            Only staff see this.
            {handledBy ? ` Last updated by ${handledBy}${updatedAt ? `, ${whenText(updatedAt)}` : ""}.` : ""}
          </span>
        </div>
        <div className="actrow" style={{ justifyContent: "flex-start" }}>
          <button className="btn btn-primary btn-sm" onClick={save} disabled={busy || !dirty}>
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
