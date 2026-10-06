// ─── Requests ────────────────────────────────────────────────────────────────

export interface CategoryCreateRequest {
  name: string;         // max 100
  slug: string;         // max 120, globally unique
  description?: string; // max 500
  /** Makes it a subcategory ("section") of this department. */
  parentId?: string;
  position?: number;
  /** SKU code segment, e.g. "CL" or "MEN". */
  code?: string;
}

// ─── Responses ───────────────────────────────────────────────────────────────

export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  /** Set on a subcategory: its category (FR-ST-02). */
  parentId: string | null;
  position: number;
  /** SKU code segment, e.g. "CL" (department) or "MEN" (subcategory). */
  code: string | null;
}

/** GET /api/categories/tree: categories → subcategories, with live product counts. */
export interface CategoryTreeNode extends CategoryResponse {
  /** Live (ACTIVE) parent products in the department. */
  productCount: number;
  subcategories: SubcategoryNode[];
}

export interface SubcategoryNode extends CategoryResponse {
  productCount: number;
  /** Product types with live products in this section, e.g. "Jeans". */
  productTypes: { name: string; productCount: number }[];
}
