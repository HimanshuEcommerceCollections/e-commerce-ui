// Customer account settings (API contract C8–C13): sessions, 2-step
// verification, notification preferences, store credit, saved payment
// methods and privacy requests.

// ─── Sessions (C8) ───────────────────────────────────────────────────────────

export interface AccountSession {
  id: string;
  /** e.g. "Chrome on Windows". */
  label: string;
  deviceType: string; // "desktop" | "mobile" | "tablet" | ...
  location: string | null;
  lastActiveAt: string;
  current: boolean;
}

// ─── 2-step verification (C9) ────────────────────────────────────────────────

export interface TwoFactorStartResponse {
  challengeId: string;
  phoneMasked: string;
}

// ─── Notification preferences (C10) ──────────────────────────────────────────

export interface NotificationPrefs {
  orderUpdates: boolean;
  deals: boolean;
  newArrivals: boolean;
  priceDrops: boolean;
  backInStock: boolean;
  reviewReminders: boolean;
  smsDelivery: boolean;
  phone: string | null;
}

export type NotificationPrefKey = Exclude<keyof NotificationPrefs, "phone" | "orderUpdates">;

// ─── Store credit & gift cards (C11) ─────────────────────────────────────────

export interface StoreCreditEntry {
  id: string;
  createdAt: string;
  description: string;
  /** Signed: positive adds credit. */
  amount: number;
  type: string;
}

export interface StoreCredit {
  balance: number;
  pendingFromReturns: number;
  currency: string;
  activity: StoreCreditEntry[];
}

export interface RedeemGiftCardResponse {
  added: number;
  balance: number;
}

// ─── Payment methods (C12) ───────────────────────────────────────────────────

export interface SavedPaymentMethod {
  id: string;
  type: string; // "CARD" | "PAYPAL" | ...
  brand: string | null; // "visa", "mastercard", ...
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
  holderName: string | null;
  email: string | null;
  isDefault: boolean;
}

// ─── Privacy (C13) ───────────────────────────────────────────────────────────

export interface DataExportRequest {
  id: string;
  status: string; // "PENDING" | "READY" | ...
  createdAt: string;
  completedAt?: string | null;
  expiresAt?: string | null;
}
