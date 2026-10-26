import api from "@/lib/Axios";
import type { ApiResponse } from "@/types/api/common.types";
import type {
  AuthResponse,
  PasswordChangeRequest,
  ProfileUpdateRequest,
  ProfileUpdateResponse,
  UserProfile,
} from "@/types/api/auth.types";

const profileService = {
  getProfile: () => api.get<ApiResponse<UserProfile>>("/api/users/me"),

  updateProfile: (data: ProfileUpdateRequest) =>
    api.patch<ApiResponse<ProfileUpdateResponse>>("/api/users/me", data),

  /** With signOutOtherDevices (the default) the other sessions end and a fresh token comes back. */
  changePassword: (data: PasswordChangeRequest) =>
    api.post<ApiResponse<AuthResponse | null>>("/api/users/me/password", data),
};

export default profileService;
