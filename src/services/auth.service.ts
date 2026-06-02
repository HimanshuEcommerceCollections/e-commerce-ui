import api from "@/lib/Axios";
import type { ApiResponse } from "@/types/api/common.types";
import type { LoginRequest, RegisterRequest, AuthResponse } from "@/types/api/auth.types";

const authService = {
  register: (data: RegisterRequest) =>
    api.post<ApiResponse<AuthResponse>>("/api/auth/register", data),

  login: (data: LoginRequest) =>
    api.post<ApiResponse<AuthResponse>>("/api/auth/login", data),
};

export default authService;
