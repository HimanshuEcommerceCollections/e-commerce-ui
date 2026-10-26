import api from "@/lib/Axios";
import type { ApiResponse } from "@/types/api/common.types";
import type { UserProfile } from "@/types/api/auth.types";
import type { TwoFactorStartResponse } from "@/types/api/account.types";

/** 2-step verification by text message (contract C9). */
const twoFactorService = {
  /** Sends a code to `phone`, or to the profile's mobile number. */
  start: (phone?: string) =>
    api.post<ApiResponse<TwoFactorStartResponse>>("/api/users/me/2fa/start", phone ? { phone } : {}),

  confirm: (challengeId: string, code: string) =>
    api.post<ApiResponse<UserProfile>>("/api/users/me/2fa/confirm", { challengeId, code }),

  disable: () => api.delete<ApiResponse<null>>("/api/users/me/2fa"),
};

export default twoFactorService;
