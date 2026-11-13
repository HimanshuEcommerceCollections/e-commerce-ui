import type { ProductStatus } from "./common.types";

// ─── Shared enums (backend common/enums.ts) ──────────────────────────────────

/** Where a product stands for the seller: review state first, then what customers see. */
export type ListingState =
  | "DRAFT"
  | "SUBMITTED"
  | "IN_REVIEW"
  | "CHANGES_REQUESTED"
  | "LIVE"
  | "CHANGE_PENDING"
  | "SUSPENDED"
  | "ARCHIVED";

export type SubmissionKind = "NEW_PRODUCT" | "EDIT" | "DELIST";
export type SubmissionStatus = "SUBMITTED" | "IN_REVIEW" | "CHANGES_REQUESTED" | "APPROVED" | "REJECTED" | "WITHDRAWN";
export const OPEN_SUBMISSION_STATUSES: SubmissionStatus[] = ["SUBMITTED", "IN_REVIEW", "CHANGES_REQUESTED"];

// ─── Catalog (GET /api/seller/catalog) ───────────────────────────────────────

export interface SellerVariant {
  sku: string;
  variantName: string | null;
  status: ProductStatus;
  price: number;
  mrp: number | null;
  stockQuantity: number;
  /** The SKU's own threshold, or the store default. */
  lowStockThreshold: number;
  /** Last stock movement (or creation). */
  stockUpdatedAt: string;
}

export interface SellerProduct {
  id: string;
  code: string;
  name: string;
  brand: string | null;
  category: string | null;
  subcategory: string | null;
  state: ListingState;
  openSubmission: {
    reference: string;
    kind: SubmissionKind;
    status: SubmissionStatus;
    reviewNote: string | null;
    submittedAt: string;
  } | null;
  imageUrl: string | null;
  updatedAt: string;
  variants: SellerVariant[];
}

/** GET /api/seller/products/:id/rows: template rows keyed by the template's headers. */
export type TemplateRow = Record<string, string>;

export interface StockMove {
  at: string;
  sku: string;
  from: number;
  to: number;
  /** SELLER, ORDER, IMPORT, ADJUSTMENT… */
  source: string;
  reason: string | null;
}

export interface StockChange {
  sku: string;
  from: number;
  to: number;
}

export interface StockUpdateResult {
  updated: StockChange[];
  errors: { sku: string; reason: string }[];
}

// ─── Submissions ─────────────────────────────────────────────────────────────

export interface SubmissionSummary {
  reference: string;
  kind: SubmissionKind;
  status: SubmissionStatus;
  parentProductId: string;
  parentProductCode: string;
  productName: string;
  skus: string[];
}

interface Person {
  id: string;
  email: string;
  fullName: string;
}

export interface SubmissionListItem extends SubmissionSummary {
  source: "UPLOAD" | "FORM";
  merchant: Person;
  reviewer: Person | null;
  submittedAt: string;
  decidedAt: string | null;
}

export interface FieldChange {
  column: string;
  before: string;
  after: string;
}

export interface SubmissionDetail extends SubmissionSummary {
  source: "UPLOAD" | "FORM";
  fileName: string | null;
  sellerNote: string | null;
  reviewNote: string | null;
  merchant: Person;
  reviewer: Person | null;
  submittedAt: string;
  reviewStartedAt: string | null;
  decidedAt: string | null;
  changes: { sku: string; action: "ADD" | "UPDATE" | "DELIST"; fields: FieldChange[] }[];
  events: { status: SubmissionStatus; actorEmail: string | null; note: string | null; createdAt: string }[];
}

export interface RowError {
  row: number;
  sku: string | null;
  reason: string;
}

/** POST /api/seller/submissions (file or form rows). */
export interface SubmissionReport {
  fileName: string;
  totalRows: number;
  acceptedRows: number;
  failedRows: number;
  errors: RowError[];
  warnings: { row: number; sku: string | null; message: string }[];
  ignoredColumns: string[];
  submissions: SubmissionSummary[];
  /** SKUs saved as drafts without being sent for review. */
  draftsSaved: string[];
  unchangedRows: number;
  stockUpdates: StockChange[];
  imagesChecked: boolean;
  durationMs: number;
}

/** POST /api/seller/submissions/check: the automated checks, nothing written. */
export interface RowCheck {
  row: number;
  sku: string | null;
  parentProductId: string | null;
  name: string;
  status: "OK" | "NOTE" | "FIX";
  issues: { level: "error" | "warning"; message: string }[];
}

export interface UploadCheck {
  fileName: string;
  totalRows: number;
  ready: number;
  withNote: number;
  toFix: number;
  ignoredColumns: string[];
  rows: RowCheck[];
}

export interface PriceChangeRequest {
  items: { sku: string; price: number; mrp?: number }[];
  note?: string;
}

/** GET /api/seller/price-changes */
export interface PriceChange {
  reference: string;
  status: SubmissionStatus;
  parentProductId: string;
  productName: string;
  sku: string;
  from: number;
  to: number;
  submittedAt: string;
  decidedAt: string | null;
  reviewNote: string | null;
}

/** GET /api/seller/activity: the catalog team's steps on the seller's submissions. */
export interface ReviewActivity {
  id: string;
  at: string;
  status: SubmissionStatus;
  note: string | null;
  reference: string;
  kind: SubmissionKind;
  currentStatus: SubmissionStatus;
  parentProductId: string;
  productCode: string;
  productName: string;
}

// ─── Orders and earnings ─────────────────────────────────────────────────────

export type SellerOrderFilter = "TO_SHIP" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export interface SellerOrderItem {
  sku: string;
  productName: string;
  variantName: string | null;
  imageUrl: string | null;
  quantity: number;
  returnedQuantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface SellerOrder {
  orderNumber: string;
  paidAt: string;
  status: string;
  fulfilmentStatus: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  /** "City, State" only. */
  shipTo: string;
  /** Only this seller's lines. */
  items: SellerOrderItem[];
  subtotal: number;
  refunded: number;
}

export interface EarningsPeriod {
  /** "YYYY-MM" (UTC). */
  period: string;
  orders: number;
  units: number;
  gross: number;
  refunds: number;
  net: number;
}

export interface SellerEarnings {
  currency: string;
  from: string;
  /** Paid orders with the seller's items not shipped yet. */
  openOrders: number;
  periods: EarningsPeriod[];
  totals: Omit<EarningsPeriod, "period">;
  /** Always null for now: there's no payout ledger yet. */
  payoutSchedule: null;
}

// ─── Documents (GET/POST /api/seller/documents) ──────────────────────────────

export type SellerDocumentStatus = "PENDING" | "VERIFIED" | "REJECTED" | "EXPIRED";

export interface SellerDocument {
  id: string;
  type: string;
  label: string;
  fileName: string;
  status: SellerDocumentStatus;
  expiresAt: string | null;
  uploadedAt: string;
  note: string | null;
}
