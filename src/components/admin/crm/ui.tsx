"use client";
import { useEffect, useRef, type ReactNode } from "react";
import type { CrmMember, PipelineStage, TicketPriority, TicketStatus } from "@/types/api/crm.types";

/** CRM classes are namespaced (admin.css has its own .btn, .card…): k("btn pri") → "crm-btn crm-pri". */
export const k = (s: string) =>
  s
    .split(/\s+/)
    .filter(Boolean)
    .map((c) => `crm-${c}`)
    .join(" ");

// ── Icons (the design's sprite) ─────────────────────────────────────────────

const P: Record<string, ReactNode> = {
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  alert: (<><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5h.01" /></>),
  warn: (<><path d="M12 3l10 18H2z" /><path d="M12 10v4M12 17.5h.01" /></>),
  clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  inbox: (<><path d="M3 13l3-8h12l3 8v6H3z" /><path d="M3 13h5l1 3h6l1-3h5" /></>),
  users: (<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6" /></>),
  truck: (<><path d="M2.5 6.5h11v10h-11zM13.5 10h4l3.5 3.5v3h-7.5" /><circle cx="7" cy="18" r="1.8" /><circle cx="17.5" cy="18" r="1.8" /></>),
  box: <path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8" />,
  left: <path d="M15 6l-6 6 6 6" />,
  right: <path d="M9 6l6 6-6 6" />,
  chev: <path d="M7 10l5 5 5-5" />,
  up: <path d="M7 14l5-5 5 5" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  search: (<><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>),
  plus: <path d="M12 5v14M5 12h14" />,
  grid: (<><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>),
  kanban: (<><rect x="3.5" y="4" width="5" height="16" rx="1.5" /><rect x="10.5" y="4" width="5" height="10" rx="1.5" /><rect x="17.5" y="4" width="3" height="13" rx="1.5" /></>),
  list: <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />,
  mail: (<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3.5 6.5l8.5 6.5 8.5-6.5" /></>),
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />,
  pin: (<><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>),
  note: (<><path d="M5 4h14v11l-5 5H5z" /><path d="M14 20v-5h5M8 9h8M8 13h4" /></>),
  cart: (<><path d="M3 4h2l2.4 11h11L21 7H6.2" /><circle cx="9" cy="19.5" r="1.5" /><circle cx="17" cy="19.5" r="1.5" /></>),
  doc: (<><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z" /><path d="M14 3v5h5M8 13h8M8 17h6" /></>),
  bell: (<><path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></>),
  more: <path d="M12 5.5h.01M12 12h.01M12 18.5h.01" strokeWidth={3} />,
  sync: <path d="M20 11a8 8 0 0 0-14.6-4.4L4 8M4 4v4h4M4 13a8 8 0 0 0 14.6 4.4L20 16M20 20v-4h-4" />,
  info: (<><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.5h.01" /></>),
};

export function CIcon({ name }: { name: string }) {
  return (
    <svg className={k("i")} viewBox="0 0 24 24" aria-hidden="true">
      {P[name] ?? P.doc}
    </svg>
  );
}

// ── Time and money (the design's helpers, in the admin's own timezone) ──────

export const H = 3_600_000;
export const DAY = 24 * H;
const MIN = 60_000;

export const money = (v: number) => "$" + Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtD = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined });
};
export const tfmt = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/** "5 min ago", "3 h ago", "yesterday", "12 days ago", then a date. */
export function rel(iso: string): string {
  const t = new Date(iso).getTime();
  const d = Date.now() - t;
  if (d < H) return `${Math.max(1, Math.round(d / MIN))} min ago`;
  if (d < DAY) return `${Math.round(d / H)} h ago`;
  const n = Math.round(d / DAY);
  return n === 1 ? "yesterday" : n < 60 ? `${n} days ago` : fmtD(iso);
}

export type Tone = "bad" | "warn" | "ok" | "off" | "";

/** A due date: "2 days overdue" (bad), "Today" (warn), "Tomorrow", or the date. */
export function dueTxt(iso: string): [string, Tone] {
  const d0 = new Date();
  d0.setHours(0, 0, 0, 0);
  const d1 = new Date(iso);
  d1.setHours(0, 0, 0, 0);
  const n = Math.round((d1.getTime() - d0.getTime()) / DAY);
  if (n < 0) return [`${-n} day${n === -1 ? "" : "s"} overdue`, "bad"];
  if (n === 0) return ["Today", "warn"];
  if (n === 1) return ["Tomorrow", ""];
  return [fmtD(iso), ""];
}

/** Where a ticket stands on its reply clock. */
export function slaTxt(t: { status: TicketStatus; slaDueAt: string }): [string, Tone] {
  if (t.status === "solved") return ["Solved", "ok"];
  if (t.status === "pending") return ["Waiting on them", "off"];
  const d = new Date(t.slaDueAt).getTime() - Date.now();
  const h = Math.abs(d) / H;
  const s = h < 1 ? `${Math.round(h * 60)} min` : h < 48 ? `${Math.round(h)} h` : `${Math.round(h / 24)} days`;
  return d < 0 ? [`Overdue ${s}`, "bad"] : h < 4 ? [`Due in ${s}`, "warn"] : [`Due in ${s}`, "off"];
}

export const PRI: Record<TicketPriority, [string, Tone]> = { urgent: ["Urgent", "bad"], high: ["High", "warn"], normal: ["Normal", ""], low: ["Low", "off"] };
/** The priority dot's colour class (the design: info = navy). */
export const priDot = (p: TicketPriority) => ({ urgent: "bad", high: "warn", normal: "info", low: "off" })[p];
export const STATUS_LABEL: Record<TicketStatus, string> = { open: "Open", pending: "Waiting on them", solved: "Solved" };
export const toneC = (t: Tone) => ({ bad: "t-bad", warn: "t-warn", ok: "t-ok", off: "muted", "": "muted" })[t];

export const initialsOf = (name: string) =>
  name
    .replace(/[&.]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

// ── Small pieces ────────────────────────────────────────────────────────────

/** A teammate (or the dashed circle for nobody). */
export function Av({ member, size = "" }: { member: CrmMember | null | undefined; size?: "" | "xs" | "sm" | "lg" }) {
  return member ? (
    <span className={k(`av team ${size}`)} title={member.name}>
      {initialsOf(member.name)}
    </span>
  ) : (
    <span className={k(`av none ${size}`)} title="Unassigned">
      –
    </span>
  );
}

/** A customer or supplier. */
export const CAv = ({ name, size = "" }: { name: string; size?: "" | "xs" | "sm" | "lg" }) => (
  <span className={k(`av ${size}`)} aria-hidden="true">
    {initialsOf(name)}
  </span>
);

const TAG_TONE: Record<string, string> = { VIP: "navy", "At risk": "bad" };
export const Tag = ({ tag }: { tag: string }) => <span className={k(`tag ${TAG_TONE[tag] ?? ""}`)}>{tag}</span>;

export const StagePill = ({ stage, label }: { stage: PipelineStage; label: string }) => <span className={k(`st sd-${stage}`)}>{label}</span>;

export const ErrText = ({ children }: { children?: string | null }) =>
  children ? (
    <span className={k("err")}>
      <CIcon name="alert" />
      {children}
    </span>
  ) : null;

/** A labelled form field with an optional error. */
export function Field({ label, htmlFor, error, children }: { label: ReactNode; htmlFor?: string; error?: string | null; children: ReactNode }) {
  return (
    <label className={k("field")} htmlFor={htmlFor}>
      <span className={k("lab")}>{label}</span>
      {children}
      <ErrText>{error}</ErrText>
    </label>
  );
}

/** `{ field: message }` from a 400 response, or {}. */
export function fieldErrors(err: unknown): Record<string, string> {
  const body = (err as { response?: { status?: number; data?: { data?: unknown } } })?.response;
  if (body?.status === 400 && body.data?.data && typeof body.data.data === "object") {
    return Object.fromEntries(Object.entries(body.data.data as Record<string, unknown>).filter(([, v]) => typeof v === "string")) as Record<string, string>;
  }
  return {};
}

// ── Dialog (native <dialog>, as the design) ─────────────────────────────────

export function Dialog({
  open,
  title,
  onClose,
  onSubmit,
  wide,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  /** Enter or the submit button. */
  onSubmit?: () => void;
  wide?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      d.querySelector<HTMLElement>("input:not([type=hidden]),textarea,select")?.focus();
    }
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={k(`dlg ${wide ? "wide" : ""}`)}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      {open ? (
        <form
          className={k("dform")}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit?.();
          }}
        >
          <div className={k("dh")}>
            <h2>{title}</h2>
            <button type="button" className={k("btn ghost sm")} aria-label="Close" onClick={onClose}>
              <CIcon name="x" />
            </button>
          </div>
          {children}
        </form>
      ) : null}
    </dialog>
  );
}
