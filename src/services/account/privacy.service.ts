import api from "@/lib/Axios";
import type { ApiResponse } from "@/types/api/common.types";
import type { DataExportRequest } from "@/types/api/account.types";

/** Data download and account deletion (contract C13). */
const privacyService = {
  /** The latest data export request, or null. */
  latestExport: () => api.get<ApiResponse<DataExportRequest | null>>("/api/users/me/data-export"),

  /** Reuses an open request from the last 48 hours. */
  requestExport: () => api.post<ApiResponse<DataExportRequest>>("/api/users/me/data-export"),

  /** The emailed link's JSON file; only the signed-in owner can fetch it. */
  downloadExport: (id: string, token: string) =>
    api.get<Blob>(`/api/users/me/data-export/${encodeURIComponent(id)}/download`, {
      params: { token },
      responseType: "blob",
    }),

  /** Returns the old email for the confirmation copy. */
  deleteAccount: (password: string) =>
    api.post<ApiResponse<{ email: string }>>("/api/users/me/delete", { confirm: "DELETE", password }),
};

export default privacyService;
