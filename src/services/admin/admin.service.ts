import api from "@/lib/Axios";
import type { ApiResponse, PageResponse, ProductStatus, UserRole } from "@/types/api/common.types";
import type {
  AdminCustomerDetail,
  AdminCustomerListParams,
  AdminCustomerRow,
  AdminInventoryListParams,
  AdminInventoryRow,
  AdminOrderDetail,
  AdminOrderListParams,
  AdminOrderRow,
  AdminProductDetail,
  AdminProductListParams,
  AdminProductRow,
  AdminProductUpdate,
  AdminReturn,
  AdminSettings,
  AdminShipment,
  AdminVariantUpdate,
  AnalyticsSummary,
  BulkUpdateReport,
  CatalogImportReport,
  CreateShipmentRequest,
  FulfilmentStatus,
  ImageIssuePage,
  ImageRecheckResult,
  InventoryStats,
  OrderReturnSummary,
  OrderStats,
  ProductStatusCounts,
  ReturnActionRequest,
  ReturnStatus,
  StockMovement,
  TrackingEventRequest,
} from "@/types/api/admin.types";

type Paging = { page?: number; size?: number; sort?: string };

/** Sends a CSV/XLSX as multipart `file`, reporting upload progress. */
const upload = <T>(url: string, file: File, onProgress?: (percent: number) => void) => {
  const form = new FormData();
  form.append("file", file);
  return api.post<ApiResponse<T>>(url, form, {
    // Overrides the instance's JSON default, which would make axios serialize
    // the FormData as JSON; the browser adds the multipart boundary.
    headers: { "Content-Type": "multipart/form-data" },
    // Large files can take a while; the server's own limit is 2 minutes.
    timeout: 180_000,
    onUploadProgress: (e) => onProgress?.(e.total ? Math.round((e.loaded / e.total) * 100) : 0),
  });
};

