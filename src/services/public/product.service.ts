import api from "@/lib/Axios";
import type { ApiResponse, PageResponse } from "@/types/api/common.types";
import type {
  ProductSummaryResponse,
  ProductDetailResponse,
  ProductListParams,
  ProductCard,
  ProductSearchResponse,
  SearchSuggestResponse,
  ProductReviewsResponse,
  FeaturedReviewsResponse,
  FeaturedReview,
} from "@/types/api/product.types";

const publicProductService = {
  getAll: (params?: ProductListParams) =>
    api.get<ApiResponse<PageResponse<ProductSummaryResponse>>>("/api/products", { params }),

  getById: (id: string) =>
    api.get<ApiResponse<ProductDetailResponse>>(`/api/products/${id}`),

  /** The PDP by its clean URL slug (NFR-04). */
  getBySlug: (slug: string) =>
    api.get<ApiResponse<ProductDetailResponse>>(`/api/products/slug/${encodeURIComponent(slug)}`),

  getByCategory: (categoryId: string, params?: ProductListParams) =>
    api.get<ApiResponse<PageResponse<ProductSummaryResponse>>>(
      `/api/products/category/${categoryId}`,
      { params }
    ),

  /**
   * Server-side listing / search / rails, one card per parent (CONTRACT A1).
   * Pass URLSearchParams so repeatable facets go out as `brand=a&brand=b`.
   */
  search: (params: URLSearchParams) =>
    api.get<ApiResponse<ProductSearchResponse>>("/api/products/search", { params }),

  /** "More in …" rail: same section/type first, then department (A2). id = parent or SKU id. */
  getRelated: (id: string, limit = 4) =>
    api.get<ApiResponse<ProductCard[]>>(`/api/products/${id}/related`, { params: { limit } }),

  /** Header autocomplete; `popular` comes back for an empty q too (A4). */
  suggest: (q: string) =>
    api.get<ApiResponse<SearchSuggestResponse>>("/api/search/suggest", { params: { q } }),

  /** Published reviews of a product with the rating summary (C6). id = parent or SKU id. */
  getReviews: (id: string, params: { page?: number; size?: number; sort?: "recent" | "rating" } = {}) =>
    api.get<ApiResponse<ProductReviewsResponse>>(`/api/products/${id}/reviews`, { params }),

  /** Homepage "What our customers say" (C6). */
  getFeaturedReviews: (limit = 3) =>
    api.get<ApiResponse<FeaturedReviewsResponse | FeaturedReview[]>>("/api/reviews/featured", { params: { limit } }),
};

export default publicProductService;
