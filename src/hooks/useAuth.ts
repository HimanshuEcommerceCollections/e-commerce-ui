"use client";
import { useAuthStore } from "@/store/useAuthStore";
import authService from "@/services/auth.service";
import type { LoginRequest, RegisterRequest } from "@/types/api/auth.types";

export const useAuth = () => {
  const { user, isAuthenticated, setAuth, clearAuth, getRole } = useAuthStore();

  const login = async (data: LoginRequest) => {
    const res = await authService.login(data);
    const auth = res.data.data!;
    setAuth(auth);
    return auth;
  };

  const register = async (data: RegisterRequest) => {
    const res = await authService.register(data);
    const auth = res.data.data!;
    setAuth(auth);
    return auth;
  };

  const logout = () => clearAuth();

  return {
    user,
    isAuthenticated,
    role: getRole(),
    login,
    register,
    logout,
  };
};