const adminService = {
  // Products
  listProducts: (params: AdminProductListParams) =>
    api.get<ApiResponse<PageResponse<AdminProductRow>>>("/api/admin/products", { params }),

  productStatusCounts: (params: Pick<AdminProductListParams, "search" | "categoryId">) =>
    api.get<ApiResponse<ProductStatusCounts>>("/api/admin/products/status-counts", { params }),

  getProduct: (id: string) =>
    api.get<ApiResponse<AdminProductDetail>>(`/api/admin/products/${id}`),

  updateProduct: (id: string, data: AdminProductUpdate) =>
    api.patch<ApiResponse<AdminProductDetail>>(`/api/admin/products/${id}`, data),

  setStatus: (parentIds: string[], status: ProductStatus) =>
    api.post<ApiResponse<{ products: number; variantsUpdated: number; status: ProductStatus }>>(
      "/api/admin/products/status",
      { parentIds, status }
    ),

  updateVariant: (id: string, data: AdminVariantUpdate) =>
    api.patch<ApiResponse<AdminInventoryRow>>(`/api/admin/variants/${id}`, data),

  adjustStock: (id: string, delta: number, reason: string) =>
    api.post<ApiResponse<AdminInventoryRow>>(`/api/admin/variants/${id}/stock-adjustments`, { delta, reason }),

  stockMovements: (id: string, params: Paging) =>
    api.get<ApiResponse<PageResponse<StockMovement>>>(`/api/admin/variants/${id}/stock-movements`, { params }),

  // Inventory
  listInventory: (params: AdminInventoryListParams) =>
    api.get<ApiResponse<PageResponse<AdminInventoryRow>>>("/api/admin/inventory", { params }),

  inventoryStats: () => api.get<ApiResponse<InventoryStats>>("/api/admin/inventory/stats"),

  // Image checks (FR-IM-08)
  imageIssues: (params: Paging) => api.get<ApiResponse<ImageIssuePage>>("/api/admin/images/issues", { params }),

  recheckImages: (scope: "problems" | "all") =>
    api.post<ApiResponse<ImageRecheckResult>>("/api/admin/images/recheck", null, { params: { scope }, timeout: 180_000 }),

  // Orders (admin only)
  listOrders: (params: AdminOrderListParams) =>
    api.get<ApiResponse<PageResponse<AdminOrderRow>>>("/api/admin/orders", { params }),

  orderStats: () => api.get<ApiResponse<OrderStats>>("/api/admin/orders/stats"),

  getOrder: (id: string) => api.get<ApiResponse<AdminOrderDetail>>(`/api/admin/orders/${id}`),

  /** Manual gateway stand-in for a payment callback: PENDING_PAYMENT → PAID. */
  markPaid: (id: string) => api.post<ApiResponse<unknown>>(`/api/admin/orders/${id}/pay`),

  fulfilmentStep: (id: string, status: Extract<FulfilmentStatus, "PICKED" | "PACKED">, note?: string) =>
    api.post<ApiResponse<{ id: string; status: string; fulfilmentStatus: FulfilmentStatus }>>(
      `/api/admin/orders/${id}/fulfilment`,
      { status, note }
    ),

  createShipment: (id: string, data: CreateShipmentRequest) =>
    api.post<ApiResponse<AdminShipment>>(`/api/admin/orders/${id}/shipments`, data, { timeout: 60_000 }),

  addTrackingEvent: (shipmentId: string, data: TrackingEventRequest) =>
    api.post<ApiResponse<AdminShipment>>(`/api/admin/shipments/${shipmentId}/events`, data),

  cancelOrder: (id: string, reason?: string) =>
    api.post<ApiResponse<unknown>>(`/api/admin/orders/${id}/cancel`, { reason }),

  openReturn: (id: string, data: { items: { orderItemId: string; quantity: number }[]; reason: string }) =>
    api.post<ApiResponse<OrderReturnSummary>>(`/api/admin/orders/${id}/returns`, data),

  // Returns (FR-AD-07)
  listReturns: (params: Paging & { status?: ReturnStatus }) =>
    api.get<ApiResponse<PageResponse<AdminReturn>>>("/api/admin/returns", { params }),

  getReturn: (id: string) => api.get<ApiResponse<AdminReturn>>(`/api/admin/returns/${id}`),

  returnAction: (id: string, data: ReturnActionRequest) =>
    api.post<ApiResponse<AdminReturn>>(`/api/admin/returns/${id}/actions`, data),

  // Customers and staff (FR-AD-06, FR-AD-08)
  listCustomers: (params: AdminCustomerListParams) =>
    api.get<ApiResponse<PageResponse<AdminCustomerRow>>>("/api/admin/customers", { params }),

  getCustomer: (id: string) => api.get<ApiResponse<AdminCustomerDetail>>(`/api/admin/customers/${id}`),

  setRole: (id: string, role: UserRole) =>
    api.patch<ApiResponse<{ id: string; email: string; fullName: string; role: UserRole }>>(
      `/api/admin/users/${id}/role`,
      { role }
    ),

  // Analytics (FR-IN-05) and settings
  analyticsSummary: (params: { from?: string; to?: string }) =>
    api.get<ApiResponse<AnalyticsSummary>>("/api/admin/analytics/summary", { params }),

  settings: () => api.get<ApiResponse<AdminSettings>>("/api/admin/settings"),

  // Catalog import (FR-IM-01..09), bulk update (FR-IM-10/11), export (NFR-06)
  importCatalog: (file: File, onProgress?: (percent: number) => void) =>
    upload<CatalogImportReport>("/api/catalog/import", file, onProgress),

  bulkUpdate: (file: File, onProgress?: (percent: number) => void) =>
    upload<BulkUpdateReport>("/api/catalog/updates", file, onProgress),

  downloadTemplate: () => api.get<Blob>("/api/catalog/import/template", { responseType: "blob" }),

  /** Blob download so the bearer token is sent; the file name is in Content-Disposition. */
  exportCatalog: (format: "csv" | "xlsx") =>
    api.get<Blob>("/api/catalog/export", { params: { format }, responseType: "blob", timeout: 180_000 }),
};

export default adminService;
