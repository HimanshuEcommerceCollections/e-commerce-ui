// ─── Requests ────────────────────────────────────────────────────────────────

export interface AddressRequest {
  label: string;           // max 50, e.g. "Home", "Office"
  recipientName: string;   // max 200
  phone?: string;          // max 20, optional leading +
  addressLine1: string;    // max 255
  addressLine2?: string;   // max 255
  city: string;            // max 100
  state: string;           // max 100
  postalCode: string;      // max 20
  country: string;         // max 100
  isDefault?: boolean;     // first address is always default regardless
}

// ─── Responses ───────────────────────────────────────────────────────────────

export interface AddressResponse {
  id: string;
  label: string;
  recipientName: string;
  phone: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;   // ISO-8601 UTC
  updatedAt: string;
}
