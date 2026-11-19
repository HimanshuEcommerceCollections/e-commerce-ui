"use client";
import type { TicketStatus, TicketTopic } from "@/types/api/seller.types";
import { Ico, Pill, initials, type IconName } from "./ui";

/** designs/seller/seller-support.html */
export const TICKET_STATUS: Record<TicketStatus, { tone: "info" | "warn" | "ok"; label: string }> = {
  OPEN: { tone: "info", label: "With our team" },
  WAITING: { tone: "warn", label: "Waiting for you" },
  RESOLVED: { tone: "ok", label: "Resolved" },
};

export const TicketPill = ({ status }: { status: TicketStatus }) => <Pill tone={TICKET_STATUS[status].tone}>{TICKET_STATUS[status].label}</Pill>;

export const TOPICS: { key: TicketTopic; icon: IconName; title: string; hint: string; team: string }[] = [
  { key: "products", icon: "list", title: "Products & listings", hint: "Edits, prices, photos, review notes", team: "Catalog team" },
  { key: "orders", icon: "cart", title: "Orders & shipping", hint: "An order, a return, delivery or stock", team: "Seller support" },
  { key: "payments", icon: "shield", title: "Payments & payouts", hint: "A payout, fees or bank details", team: "Payments" },
  { key: "account", icon: "doc", title: "Account & documents", hint: "Your profile, insurance, W-9, access", team: "Supplier partnerships" },
  { key: "other", icon: "mail", title: "Something else", hint: "Anything that doesn't fit above", team: "Seller support" },
];

export const ATTACH_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,.csv,.xlsx";
export const MAX_FILES = 5;
export const MAX_FILE_BYTES = 4 * 1024 * 1024;

/** Keeps up to 5 files of the allowed types and size; returns them and a problem to show, if any. */
export function pickFiles(list: FileList | null): { files: File[]; problem: string | null } {
  const all = Array.from(list ?? []);
  const ok = all.filter((f) => /\.(pdf|jpe?g|png|webp|csv|xlsx)$/i.test(f.name) && f.size <= MAX_FILE_BYTES).slice(0, MAX_FILES);
  const problem =
    all.length > MAX_FILES
      ? `Attach up to ${MAX_FILES} files`
      : ok.length < all.length
        ? "Some files were left out: attach PDF, JPG, PNG, WebP, CSV or XLSX files up to 4 MB"
        : null;
  return { files: ok, problem };
}

export function HelpBar() {
  return (
    <div className="sp-helpbar">
      <Ico name="clock" />
      <span>
        We reply within <b>1 business day</b>, Monday–Friday. Urgent order problems are answered first.
      </span>
    </div>
  );
}

export const Who = ({ name, team }: { name: string; team?: string }) => (
  <span className="sp-who">
    <span className="sp-av-s">{initials(name)}</span>
    {name}
    {team ? ` · ${team}` : ""}
  </span>
);
