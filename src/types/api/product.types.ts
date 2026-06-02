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

export interface ProductSummaryResponse {
  id: string;
  name: string;
  price: number;
  stockQuantity: number;
  sku: string;
  status: ProductStatus;
  categoryName: string | null;     // denormalized
  primaryImageUrl: string | null;
  merchantId: string;
  createdAt: string;               // ISO-8601 UTC
}

export interface ProductDetailResponse {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stockQuantity: number;
  sku: string;
  status: ProductStatus;
  category: CategoryResponse | null;
  images: ProductImageResponse[];
  merchantId: string;
  createdAt: string;
  updatedAt: string;
}
