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
  AdminProductCreate,
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
  SalesReport,
  StockMovement,
  TrackingEventRequest,
  AdminCustomerStats,
  AdminGiftCard,
  AdminProductReview,
  AdminPromotion,
  AdminSellerApplication,
  AdminSupportMessage,
  InboxCounts,
  InboxListParams,
  IssuedGiftCard,
  PromotionInput,
  ReviewStatus,
  SellerApplicationStatus,
  SellerStockAlert,
  StoreCreditAdjustment,
  SubmissionCounts,
  SubmissionDetail,
  SubmissionListParams,
  SubmissionRow,
  SupportMessageStatus,
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

  /** Manual product entry (FR-AD-01); blank SKUs are generated. */
  createProduct: (data: AdminProductCreate) =>
    api.post<ApiResponse<AdminProductDetail>>("/api/admin/products", data),

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

  // No body: with the instance's JSON Content-Type, axios would send `null` as the
  // literal text "null", which the server's JSON parser rejects with a 400.
  recheckImages: (scope: "problems" | "all") =>
    api.post<ApiResponse<ImageRecheckResult>>("/api/admin/images/recheck", undefined, { params: { scope }, timeout: 180_000 }),

  // Orders (admin only)
  listOrders: (params: AdminOrderListParams) =>
    api.get<ApiResponse<PageResponse<AdminOrderRow>>>("/api/admin/orders", { params }),

  /** CSV of the orders matching the filters. */
  exportOrders: (params: Omit<AdminOrderListParams, "page" | "size">) =>
    api.get<Blob>("/api/admin/orders/export", { params, responseType: "blob", timeout: 120_000 }),

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

  exportCustomers: (params: Omit<AdminCustomerListParams, "page" | "size">) =>
    api.get<Blob>("/api/admin/customers/export", { params, responseType: "blob", timeout: 120_000 }),

  getCustomer: (id: string) => api.get<ApiResponse<AdminCustomerDetail>>(`/api/admin/customers/${id}`),

  setRole: (id: string, role: UserRole) =>
    api.patch<ApiResponse<{ id: string; email: string; fullName: string; role: UserRole }>>(
      `/api/admin/users/${id}/role`,
      { role }
    ),

  // Analytics (FR-IN-05) and settings
  analyticsSummary: (params: { from?: string; to?: string }) =>
    api.get<ApiResponse<AnalyticsSummary>>("/api/admin/analytics/summary", { params }),

  /** Sales, by department and top products over the last N days (design 12 Reports). */
  salesReport: (days: 7 | 14 | 30) =>
    api.get<ApiResponse<SalesReport>>("/api/admin/reports/sales", { params: { days } }),

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

  // Seller submissions: the review queue (admins and catalog staff)
  listSubmissions: (params: SubmissionListParams) =>
    api.get<ApiResponse<PageResponse<SubmissionRow>>>("/api/admin/submissions", { params }),

  submissionCounts: () => api.get<ApiResponse<SubmissionCounts>>("/api/admin/submissions/counts"),

  getSubmission: (ref: string) => api.get<ApiResponse<SubmissionDetail>>(`/api/admin/submissions/${ref}`),

  claimSubmission: (ref: string) => api.post<ApiResponse<SubmissionDetail>>(`/api/admin/submissions/${ref}/claim`, {}),

  /** Approve takes an optional note; request changes and reject need one. */
  decideSubmission: (ref: string, decision: "approve" | "request-changes" | "reject", note?: string) =>
    api.post<ApiResponse<SubmissionDetail>>(`/api/admin/submissions/${ref}/${decision}`, { note }, { timeout: 60_000 }),

  sellerStockAlerts: (days = 7) =>
    api.get<ApiResponse<SellerStockAlert[]>>("/api/admin/seller-stock-alerts", { params: { days } }),

  // Product reviews moderation (catalog staff)
  listReviews: (params: Paging & { status?: ReviewStatus }) =>
    api.get<ApiResponse<PageResponse<AdminProductReview>>>("/api/admin/reviews", { params }),

  publishReview: (id: string) => api.post<ApiResponse<AdminProductReview>>(`/api/admin/reviews/${id}/publish`, {}),

  rejectReview: (id: string, note?: string) =>
    api.post<ApiResponse<AdminProductReview>>(`/api/admin/reviews/${id}/reject`, { note }),

  // Inbox (admin only)
  inboxCounts: () => api.get<ApiResponse<InboxCounts>>("/api/admin/inbox/counts"),

  listSupportMessages: (params: InboxListParams<SupportMessageStatus>) =>
    api.get<ApiResponse<PageResponse<AdminSupportMessage>>>("/api/admin/support-messages", { params }),

  getSupportMessage: (id: string) => api.get<ApiResponse<AdminSupportMessage>>(`/api/admin/support-messages/${id}`),

  updateSupportMessage: (id: string, data: { status: SupportMessageStatus; adminNote?: string }) =>
    api.patch<ApiResponse<AdminSupportMessage>>(`/api/admin/support-messages/${id}`, data),

  listSellerApplications: (params: InboxListParams<SellerApplicationStatus>) =>
    api.get<ApiResponse<PageResponse<AdminSellerApplication>>>("/api/admin/seller-applications", { params }),

  getSellerApplication: (id: string) =>
    api.get<ApiResponse<AdminSellerApplication>>(`/api/admin/seller-applications/${id}`),

  updateSellerApplication: (id: string, data: { status: SellerApplicationStatus; adminNote?: string }) =>
    api.patch<ApiResponse<AdminSellerApplication>>(`/api/admin/seller-applications/${id}`, data),

  // Customers (D2)
  customerStats: (params: { search?: string } = {}) =>
    api.get<ApiResponse<AdminCustomerStats>>("/api/admin/customers/stats", { params }),

  /** Signed amount: + adds credit, − takes it away. */
  adjustStoreCredit: (id: string, amount: number, description: string) =>
    api.post<ApiResponse<StoreCreditAdjustment>>(`/api/admin/customers/${id}/store-credit`, { amount, description }),

  // Returns: a drop-off parcel handed to the carrier (C3)
  markDroppedOff: (id: string) => api.post<ApiResponse<AdminReturn>>(`/api/admin/returns/${id}/dropped-off`, {}),

  // Promotions and gift cards (admin only)
  listPromotions: (params: Paging & { q?: string; active?: boolean } = {}) =>
    api.get<ApiResponse<PageResponse<AdminPromotion>>>("/api/admin/promotions", { params }),

  createPromotion: (data: PromotionInput) => api.post<ApiResponse<AdminPromotion>>("/api/admin/promotions", data),

  updatePromotion: (id: string, data: Partial<PromotionInput>) =>
    api.patch<ApiResponse<AdminPromotion>>(`/api/admin/promotions/${id}`, data),

  /** Deactivates; codes stay on past orders. */
  deactivatePromotion: (id: string) => api.delete<ApiResponse<unknown>>(`/api/admin/promotions/${id}`),

  listGiftCards: (params: Paging) =>
    api.get<ApiResponse<PageResponse<AdminGiftCard>>>("/api/admin/gift-cards", { params }),

  issueGiftCard: (data: { amount: number; expiresAt?: string }) =>
    api.post<ApiResponse<IssuedGiftCard>>("/api/admin/gift-cards", data),
};

export default adminService;
