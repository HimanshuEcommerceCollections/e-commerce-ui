import api from "@/lib/Axios";
import type { ApiResponse } from "@/types/api/common.types";
import type { MyApplication, SaveDraftRequest, SupplierDocument } from "@/types/api/supplier.types";

const BASE = "/api/seller-onboarding";

/** The signed-in applicant's seller application, its draft and documents. */
const onboardingService = {
  /** `data` is absent until the first save. */
  get: () => api.get<ApiResponse<MyApplication>>(`${BASE}/application`),

  save: (body: SaveDraftRequest) => api.put<ApiResponse<MyApplication>>(`${BASE}/application`, body),

  submit: () => api.post<ApiResponse<MyApplication>>(`${BASE}/application/submit`, { confirm: true }),

  documents: () => api.get<ApiResponse<SupplierDocument[]>>(`${BASE}/documents`),

  upload: (type: string, file: File, expiresAt?: string) => {
    const form = new FormData();
    form.append("type", type);
    if (expiresAt) form.append("expiresAt", expiresAt);
    form.append("file", file);
    return api.post<ApiResponse<SupplierDocument>>(`${BASE}/documents`, form, {
      // The browser adds the multipart boundary.
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120_000,
    });
  },

  documentFile: (id: string) => api.get<Blob>(`${BASE}/documents/${id}/file`, { responseType: "blob" }),

  agreement: () => api.get<Blob>(`${BASE}/agreement`, { responseType: "blob" }),
};

export default onboardingService;
