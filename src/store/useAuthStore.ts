"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import authService from "@/services/auth.service";
import type { AuthResponse } from "@/types/api/auth.types";
import type { UserRole } from "@/types/api/common.types";

interface AuthState {
  user: AuthResponse | null;
  isAuthenticated: boolean;
  // Actions
  setAuth: (auth: AuthResponse) => void;
  /** Forgets the session in this browser only (the server session stays valid). */
  clearAuth: () => void;
  /** Real sign-out: ends the session on the server, then forgets it here. */
  signOut: () => Promise<void>;
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

      signOut: async () => {
        // The request goes out first, carrying the token explicitly, so the page
        // can forget the session right away. Best effort: an already revoked or
        // expired session still signs out here.
        const token = localStorage.getItem("accessToken");
        const revoke = token ? authService.logout(token).catch(() => undefined) : Promise.resolve();
        get().clearAuth();
        await revoke;
      },

      getRole: () => get().user?.role ?? null,
    }),
    { name: "nexus-auth" }
  )
);
