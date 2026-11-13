import api from "@/lib/Axios";
import type { ApiResponse, PageResponse } from "@/types/api/common.types";
import type { AuditEvent, AuditListParams, AuditStats } from "@/types/api/audit.types";

/** Catalog audit log (admins and catalog staff). */
const auditService = {
  list: (params: AuditListParams) => api.get<ApiResponse<PageResponse<AuditEvent>>>("/api/admin/audit-events", { params }),

  stats: () => api.get<ApiResponse<AuditStats>>("/api/admin/audit-events/stats"),

  /** By uuid or display number (EV-123). */
  get: (id: string) => api.get<ApiResponse<AuditEvent>>(`/api/admin/audit-events/${encodeURIComponent(id)}`),

  /** The filtered set as CSV (newest first). */
  exportCsv: (params: Omit<AuditListParams, "page" | "size">) =>
    api.get<Blob>("/api/admin/audit-events/export", { params, responseType: "blob", timeout: 120_000 }),
};

export default auditService;
