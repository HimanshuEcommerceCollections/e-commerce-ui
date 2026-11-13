import type { SupplierRow, SupplierStage } from "@/types/api/supplier.types";

/** The design's stage pills: [pill class, label]. DOCUMENTS splits on who has to act. */
export function stagePill(row: Pick<SupplierRow, "stage" | "view">): [string, string] {
  const map: Record<SupplierStage, [string, string]> = {
    DRAFT: ["p-grey", "Draft"],
    APPLIED: ["p-info", "New lead"],
    SCREENED: ["p-info", "Needs scorecard"],
    SCORECARD: ["p-info", "Needs scorecard"],
    DOCUMENTS: row.view === "todo" ? ["p-navy", "Documents to verify"] : ["p-warn", "Waiting for documents"],
    APPROVED: ["p-ok", "Approved"],
    DECLINED: ["p-bad", "Declined"],
    AUTO_REJECTED: ["p-grey", "Auto-rejected"],
    SUSPENDED: ["p-bad", "Suspended"],
  };
  return map[row.stage];
}

/** The tracker: Applied, Screened, Scorecard, Documents, Approved. */
export const TRACK = ["Applied", "Screened", "Scorecard", "Documents", "Approved"];
export function trackIndex(stage: SupplierStage): { idx: number; fail: boolean } {
  switch (stage) {
    case "AUTO_REJECTED":
      return { idx: 1, fail: true };
    case "DECLINED":
      return { idx: 2, fail: true };
    case "DOCUMENTS":
      return { idx: 3, fail: false };
    case "APPROVED":
    case "SUSPENDED":
      return { idx: 5, fail: false };
    default:
      return { idx: 2, fail: false };
  }
}

export const SCORING: SupplierStage[] = ["APPLIED", "SCREENED", "SCORECARD"];

export const shortDay = (iso: string | null | undefined) =>
  iso ? new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export const daysUntil = (isoDate: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(`${isoDate}T00:00:00`).getTime() - today.getTime()) / 86_400_000);
};

export const supplierInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

/** A stable pastel for the initials tile. */
export const hue = (id: string) => id.split("").reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
