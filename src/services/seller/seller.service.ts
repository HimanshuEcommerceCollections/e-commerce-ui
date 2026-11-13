import api from "@/lib/Axios";
import type { ApiResponse, PageResponse } from "@/types/api/common.types";
import type {
  PriceChange,
  PriceChangeRequest,
  ReviewActivity,
  SellerDocument,
  SellerEarnings,
  SellerOrder,
  SellerOrderFilter,
  SellerProduct,
  StockMove,
  StockUpdateResult,
  SubmissionDetail,
  SubmissionListItem,
  SubmissionReport,
  SubmissionStatus,
  SubmissionSummary,
  TemplateRow,
  UploadCheck,
} from "@/types/api/seller.types";

const BASE = "/api/seller";

/** Multipart upload: overrides the instance's JSON default so the browser adds the boundary. */
const multipart = { headers: { "Content-Type": "multipart/form-data" }, timeout: 180_000 };

const fileForm = (file: File, fields: Record<string, string | undefined> = {}) => {
  const form = new FormData();
  form.append("file", file);
  for (const [k, v] of Object.entries(fields)) if (v) form.append(k, v);
  return form;
};

/** Seller portal API (ROLE_MERCHANT), mounted on /api/seller. */
const sellerService = {
  // Catalog
  catalog: () => api.get<ApiResponse<SellerProduct[]>>(`${BASE}/catalog`),
  productRows: (id: string) => api.get<ApiResponse<TemplateRow[]>>(`${BASE}/products/${id}/rows`),
  stockHistory: (id: string) => api.get<ApiResponse<StockMove[]>>(`${BASE}/products/${id}/stock-history`),
  /** Applies at once, no review. */
  updateStock: (items: { sku: string; quantity: number }[]) =>
    api.post<ApiResponse<StockUpdateResult>>(`${BASE}/stock`, { items }),
  /** Reviewed like any edit; the live price stays until approved. */
  requestPrice: (id: string, body: PriceChangeRequest) =>
    api.post<ApiResponse<SubmissionReport>>(`${BASE}/products/${id}/price`, body),
  submitDraft: (id: string, note?: string) =>
    api.post<ApiResponse<SubmissionSummary>>(`${BASE}/products/${id}/submit`, note ? { note } : {}),
  delist: (id: string, note: string) => api.post<ApiResponse<SubmissionSummary>>(`${BASE}/products/${id}/delist`, { note }),

  // Submissions
  downloadTemplate: () => api.get<Blob>(`${BASE}/template`, { responseType: "blob" }),
  /** Template rows from the one-product form (column header → value). */
  submitRows: (rows: Record<string, string>[], note?: string) =>
    api.post<ApiResponse<SubmissionReport>>(`${BASE}/submissions`, { rows, ...(note ? { note } : {}) }),
  checkFile: (file: File) => api.post<ApiResponse<UploadCheck>>(`${BASE}/submissions/check`, fileForm(file), multipart),
  submitFile: (file: File, note?: string) =>
    api.post<ApiResponse<SubmissionReport>>(`${BASE}/submissions`, fileForm(file, { note }), multipart),
  submissions: (params: { page?: number; size?: number; status?: SubmissionStatus; sort?: string }) =>
    api.get<ApiResponse<PageResponse<SubmissionListItem>>>(`${BASE}/submissions`, { params }),
  submission: (reference: string) => api.get<ApiResponse<SubmissionDetail>>(`${BASE}/submissions/${reference}`),
  withdraw: (reference: string) => api.post<ApiResponse<SubmissionSummary>>(`${BASE}/submissions/${reference}/withdraw`),
  priceChanges: () => api.get<ApiResponse<PriceChange[]>>(`${BASE}/price-changes`),
  activity: (limit = 20) => api.get<ApiResponse<ReviewActivity[]>>(`${BASE}/activity`, { params: { limit } }),

  // Orders and earnings
  orders: (params: { page?: number; size?: number; status?: SellerOrderFilter }) =>
    api.get<ApiResponse<PageResponse<SellerOrder>>>(`${BASE}/orders`, { params }),
  earnings: (months = 6) => api.get<ApiResponse<SellerEarnings>>(`${BASE}/earnings`, { params: { months } }),

  // Documents
  documents: () => api.get<ApiResponse<SellerDocument[]>>(`${BASE}/documents`),
  uploadDocument: (file: File, type: string, expiresAt?: string) =>
    api.post<ApiResponse<SellerDocument>>(`${BASE}/documents`, fileForm(file, { type, expiresAt }), multipart),
  documentFile: (id: string) => api.get<Blob>(`${BASE}/documents/${id}/file`, { responseType: "blob" }),
  agreement: () => api.get<Blob>(`${BASE}/agreement`, { responseType: "blob" }),
};

export default sellerService;

/** Saves a blob response under the server's file name (Content-Disposition), or the fallback. */
export function saveBlob(res: { data: Blob; headers: Record<string, unknown> }, fallback: string) {
  const disposition = String(res.headers["content-disposition"] ?? "");
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  const name = match ? decodeURIComponent(match[1]) : fallback;
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
