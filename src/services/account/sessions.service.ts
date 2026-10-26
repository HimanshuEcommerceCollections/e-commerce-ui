import api from "@/lib/Axios";
import type { ApiResponse } from "@/types/api/common.types";
import type { AccountSession } from "@/types/api/account.types";

/** Where the customer is signed in (contract C8). */
const sessionsService = {
  list: () => api.get<ApiResponse<AccountSession[]>>("/api/users/me/sessions"),

  revoke: (id: string) => api.delete<ApiResponse<null>>(`/api/users/me/sessions/${id}`),

  revokeOthers: () => api.post<ApiResponse<null>>("/api/users/me/sessions/revoke-others"),
};

export default sessionsService;
