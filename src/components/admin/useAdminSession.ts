"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import type { UserRole } from "@/types/api/common.types";

/** Roles that may sign in to the admin panel (FR-AD-08). */
export const PANEL_ROLES: UserRole[] = ["ROLE_ADMIN", "ROLE_CATALOG"];

/**
 * The signed-in staff member, once the persisted auth store has loaded on the
 * client. `ready` stays false during server rendering and the first client
 * render, so pages don't flash or redirect before the stored session is known.
 *
 * `isStaff`: may use the panel. `isAdmin`: full access. `isCatalog`: products,
 * inventory and catalog tools only (FR-AD-08).
 */
export function useAdminSession() {
  const user = useAuthStore((s) => s.user);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const token = ready ? localStorage.getItem("accessToken") : null;
  const role = ready && token && user ? user.role : null;
  const isStaff = !!role && PANEL_ROLES.includes(role);
  return {
    ready,
    role: isStaff ? role : null,
    isStaff,
    isAdmin: role === "ROLE_ADMIN",
    isCatalog: role === "ROLE_CATALOG",
    user: isStaff ? user : null,
  };
}
