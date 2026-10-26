"use client";
import { useAuthStore } from "@/store/useAuthStore";
import authService from "@/services/auth.service";
import { isTwoFactorChallenge, type LoginRequest, type RegisterRequest } from "@/types/api/auth.types";

export const useAuth = () => {
  const { user, isAuthenticated, setAuth, signOut, getRole } = useAuthStore();

  /** Password sign-in for pages without a code step (the admin sign-in). */
  const login = async (data: LoginRequest) => {
    const res = await authService.login(data);
    const result = res.data.data!;
    if (isTwoFactorChallenge(result)) {
      throw new Error("This account uses 2-step verification. Sign in on the store's sign-in page.");
    }
    setAuth(result);
    return result;
  };

  const register = async (data: RegisterRequest) => {
    const res = await authService.register(data);
    const auth = res.data.data!;
    setAuth(auth);
    return auth;
  };

  /** Ends the server session, then clears it here. */
  const logout = () => signOut();

  return {
    user,
    isAuthenticated,
    role: getRole(),
    login,
    register,
    logout,
  };
};
