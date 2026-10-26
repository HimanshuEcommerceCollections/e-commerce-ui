// ─── Requests ────────────────────────────────────────────────────────────────

export interface AddressRequest {
  label?: string;          // max 50, e.g. "Home", "Work"; default "Home" if first, else "Other"
  recipientName: string;   // max 200
  phone?: string;          // max 20, optional leading +
  addressLine1: string;    // max 255
  addressLine2?: string;   // max 255
  city: string;            // max 100
  state: string;           // US: 2-letter code of the 50 states + DC
  postalCode: string;      // US: ^\d{5}(-\d{4})?$
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
