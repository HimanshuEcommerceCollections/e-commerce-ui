// ─── Envelope ────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // 0-based current page index
}

// ─── Enums ───────────────────────────────────────────────────────────────────

/** ROLE_CATALOG manages products, inventory and imports only (FR-AD-08). */
export type UserRole = "ROLE_CUSTOMER" | "ROLE_MERCHANT" | "ROLE_ADMIN" | "ROLE_CATALOG";

export type ProductStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";
