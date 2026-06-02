// ─── Requests ────────────────────────────────────────────────────────────────

export interface CategoryCreateRequest {
  name: string;         // max 100
  slug: string;         // max 120, globally unique
  description?: string; // max 500
}

// ─── Responses ───────────────────────────────────────────────────────────────

export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}
