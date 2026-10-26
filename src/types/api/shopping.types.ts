// Customer account, shopping side (API contract C1, C3–C6): the account
// summary, returns, buy again, saved items and the customer's reviews.

import type { OrderSummary, ReturnMethod, ReturnRefundTo, ReturnStatus } from "./order.types";

// ─── Summary (C1) ────────────────────────────────────────────────────────────

export interface AccountSummary {
  memberSince: string;
  orders: { total: number; open: number };
  openReturns: number;
  savedItems: number;
  storeCreditBalance: number;
  /** Most recent open order, else the most recent one. */
  latestOrder: OrderSummary | null;
}

// ─── Returns (C3) ────────────────────────────────────────────────────────────

export interface CustomerReturnItem {
  orderItemId: string;
  productId: string;
  productName: string;
  imageUrl: string | null;
  color: string | null;
  size: string | null;
  quantity: number;
  amount: number;
}

export interface CustomerReturn {
  id: string;
  rmaNumber: string;
  orderId: string;
  orderNumber: string;
  status: ReturnStatus;
  method: ReturnMethod | null;
  refundTo: ReturnRefundTo;
  estimatedRefund: number;
  refundAmount: number | null;
  createdAt: string;
  dropoffCode: string | null;
  dropoffBy: string | null;
  droppedOffAt: string | null;
  pickupDate: string | null;
  pickupWindow: string | null;
  receivedAt: string | null;
  refundedAt: string | null;
  carrier: string;
  /** 0 Started, 1 Dropped off, 2 Received, 3 Refunded. */
  step: 0 | 1 | 2 | 3;
  items: CustomerReturnItem[];
}

// ─── Buy again (C4) ──────────────────────────────────────────────────────────

export interface BuyAgainItem {
  productId: string;
  slug: string | null;
  parentId: string | null;
  name: string;
  imageUrl: string | null;
  price: number;
  mrp: number | null;
  stock: number;
  color: string | null;
  size: string | null;
  variantName: string | null;
  lastBoughtAt: string;
}

// ─── Saved items (C5) ────────────────────────────────────────────────────────

export interface SavedItem {
  productId: string;
  slug: string | null;
  parentId: string | null;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  price: number;
  mrp: number | null;
  stock: number;
  priceAtSave: number;
  /** max(0, priceAtSave − price). */
  priceDrop: number;
  savedAt: string;
  variantName: string | null;
  color: string | null;
  size: string | null;
}

// ─── Reviews (C6, customer side) ─────────────────────────────────────────────

export interface PendingReview {
  productId: string;
  parentId: string | null;
  productName: string;
  imageUrl: string | null;
  variant: string | null;
  orderNumber: string;
  orderItemId: string;
  deliveredAt: string | null;
}

export type ReviewStatus = "PENDING" | "PUBLISHED" | "REJECTED";

export interface MyReview {
  id: string;
  productId: string;
  parentId: string | null;
  productName: string;
  imageUrl: string | null;
  rating: number;
  title: string;
  body: string;
  recommend: boolean;
  status: ReviewStatus;
  createdAt: string;
}

export interface MyReviews {
  pending: PendingReview[];
  reviews: MyReview[];
}

export interface ReviewInput {
  productId: string;
  rating: number;
  title: string;
  body: string;
  recommend: boolean;
}
