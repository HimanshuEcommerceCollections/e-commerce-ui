"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { getApiErrorMessage } from "@/lib/apiError";
import type { ListingState, SellerProduct, SellerVariant, SubmissionKind, SubmissionStatus } from "@/types/api/seller.types";

// ─── Icons (the designs' symbol set) ─────────────────────────────────────────

const PATHS: Record<string, ReactNode> = {
  alert: (<><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5h.01" /></>),
  bell: <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0" />,
  box: <path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8" />,
  cart: (<><path d="M3 4h2l2.4 11h11L21 7H6.2" /><circle cx="9" cy="19.5" r="1.5" /><circle cx="17" cy="19.5" r="1.5" /></>),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  doc: (<><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z" /><path d="M14 3v5h5M8 13h8M8 17h6" /></>),
  download: <path d="M12 4v12M7 11l5 5 5-5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />,
  eye: (<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>),
  gear: (<><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></>),
  home: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  image: (<><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-9 9" /></>),
  info: (<><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.5h.01" /></>),
  left: <path d="M15 6l-6 6 6 6" />,
  list: <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />,
  lock: (<><rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>),
  mail: (<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3.5 6.5l8.5 6.5 8.5-6.5" /></>),
  out: <path d="M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4M16 17l5-5-5-5M21 12H9" />,
  plus: <path d="M12 5v14M5 12h14" />,
  right: <path d="M5 12h14M13 6l6 6-6 6" />,
  search: (<><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>),
  sheet: (<><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M4 9h16M4 15h16M10 3v18" /></>),
  shield: (<><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" /><path d="M9 12l2 2 4-4" /></>),
  upload: <path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />,
  warn: (<><path d="M12 3l10 18H2z" /><path d="M12 10v4M12 17.5h.01" /></>),
  x: <path d="M6 6l12 12M18 6L6 18" />,
};

export type IconName = keyof typeof PATHS;

export function Ico({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg className={`sp-i ${className ?? ""}`.trim()} viewBox="0 0 24 24" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

// ─── Formatting ──────────────────────────────────────────────────────────────

const DAY = 86_400_000;

export const money = (v: number | string | null | undefined) =>
  v === null || v === undefined || v === "" ? "—" : `$${Number(v).toFixed(2)}`;

export const pct = (from: number, to: number) => {
  if (!from) return "";
  const v = ((to - from) / from) * 100;
  return `${v > 0 ? "+" : "−"}${Math.abs(v).toFixed(1)}%`;
};

export function rel(iso: string | number | Date) {
  const t = new Date(iso).getTime();
  const d = Date.now() - t;
  if (d < 3_600_000) return `${Math.max(1, Math.round(d / 60_000))} min ago`;
  if (d < DAY) return `${Math.round(d / 3_600_000)} h ago`;
  const n = Math.round(d / DAY);
  return n === 1 ? "Yesterday" : n < 45 ? `${n} days ago` : fmtDate(iso);
}

export const fmtDate = (iso: string | number | Date) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
};

export const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / DAY);

/** Two business days after the date: the review promise. */
export function reviewBy(from: string | number | Date = Date.now()) {
  const d = new Date(from);
  let n = 0;
  while (n < 2) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() % 6) n++;
  }
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export const initials = (name: string) =>
  name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const errorText = (err: unknown, fallback: string) => getApiErrorMessage(err, fallback);
export const statusOf = (err: unknown) => (err as { response?: { status?: number } })?.response?.status;

// ─── Listing and submission states ───────────────────────────────────────────

type Tone = "ok" | "bad" | "warn" | "info" | "off";

export const STATE: Record<ListingState, { tone: Tone; label: string; color: string }> = {
  LIVE: { tone: "ok", label: "Live", color: "#16794C" },
  CHANGE_PENDING: { tone: "ok", label: "Live · change pending", color: "#6FBF95" },
  SUBMITTED: { tone: "info", label: "Submitted", color: "#1D5FA8" },
  IN_REVIEW: { tone: "info", label: "In review", color: "#5B8FD0" },
  CHANGES_REQUESTED: { tone: "warn", label: "Changes requested", color: "#B54708" },
  SUSPENDED: { tone: "bad", label: "Suspended", color: "#B42318" },
  DRAFT: { tone: "off", label: "Draft", color: "#9AA4B2" },
  ARCHIVED: { tone: "off", label: "Archived", color: "#D5DBE2" },
};

export const STATE_ORDER: ListingState[] = ["LIVE", "CHANGE_PENDING", "SUBMITTED", "IN_REVIEW", "CHANGES_REQUESTED", "SUSPENDED", "DRAFT", "ARCHIVED"];

export const SUBMISSION: Record<SubmissionStatus, { tone: Tone; label: string }> = {
  SUBMITTED: { tone: "info", label: "Submitted" },
  IN_REVIEW: { tone: "info", label: "In review" },
  CHANGES_REQUESTED: { tone: "warn", label: "Changes requested" },
  APPROVED: { tone: "ok", label: "Approved" },
  REJECTED: { tone: "bad", label: "Not approved" },
  WITHDRAWN: { tone: "off", label: "Withdrawn" },
};

export const KIND: Record<SubmissionKind, string> = {
  NEW_PRODUCT: "New product",
  EDIT: "Change",
  DELIST: "Delisting",
};

export function Pill({ tone, children, icon }: { tone: Tone; children: ReactNode; icon?: IconName }) {
  return (
    <span className={`sp-pill sp-pill-${tone}`}>
      {icon ? <Ico name={icon} /> : null}
      {children}
    </span>
  );
}

export const StatePill = ({ state }: { state: ListingState }) => <Pill tone={STATE[state].tone}>{STATE[state].label}</Pill>;
export const SubmissionPill = ({ status }: { status: SubmissionStatus }) => (
  <Pill tone={SUBMISSION[status].tone}>{SUBMISSION[status].label}</Pill>
);

/** On the store: shoppers can see it (or a change waits while the live version stays). */
export const onStore = (p: SellerProduct) => p.state === "LIVE" || p.state === "CHANGE_PENDING";
/** Variants shoppers can buy or see. */
export const sellable = (p: SellerProduct) => p.variants.filter((v) => v.status === "ACTIVE");
export const isOut = (v: SellerVariant) => v.stockQuantity === 0;
export const isLow = (v: SellerVariant) => v.stockQuantity > 0 && v.stockQuantity <= v.lowStockThreshold;

export function Thumb({ src, size = 44, alt = "" }: { src: string | null; size?: number; alt?: string }) {
  return (
    <span className="sp-pthumb" style={{ width: size, height: size }} aria-hidden={alt ? undefined : true}>
      {/* eslint-disable-next-line @next/next/no-img-element -- seller-supplied URLs from any host */}
      {src ? <img src={src} alt={alt} loading="lazy" /> : <Ico name="image" />}
    </span>
  );
}

// ─── Data loading ────────────────────────────────────────────────────────────

/** Loads once (and on reload); keeps the last data while reloading. */
export function useLoad<T>(fn: () => Promise<{ data: { data: T | null } }>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const ref = useRef(fn);
  ref.current = fn;
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ref.current();
      setData(res.data.data);
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- callers pass their own dependency list
  }, deps);
  return { data, error, loading, reload: load, setData };
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="sp-loading" role="status">
      <span className="sp-spin" />
      {label}
    </div>
  );
}

export function LoadError({ error, onRetry, what }: { error: unknown; onRetry: () => void; what: string }) {
  return (
    <div className="sp-alert sp-alert-bad" role="alert">
      <Ico name="alert" />
      <span>
        {errorText(error, `We couldn't load ${what}.`)}{" "}
        <button type="button" className="sp-lnk" onClick={onRetry} style={{ color: "inherit" }}>
          Try again
        </button>
      </span>
    </div>
  );
}

export function FieldError({ id, children }: { id: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <span className="sp-err" id={id}>
      <Ico name="alert" />
      {children}
    </span>
  );
}

// ─── Dialog ──────────────────────────────────────────────────────────────────

/** A native modal <dialog>: focus trapping, Escape and the backdrop come with it. */
export function Dialog({
  open,
  onClose,
  label,
  drawer = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  drawer?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="sp-dialog"
      aria-label={label}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {open ? <div className={drawer ? "sp-drawer" : "sp-modal"}>{children}</div> : null}
    </dialog>
  );
}

/** Downloads rows as CSV (Excel opens it); values are quoted. */
export function downloadCsv(name: string, header: string[], rows: (string | number | null | undefined)[][]) {
  const q = (v: string | number | null | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [header.map(q).join(","), ...rows.map((r) => r.map(q).join(","))].join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
