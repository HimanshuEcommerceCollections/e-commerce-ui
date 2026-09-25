import api from "@/lib/Axios";
import type { ApiResponse, PageResponse, ProductStatus } from "@/types/api/common.types";
import type { Order } from "@/types/api/order.types";
import type {
  AdminInventoryListParams,
  AdminInventoryRow,
  AdminOrderDetail,
  AdminOrderListParams,
  AdminOrderRow,
  AdminProductDetail,
  AdminProductListParams,
  AdminProductRow,
  CatalogImportReport,
  InventoryStats,
  OrderStats,
  ProductStatusCounts,
} from "@/types/api/admin.types";

const adminService = {
  // Products
  listProducts: (params: AdminProductListParams) =>
    api.get<ApiResponse<PageResponse<AdminProductRow>>>("/api/admin/products", { params }),

  productStatusCounts: (params: Pick<AdminProductListParams, "search" | "categoryId">) =>
    api.get<ApiResponse<ProductStatusCounts>>("/api/admin/products/status-counts", { params }),

  getProduct: (id: string) =>
    api.get<ApiResponse<AdminProductDetail>>(`/api/admin/products/${id}`),

  updateProduct: (id: string, data: { name?: string; brand?: string; status?: ProductStatus }) =>
    api.patch<ApiResponse<AdminProductDetail>>(`/api/admin/products/${id}`, data),

  setStatus: (parentIds: string[], status: ProductStatus) =>
    api.post<ApiResponse<{ products: number; variantsUpdated: number; status: ProductStatus }>>(
      "/api/admin/products/status",
      { parentIds, status }
    ),

  updateVariant: (id: string, data: { price?: number; stockQuantity?: number; status?: ProductStatus }) =>
    api.patch<ApiResponse<AdminInventoryRow>>(`/api/admin/variants/${id}`, data),

  adjustStock: (id: string, delta: number, reason: string) =>
    api.post<ApiResponse<AdminInventoryRow>>(`/api/admin/variants/${id}/stock-adjustments`, { delta, reason }),

  // Inventory
  listInventory: (params: AdminInventoryListParams) =>
    api.get<ApiResponse<PageResponse<AdminInventoryRow>>>("/api/admin/inventory", { params }),

  inventoryStats: () => api.get<ApiResponse<InventoryStats>>("/api/admin/inventory/stats"),

  // Orders
  listOrders: (params: AdminOrderListParams) =>
    api.get<ApiResponse<PageResponse<AdminOrderRow>>>("/api/admin/orders", { params }),

  orderStats: () => api.get<ApiResponse<OrderStats>>("/api/admin/orders/stats"),

  getOrder: (id: string) => api.get<ApiResponse<AdminOrderDetail>>(`/api/admin/orders/${id}`),

  /** Manual gateway stand-in for a payment callback: PENDING_PAYMENT → PAID. */
  markPaid: (id: string) => api.post<ApiResponse<Order>>(`/api/orders/${id}/pay`),

  // Catalog import (FR-IM-01)
  importCatalog: (file: File, onProgress?: (percent: number) => void) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<ApiResponse<CatalogImportReport>>("/api/catalog/import", form, {
      // Overrides the instance's JSON default, which would make axios serialize
      // the FormData as JSON; the browser adds the multipart boundary.
      headers: { "Content-Type": "multipart/form-data" },
      // Large files can take a while; the server's own limit is 2 minutes.
      timeout: 180_000,
      onUploadProgress: (e) => onProgress?.(e.total ? Math.round((e.loaded / e.total) * 100) : 0),
    });
  },

  downloadTemplate: () => api.get<Blob>("/api/catalog/import/template", { responseType: "blob" }),
};

export default adminService;
