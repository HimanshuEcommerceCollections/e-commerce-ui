"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthResponse } from "@/types/api/auth.types";
import type { UserRole } from "@/types/api/common.types";

interface AuthState {
  user: AuthResponse | null;
  isAuthenticated: boolean;
  // Actions
  setAuth: (auth: AuthResponse) => void;
  clearAuth: () => void;
  // Derived
  getRole: () => UserRole | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      setAuth: (auth) => {
        localStorage.setItem("accessToken", auth.accessToken);
        set({ user: auth, isAuthenticated: true });
      },

      clearAuth: () => {
        localStorage.removeItem("accessToken");
        set({ user: null, isAuthenticated: false });
      },

      getRole: () => get().user?.role ?? null,
    }),
    { name: "nexus-auth" }
  )
);
