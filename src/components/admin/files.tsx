"use client";
import { useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import { Icon } from "./ui";

// Shared pieces of the catalog file dialogs (import, bulk update, export).

export const ACCEPT = ".csv,.xlsx";
export const MAX_BYTES = 10 * 1024 * 1024; // CATALOG_IMPORT_MAX_FILE_SIZE on the server

export function saveFile(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/** The file name from a Content-Disposition header, or the fallback. */
export function fileNameFrom(disposition: string | undefined, fallback: string) {
  if (!disposition) return fallback;
  const star = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(disposition);
  if (star) return decodeURIComponent(star[1].trim().replace(/^"|"$/g, ""));
  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  return plain ? plain[1] : fallback;
}

const csvCell = (v: string | number | null | undefined) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};

export const toCsv = (rows: Array<Array<string | number | null | undefined>>) =>
  rows.map((l) => l.map(csvCell).join(",")).join("\r\n");

/** A pre-upload check matching the server's limits; null when the file is fine. */
export function fileProblem(file: File): string | null {
  const name = file.name.toLowerCase();
  if (!name.endsWith(".csv") && !name.endsWith(".xlsx")) return "Upload a .csv or .xlsx file.";
  if (file.size > MAX_BYTES) return "The file is larger than 10 MB. Split it into smaller files.";
  return null;
}

/** Opens and closes a <dialog> with the `open` prop. */
export function useModal(open: boolean, onOpen?: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      onOpenRef.current?.();
      d.showModal();
    } else if (!open && d.open) d.close();
  }, [open]);
  return ref;
}

export function FileDrop({ title, hint, onFile }: { title: string; hint: ReactNode; onFile: (f: File) => void }) {
  const [drag, setDrag] = useState(false);
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  };
  return (
    <div
      className={`drop ${drag ? "drag" : ""}`}
      onDragEnter={(e) => { e.preventDefault(); setDrag(true); }}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={(e) => { e.preventDefault(); setDrag(false); }}
      onDrop={onDrop}
    >
      <Icon name="upload" />
      <strong>{title}</strong>
      <span className="sub">{hint}</span>
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
              if (f) onFile(f);
            }}
          />
        </label>
      </div>
    </div>
  );
}

export function Uploading({ file, percent, working }: { file: File; percent: number; working: string }) {
  return (
    <>
      <div className="item" style={{ border: "1px solid var(--line)", borderRadius: 12 }}>
        <Icon name="file" className="leaf" />
        <div>
          <strong>{file.name}</strong>
          <span className="sub">{percent < 100 ? "Uploading…" : working}</span>
        </div>
        <span className="sub">{percent}%</span>
      </div>
      <div className="progress">
        <i style={{ width: `${percent < 100 ? percent * 0.6 : 85}%` }} />
      </div>
    </>
  );
}

export function ErrorNote({ text }: { text?: string | null }) {
  if (!text) return null;
  return (
    <div className="note warn" role="alert">
      <Icon name="info" />
      <span>{text}</span>
    </div>
  );
}

export const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;
