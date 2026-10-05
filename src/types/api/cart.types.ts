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
  variantName: string | null;
  color: string | null;
  size: string | null;
  primaryImageUrl: string | null;
  unitPrice: number;
  mrp: number | null;
  taxRate: number | null;     // percent
  quantity: number;
  stockQuantity: number;      // FR-ST-13: what can still be bought
  subtotal: number;           // unitPrice × quantity
  available: boolean;         // false if product was deactivated after being added
}

export interface CartResponse {
  cartId: string;
  customerId: string;
  items: CartItemResponse[];
  totalItems: number;          // total quantity across all items
  totalPrice: number;          // sum of all subtotals
  taxTotal: number;            // FR-ST-09
  shippingEstimate: number;    // Standard shipping for this cart
  grandTotalEstimate: number;
  pricesIncludeTax: boolean;
  freeShippingThreshold: number | null;
  updatedAt: string;           // ISO-8601 UTC
}
