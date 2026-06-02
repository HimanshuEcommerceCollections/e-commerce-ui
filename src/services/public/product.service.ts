import api from "@/lib/Axios";
import type { ApiResponse, PageResponse } from "@/types/api/common.types";
import type {
  ProductSummaryResponse,
  ProductDetailResponse,
  ProductListParams,
} from "@/types/api/product.types";

const publicProductService = {
  getAll: (params?: ProductListParams) =>
    api.get<ApiResponse<PageResponse<ProductSummaryResponse>>>("/api/products", { params }),

  getById: (id: string) =>
    api.get<ApiResponse<ProductDetailResponse>>(`/api/products/${id}`),

  getByCategory: (categoryId: string, params?: ProductListParams) =>
    api.get<ApiResponse<PageResponse<ProductSummaryResponse>>>(
      `/api/products/category/${categoryId}`,
      { params }
    ),
};

export default publicProductService;
