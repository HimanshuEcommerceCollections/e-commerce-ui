import api from "@/lib/Axios";
import type { ApiResponse } from "@/types/api/common.types";
import type { SupplierDetail, SupplierList, SupplierView } from "@/types/api/supplier.types";

const BASE = "/api/admin/supplier-applications";
type R = Promise<{ data: ApiResponse<SupplierDetail> }>;

/** Supplier approvals (admin): queue, scorecard, documents, decisions. */
const supplierService = {
  list: (params: { view?: SupplierView; q?: string }) => api.get<ApiResponse<SupplierList>>(BASE, { params }),
  get: (id: string) => api.get<ApiResponse<SupplierDetail>>(`${BASE}/${id}`),

  saveScorecard: (id: string, scores: Record<string, number | null>, note?: string): R =>
    api.put(`${BASE}/${id}/scorecard`, { scores, note }),
  overrideScore: (id: string, score: number | null, reason?: string): R =>
    api.put(`${BASE}/${id}/score-override`, { score, reason }),
  pass: (id: string): R => api.post(`${BASE}/${id}/pass`, {}),
  decline: (id: string, reason: string): R => api.post(`${BASE}/${id}/decline`, { reason }),
  reopen: (id: string): R => api.post(`${BASE}/${id}/reopen`, {}),
  overrideScreening: (id: string): R => api.post(`${BASE}/${id}/override-screening`, {}),
  remind: (id: string, message?: string): R => api.post(`${BASE}/${id}/remind`, { message }),
  approve: (id: string): R => api.post(`${BASE}/${id}/approve`, { resaleCertificate: true }),
  suspend: (id: string, reason: string): R => api.post(`${BASE}/${id}/suspend`, { reason }),
  reinstate: (id: string): R => api.post(`${BASE}/${id}/reinstate`, {}),

  verifyDocument: (id: string, docId: string, expiresAt?: string): R =>
    api.post(`${BASE}/${id}/documents/${docId}/verify`, { expiresAt: expiresAt || undefined }),
  rejectDocument: (id: string, docId: string, note: string): R =>
    api.post(`${BASE}/${id}/documents/${docId}/reject`, { note }),
  documentFile: (id: string, docId: string) =>
    api.get<Blob>(`${BASE}/${id}/documents/${docId}/file`, { responseType: "blob" }),
};

export default supplierService;
