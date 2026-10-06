import api from "@/lib/Axios";
import type { ApiResponse } from "@/types/api/common.types";
import type {
  AuthResponse,
  LoginRequest,
  PasswordResetConfirmRequest,
  RegisterRequest,
} from "@/types/api/auth.types";

const authService = {
  register: (data: RegisterRequest) =>
    api.post<ApiResponse<AuthResponse>>("/api/auth/register", data),

  login: (data: LoginRequest) =>
    api.post<ApiResponse<AuthResponse>>("/api/auth/login", data),

  /** Always succeeds, so it never reveals whether an account exists. */
  requestPasswordReset: (email: string) =>
    api.post<ApiResponse<null>>("/api/auth/password-reset/request", { email }),

  confirmPasswordReset: (data: PasswordResetConfirmRequest) =>
    api.post<ApiResponse<AuthResponse>>("/api/auth/password-reset/confirm", data),
};

export default authService;
