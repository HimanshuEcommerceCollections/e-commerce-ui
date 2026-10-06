import api from "@/lib/Axios";
import type { ApiResponse } from "@/types/api/common.types";
import type {
  AuthResponse,
  PasswordChangeRequest,
  ProfileUpdateRequest,
  ProfileUpdateResponse,
  UserProfile,
} from "@/types/api/auth.types";

const accountService = {
  getProfile: () => api.get<ApiResponse<UserProfile>>("/api/users/me"),

  updateProfile: (data: ProfileUpdateRequest) =>
    api.patch<ApiResponse<ProfileUpdateResponse>>("/api/users/me", data),

  /** Returns a fresh token; other sessions are signed out. */
  changePassword: (data: PasswordChangeRequest) =>
    api.post<ApiResponse<AuthResponse>>("/api/users/me/password", data),
};

export default accountService;
