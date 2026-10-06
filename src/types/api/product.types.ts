import type { ProductStatus } from "./common.types";
import type { CategoryResponse } from "./category.types";

// ─── Shared sub-shapes ───────────────────────────────────────────────────────

export interface ProductImageRequest {
  url: string;            // max 2048
  altText?: string;       // max 255
  primary?: boolean;
  width?: number;
  height?: number;
  contentType?: string;   // e.g. "image/webp", max 100
  fileSizeBytes?: number;
  storageKey?: string;    // S3 / CDN key, max 512
}

export interface ProductListParams {
  page?: number;   // 0-based, default 0
  size?: number;   // default 20
  sort?: string;   // default "createdAt"
}

// ─── Requests ────────────────────────────────────────────────────────────────

export interface ProductCreateRequest {
  name: string;                      // max 255
  description?: string;              // max 5000
  price: number;                     // positive decimal
  stockQuantity: number;             // >= 0
  sku: string;                       // max 100, globally unique
  categoryId?: string;               // UUID
  images?: ProductImageRequest[];    // max 10
}

export interface ProductUpdateRequest {
  name?: string;
  description?: string;
  price?: number;
  stockQuantity?: number;
  sku?: string;
  status?: ProductStatus;
  categoryId?: string;
  images?: ProductImageRequest[];    // replaces entire image list when provided
}

// ─── Responses ───────────────────────────────────────────────────────────────

export interface ProductImageResponse {
  id: string;
  url: string;
  altText: string | null;
  position: number;          // 0-based display order
  primary: boolean;
  width: number | null;
  height: number | null;
  contentType: string | null;
  fileSizeBytes: number | null;
  storageKey: string | null;
}

/** Variant attributes carried by every SKU (FR-IM-02). */
export interface VariantAttributes {
  variantName: string | null;
  color: string | null;
  size: string | null;
}

export interface ProductSummaryResponse extends VariantAttributes {
  id: string;
  name: string;
  price: number;
  mrp: number | null;
  discountPercent: number | null;  // whole percent below MRP
  stockQuantity: number;
  lowStockThreshold: number | null; // this SKU's own; null = store default
  sku: string;
  status: ProductStatus;
  /** Department. */
  categoryId: string | null;
  categoryName: string | null;     // denormalized
  categorySlug: string | null;
  /** Section within the department, e.g. Men. */
  subcategoryId: string | null;
  subcategoryName: string | null;
  subcategorySlug: string | null;
  productType: string | null;
  primaryImageUrl: string | null;
  imageUrls: string[];
  parentId: string;
  parentCode: string;
  parentName: string;
  brand: string | null;
  featured: boolean;
  material: string | null;
  searchKeywords: string | null;
  urlSlug: string | null;
  /** The parent's category attribute values, used as PLP facets (Fit, Connectivity…). */
  attributes: Record<string, string>;
  /** Units sold on paid orders, for the popularity sort (FR-ST-05). */
  unitsSold: number;
  merchantId: string;
  createdAt: string;               // ISO-8601 UTC
}

/** The parent product: the catalog record every variant SKU belongs to. */
export interface ParentProductResponse {
  id: string;
  code: string;
  name: string;
  brand: string | null;
  shortDescription: string | null;
  description: string | null;
  productType: string | null;
  subcategory: CategoryResponse | null;
  keyFeatures: string[];
  whatsIncluded: string | null;
  usageInstructions: string | null;
  warranty: string | null;
  lifestyleImageUrl: string | null;
  sizeChartUrl: string | null;
  infographicUrl: string | null;
  /** Category attribute sheet values, e.g. { Gender: "Men", Fit: "Regular" }. */
  attributes: Record<string, string>;
}

/** One sibling SKU of the same parent, for the PDP variant selector. */
export interface ProductVariantResponse extends VariantAttributes {
  id: string;
  sku: string;
  material: string | null;
  pattern: string | null;
  style: string | null;
  price: number;
  mrp: number | null;
  discountPercent: number | null;
  taxRate: number | null;
  stockQuantity: number;
  lowStockThreshold: number | null;
  status: ProductStatus;
  primaryImageUrl: string | null;
  imageUrls: string[];
  urlSlug: string | null;
}

export interface ProductDetailResponse extends VariantAttributes {
  id: string;
  name: string;
  description: string | null;
  price: number;
  mrp: number | null;
  discountPercent: number | null;
  taxCode: string | null;
  taxRate: number | null;
  stockQuantity: number;
  lowStockThreshold: number | null;
  sku: string;
  status: ProductStatus;
  material: string | null;
  pattern: string | null;
  style: string | null;
  specifications: string | null;
  dimensions: string | null;
  weight: string | null;
  shippingClass: string | null;
  seo: { title: string; metaDescription: string | null; keywords: string | null; urlSlug: string | null };
  category: CategoryResponse | null;
  parent: ParentProductResponse;
  variants: ProductVariantResponse[];   // all live SKUs of the parent, including this one
  images: ProductImageResponse[];
  merchantId: string;
  createdAt: string;
  updatedAt: string;
}
