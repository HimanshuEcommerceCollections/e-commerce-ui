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
  /** Set on a subcategory: its category (FR-ST-02). */
  parentId?: string | null;
  position?: number;
}

/** GET /api/categories/tree: categories → subcategories, with live product counts. */
export interface CategoryTreeNode extends CategoryResponse {
  productCount: number;
  subcategories: (CategoryResponse & { productCount: number })[];
}
