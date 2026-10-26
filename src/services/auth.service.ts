import api from "@/lib/Axios";
import type { ApiResponse } from "@/types/api/common.types";
import type {
  AuthResponse,
  LoginRequest,
  LoginResult,
  LoginVerifyRequest,
  PasswordResetConfirmRequest,
  RegisterRequest,
} from "@/types/api/auth.types";

const authService = {
  register: (data: RegisterRequest) =>
    api.post<ApiResponse<AuthResponse>>("/api/auth/register", data),

  /** A token, or a 2-step verification challenge when the account has it on. */
  login: (data: LoginRequest) =>
    api.post<ApiResponse<LoginResult>>("/api/auth/login", data),

  /** Second step of sign-in: the texted code for a login challenge. */
  verifyLogin: (data: LoginVerifyRequest) =>
    api.post<ApiResponse<AuthResponse>>("/api/auth/login/verify", data),

  /**
   * Ends the current session on the server (its token stops working). No body:
   * with the JSON Content-Type axios would send `null` as the text "null",
   * which the server rejects as malformed JSON (400), leaving the session alive.
   */
  logout: (token?: string) =>
    api.post<ApiResponse<null>>("/api/auth/logout", undefined, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined),

  /** Always succeeds, so it never reveals whether an account exists. */
  requestPasswordReset: (email: string) =>
    api.post<ApiResponse<null>>("/api/auth/password-reset/request", { email }),

  confirmPasswordReset: (data: PasswordResetConfirmRequest) =>
    api.post<ApiResponse<AuthResponse>>("/api/auth/password-reset/confirm", data),
};

export default authService;
