"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { create } from "zustand";
import type { ProductStatus } from "@/types/api/common.types";
import type { StockStatus } from "@/types/api/admin.types";

// ── Icons (the preview's sprite, as components) ─────────────────────────────

const PATHS: Record<string, ReactNode> = {
  box: (<><path d="M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5z" /><path d="M3.5 7.5L12 12l8.5-4.5M12 12v9" /></>),
  orders: (<><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6M9 16h3" /></>),
  stack: (<><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5M3 17.5l9 4.5 9-4.5" /></>),
  users: (<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5" /><path d="M15.5 4.8a3.5 3.5 0 010 6.4M18 14.8c1.8.8 3 2.5 3.5 5.2" /></>),
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  search: (<><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></>),
  upload: <path d="M12 16V4M7 9l5-5 5 5M4 16v4h16v-4" />,
  download: <path d="M12 4v12M7 11l5 5 5-5M4 16v4h16v-4" />,
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  info: (<><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.5v.01" /></>),
  file: (<><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4M9 12h6M9 16h6" /></>),
  ext: <path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" />,
  logout: <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />,
  lock: (<><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></>),
};

export function Icon({ name, size, className }: { name: keyof typeof PATHS | string; size?: number; className?: string }) {
  return (
    <svg className={`icon ${className ?? ""}`} viewBox="0 0 24 24" aria-hidden="true" style={size ? { width: size, height: size } : undefined}>
      {PATHS[name] ?? PATHS.box}
    </svg>
  );
}

// ── Formatting ──────────────────────────────────────────────────────────────

export const money = (n: number | null | undefined, currency = "USD") =>
  n === null || n === undefined
    ? "—"
    : new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export const dateTime = (iso: string) => {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  };
};

// ── Status pills ────────────────────────────────────────────────────────────

/** INACTIVE is shown as "Unpublished", matching the admin design. */
export const PRODUCT_STATUS_LABEL: Record<ProductStatus | "MIXED", string> = {
  ACTIVE: "Active",
  DRAFT: "Draft",
  INACTIVE: "Unpublished",
  ARCHIVED: "Archived",
  MIXED: "Mixed",
};
const PRODUCT_PILL: Record<ProductStatus | "MIXED", string> = {
  ACTIVE: "p-ok",
  DRAFT: "p-grey",
  INACTIVE: "p-warn",
  ARCHIVED: "p-grey",
  MIXED: "p-info",
};
export const ProductPill = ({ status }: { status: ProductStatus | "MIXED" }) => (
  <span className={`pill ${PRODUCT_PILL[status]}`}>{PRODUCT_STATUS_LABEL[status]}</span>
);

const STOCK: Record<StockStatus, [string, string]> = {
  IN_STOCK: ["In stock", "p-ok"],
  LOW_STOCK: ["Low stock", "p-warn"],
  OUT_OF_STOCK: ["Out of stock", "p-bad"],
};
export const StockPill = ({ status }: { status: StockStatus }) => (
  <span className={`pill ${STOCK[status][1]}`}>{STOCK[status][0]}</span>
);

export const ORDER_STATUS: Record<string, [string, string]> = {
  PENDING_PAYMENT: ["Pending payment", "p-warn"],
  PAID: ["Paid · to fulfil", "p-info"],
  CONFIRMED: ["Confirmed", "p-info"],
  SHIPPED: ["Shipped", "p-info"],
  DELIVERED: ["Delivered", "p-ok"],
  CANCELLED: ["Cancelled", "p-grey"],
  PAYMENT_FAILED: ["Payment failed", "p-bad"],
  REFUNDED: ["Refunded", "p-grey"],
};
export const OrderPill = ({ status }: { status: string }) => {
  const [label, cls] = ORDER_STATUS[status] ?? [status, "p-grey"];
  return <span className={`pill ${cls}`}>{label}</span>;
};

const PAYMENT: Record<string, [string, string]> = {
  PENDING: ["Pending", "p-warn"],
  SUCCEEDED: ["Paid", "p-ok"],
  FAILED: ["Failed", "p-bad"],
  REFUNDED: ["Refunded", "p-grey"],
};
export const PaymentPill = ({ status }: { status: string | null }) => {
  if (!status) return <span className="pill p-grey">—</span>;
  const [label, cls] = PAYMENT[status] ?? [status, "p-grey"];
  return <span className={`pill ${cls}`}>{label}</span>;
};

// ── Thumbnail ───────────────────────────────────────────────────────────────

export function Thumb({ src }: { src: string | null }) {
  return (
    <span className="thumb">
      {src ? (
        // Catalog images are arbitrary CDN URLs, so next/image's domain list doesn't apply.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" onError={(e) => e.currentTarget.remove()} />
      ) : null}
      <Icon name="box" />
    </span>
  );
}

// ── Pager (0-based pages, as the API returns them) ─────────────────────────

export function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return <div className="pager" />;
  // A window of at most 7 page buttons around the current page.
  const start = Math.max(0, Math.min(page - 3, pages - 7));
  const nums = Array.from({ length: Math.min(7, pages) }, (_, i) => start + i);
  return (
    <div className="pager">
      <button disabled={page === 0} onClick={() => onPage(page - 1)} aria-label="Previous">‹</button>
      {nums.map((n) => (
        <button key={n} aria-current={n === page ? "page" : undefined} onClick={() => onPage(n)}>
          {n + 1}
        </button>
      ))}
      <button disabled={page >= pages - 1} onClick={() => onPage(page + 1)} aria-label="Next">›</button>
    </div>
  );
}

export function rangeText(page: number, size: number, shown: number, total: number, noun: string) {
  if (!total) return `0 ${noun}`;
  return `Showing ${page * size + 1}–${page * size + shown} of ${total.toLocaleString()} ${noun}`;
}

// ── Drawer ──────────────────────────────────────────────────────────────────

export function Drawer({
  open,
  title,
  sub,
  children,
  foot,
  onClose,
}: {
  open: boolean;
  title: ReactNode;
  sub?: ReactNode;
  children: ReactNode;
  foot?: ReactNode;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => closeRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  return (
    <>
      <div className={`scrim ${open ? "show" : ""}`} onClick={onClose} />
      <aside className={`drawer ${open ? "show" : ""}`} aria-hidden={!open} role="dialog" aria-label={typeof title === "string" ? title : undefined}>
        <div className="d-head">
          <div>
            <h2>{title}</h2>
            {sub ? <div className="sub">{sub}</div> : null}
          </div>
          <button className="x" ref={closeRef} onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        <div className="d-body">{open ? children : null}</div>
        {foot ? <div className="d-foot">{foot}</div> : null}
      </aside>
    </>
  );
}

// ── Toast ───────────────────────────────────────────────────────────────────

const useToastStore = create<{ text: string; show: boolean; error: boolean }>(() => ({ text: "", show: false, error: false }));
let toastTimer: ReturnType<typeof setTimeout> | undefined;

export function toast(text: string, error = false) {
  useToastStore.setState({ text, show: true, error });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => useToastStore.setState({ show: false }), error ? 5000 : 2800);
}

export function Toast() {
  const { text, show, error } = useToastStore();
  return (
    <div className={`toast ${show ? "show" : ""} ${error ? "err" : ""}`} role="status" aria-live="polite">
      <Icon name={error ? "info" : "check"} />
      <span>{text}</span>
    </div>
  );
}

/** Debounces a changing value (for search boxes). */
export function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms, setV]);
  return v;
}
