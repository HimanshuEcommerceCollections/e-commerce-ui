// Supplier onboarding: the applicant's application (/api/seller-onboarding)
// and the admin supplier approvals (/api/admin/supplier-applications).

export type SupplierStage =
  | "DRAFT"
  | "APPLIED"
  | "SCREENED"
  | "SCORECARD"
  | "DOCUMENTS"
  | "APPROVED"
  | "DECLINED"
  | "AUTO_REJECTED"
  | "SUSPENDED";

export type SupplierView = "todo" | "docs" | "active" | "closed" | "all";

export type SupplierDocumentType = "W9" | "AGREEMENT" | "INSURANCE";
export type SupplierDocumentStatus = "PENDING" | "VERIFIED" | "REJECTED" | "EXPIRED";

export interface SupplierDocument {
  id: string;
  type: SupplierDocumentType | string;
  label: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  status: SupplierDocumentStatus;
  /** YYYY-MM-DD */
  expiresAt: string | null;
  uploadedAt: string;
  note: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

export interface RequiredDocument {
  type: SupplierDocumentType;
  label: string;
  expires: boolean;
}

/** Every field is a string (or list) while the application is a draft. */
export interface ApplicationForm {
  legalName?: string;
  tradingName?: string;
  ein?: string;
  website?: string;
  businessType?: string;
  yearsInBusiness?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  categories?: string[];
  productCount?: string;
  ownBrand?: string;
  brands?: string;
  usWarehouse?: string;
  warehouseState?: string;
  shipsAllStates?: string;
  handlingTime?: string;
  carriers?: string[];
  productData?: string;
  moq?: string;
  notes?: string;
}

export interface MyApplication {
  id: string;
  reference: string;
  stage: SupplierStage;
  companyName: string | null;
  contactName: string;
  email: string;
  /** The form step to resume at (0–4). */
  step: number;
  form: ApplicationForm;
  submittedAt: string | null;
  updatedAt: string;
  failedChecks: string[];
  declineReason: string | null;
  suspensionReason: string | null;
  documents: SupplierDocument[];
  requiredDocuments: RequiredDocument[];
}

export interface SaveDraftRequest {
  step?: number;
  companyName?: string;
  form?: ApplicationForm;
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export interface SupplierRow {
  id: string;
  reference: string;
  stage: SupplierStage;
  view: SupplierView | "draft";
  documentsToVerify: number;
  companyName: string;
  contactName: string;
  email: string;
  categories: string[];
  usWarehouse: string | null;
  warehouseState: string | null;
  /** Effective score: the override when set, else the weighted total. */
  score: number | null;
  documentsUploaded: number;
  documentsRequired: number;
  insuranceExpiresAt: string | null;
  submittedAt: string;
}

export interface SupplierCounts {
  todo: number;
  docs: number;
  active: number;
  suspended: number;
  closed: number;
  all: number;
  expiring: number;
}

export interface SupplierList {
  counts: SupplierCounts;
  expiring: Array<{ id: string; companyName: string; expiresAt: string | null; days: number }>;
  items: SupplierRow[];
}

export interface ScreeningCheck {
  key: string;
  label: string;
  passed: boolean;
  reason: string;
}

export interface ScorecardCriterion {
  key: string;
  label: string;
  description: string;
  weight: number;
}

export interface SupplierDetail extends SupplierRow {
  createdAt: string;
  updatedAt: string | null;
  stageChangedAt: string | null;
  phone: string;
  address: string;
  legacyProducts: string;
  form: ApplicationForm;
  productDataLabel: string | null;
  hasForm: boolean;
  account: { exists: boolean; role: string | null };
  screening: ScreeningCheck[];
  screenedAt: string | null;
  screeningOverriddenBy: string | null;
  screeningOverriddenAt: string | null;
  scorecard: {
    criteria: ScorecardCriterion[];
    passMark: number;
    scores: Record<string, number>;
    computed: number | null;
    override: number | null;
    overrideReason: string | null;
    note: string | null;
    scoredBy: string | null;
    scoredAt: string | null;
  };
  documents: SupplierDocument[];
  requiredDocuments: RequiredDocument[];
  declineReason: string | null;
  declinedBy: string | null;
  declinedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  resaleCertificateIssuedAt: string | null;
  suspensionReason: string | null;
  suspendedBy: string | null;
  suspendedAt: string | null;
  reinstatedAt: string | null;
  lastReminderAt: string | null;
  suspensionReasons: string[];
  adminNote: string | null;
}
