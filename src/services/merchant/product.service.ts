import api from "@/lib/Axios";
import type { ApiResponse, PageResponse } from "@/types/api/common.types";
import type {
  ProductSummaryResponse,
  ProductDetailResponse,
  ProductCreateRequest,
  ProductUpdateRequest,
  ProductListParams,
} from "@/types/api/product.types";

const merchantProductService = {
  getMyProducts: (params?: ProductListParams) =>
    api.get<ApiResponse<PageResponse<ProductSummaryResponse>>>("/api/products/my", { params }),

  create: (data: ProductCreateRequest) =>
    api.post<ApiResponse<ProductDetailResponse>>("/api/products", data),

  update: (id: string, data: ProductUpdateRequest) =>
    api.put<ApiResponse<ProductDetailResponse>>(`/api/products/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/api/products/${id}`),
};

export default merchantProductService;
