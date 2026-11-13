// Review queue (Admin › Submissions): tabs, automatic checks and decisions.
import type { SubmissionKind, SubmissionStatus } from "./admin.types";

export type QueueView = "all" | "mine" | "new" | "price" | "delist" | "flagged" | "due" | "reviewed";
export type QueueItemType = "new" | "edit" | "price" | "delist";
export type CheckStatus = "pass" | "warn" | "fail";

export interface QueueCheck {
  key: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

type Person = { id: string; email: string; fullName: string };

export interface QueueItem {
  reference: string;
  kind: SubmissionKind;
  type: QueueItemType;
  status: SubmissionStatus;
  parentProductId: string;
  parentProductCode: string;
  productName: string;
  brand: string | null;
  skus: string[];
  source: string;
  fileName: string | null;
  /** Submissions from one upload share a batch. */
  batch: string | null;
  sellerNote: string | null;
  reviewNote: string | null;
  merchant: Person;
  reviewer: Person | null;
  assignedToMe: boolean;
  submittedAt: string;
  decidedAt: string | null;
  updatedAt: string;
  /** Open items only: the 2-business-day commitment. */
  sla: { businessHours: number; hoursLeft: number; state: "on_track" | "due_soon" | "overdue" } | null;
  priceChange: { sku: string; from: number; to: number; percent: number; skus: number } | null;
  checks: QueueCheck[];
  /** A check didn't pass (warning or failure): review on its own. */
  flagged: boolean;
  /** A required check failed: can't be approved. */
  blocked: boolean;
}

export interface PriceHistoryEntry {
  at: string;
  sku: string | null;
  action: string;
  before: string | null;
  after: string | null;
  summary: string;
  actor: string | null;
  source: string;
  note: string | null;
}

export interface QueueItemDetail extends QueueItem {
  priceHistory: PriceHistoryEntry[];
  previous: string | null;
  next: string | null;
}

export interface QueueCounts {
  all: number;
  mine: number;
  new: number;
  price: number;
  delist: number;
  flagged: number;
  due: number;
  dueSoon: number;
  overdue: number;
  reviewed: number;
  reviewedToday: number;
}

export interface QueueListParams {
  view?: QueueView;
  kind?: SubmissionKind;
  merchantId?: string;
  q?: string;
  page?: number;
  size?: number;
}

export type QueueDecision = "approve" | "request-changes" | "reject";

export interface QueueDecisionInput {
  decision: QueueDecision;
  reason?: string;
  fixes?: string[];
  note?: string;
}

export interface BulkApproveResult {
  approved: number;
  skipped: number;
  results: { reference: string; approved: boolean; status?: string; error?: string }[];
}
