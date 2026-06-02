// ─── Requests ────────────────────────────────────────────────────────────────

export interface CartItemRequest {
  productId: string;  // UUID
  quantity: number;   // 1–999
}

export interface CartItemUpdateRequest {
  quantity: number;   // 1–999
}

// ─── Responses ───────────────────────────────────────────────────────────────

export interface CartItemResponse {
  productId: string;
  productName: string;
  sku: string;
  primaryImageUrl: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;    // unitPrice × quantity
  available: boolean;  // false if product was deactivated after being added
}

export interface CartResponse {
  cartId: string;
  customerId: string;
  items: CartItemResponse[];
  totalItems: number;   // total quantity across all items
  totalPrice: number;   // sum of all subtotals
  updatedAt: string;    // ISO-8601 UTC
}
