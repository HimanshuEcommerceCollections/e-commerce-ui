import api from "@/lib/Axios";
import type { ApiResponse } from "@/types/api/common.types";
import type {
  GootenCatalog,
  GootenImportRequest,
  GootenLink,
  GootenOrderRow,
  GootenProductDetail,
  GootenShipMethod,
  GootenStatus,
} from "@/types/api/gooten.types";

const BASE = "/api/admin/vendors/gooten";

/** Admin › Vendors › Gooten (print-on-demand). */
const gootenService = {
  status: () => api.get<ApiResponse<GootenStatus>>(`${BASE}/status`),
  catalog: (params: { search?: string; category?: string } = {}) =>
    api.get<ApiResponse<GootenCatalog>>(`${BASE}/catalog`, { params }),
  product: (id: number) => api.get<ApiResponse<GootenProductDetail>>(`${BASE}/catalog/${id}`),
  importProduct: (id: number, body: GootenImportRequest) =>
    api.post<ApiResponse<{ parentId: string; name: string; variants: number }>>(`${BASE}/catalog/${id}/import`, body),
  links: () => api.get<ApiResponse<GootenLink[]>>(`${BASE}/products`),
  updateLink: (id: string, body: { printFileUrl: string }) =>
    api.patch<ApiResponse<{ id: string; printFileUrl: string | null }>>(`${BASE}/products/${id}`, body),
  orders: () => api.get<ApiResponse<GootenOrderRow[]>>(`${BASE}/orders`),
  submitOrder: (orderId: string, shipMethod: GootenShipMethod) =>
    api.post<ApiResponse<{ id: string; vendorOrderId: string; status: string; testMode: boolean }>>(`${BASE}/orders/${orderId}/submit`, { shipMethod }),
  refresh: (submissionId: string) =>
    api.post<ApiResponse<{ id: string; status: string; tracking: string[] }>>(`${BASE}/submissions/${submissionId}/refresh`),
};

export default gootenService;
