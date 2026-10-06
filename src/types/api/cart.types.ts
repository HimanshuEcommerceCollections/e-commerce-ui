// ─── Requests ────────────────────────────────────────────────────────────────

export interface CartItemRequest {
  productId: string;  // UUID
  quantity: number;   // 1–999
}

export interface CartItemUpdateRequest {
  quantity: number;   // 1–999
}

/** A guest's line, kept in the browser until sign-in or checkout. */
export interface CartLineInput {
  productId: string;
  quantity: number;
}

// ─── Responses ───────────────────────────────────────────────────────────────

export interface CartItemResponse {
  productId: string;
  productName: string;
  parentId: string;
  sku: string;
  variantName: string | null;
  color: string | null;
  size: string | null;
  urlSlug: string | null;
  primaryImageUrl: string | null;
  unitPrice: number;
  mrp: number | null;
  taxRate: number;            // percent
  quantity: number;
  stockQuantity: number;      // FR-ST-13: what can still be bought
  subtotal: number;           // unitPrice × quantity
  lineTotal: number;          // same as subtotal
  taxAmount: number;
  available: boolean;         // false if product was deactivated after being added
}

/**
 * The signed-in cart (GET /api/cart) or a priced guest cart (POST /api/cart/preview,
 * where cartId and customerId are null).
 */
export interface CartResponse {
  cartId: string | null;
  customerId: string | null;
  items: CartItemResponse[];
  totalItems: number;          // total quantity across available items
  totalPrice: number;          // subtotal of available items
  savings: number;             // Σ (MRP − price) × qty
  taxTotal: number;            // FR-ST-09
  shippingEstimate: number;    // Standard shipping for this cart
  grandTotalEstimate: number;
  pricesIncludeTax: boolean;
  freeShippingThreshold: number | null;
  updatedAt: string | null;    // ISO-8601 UTC
}
