"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * The signed-in admin, once the persisted auth store has loaded on the client.
 * `ready` stays false during server rendering and the first client render, so
 * pages don't flash or redirect before the stored session is known.
 */
export function useAdminSession() {
  const user = useAuthStore((s) => s.user);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const token = ready ? localStorage.getItem("accessToken") : null;
  const isAdmin = ready && !!token && user?.role === "ROLE_ADMIN";
  return { ready, isAdmin, user: isAdmin ? user : null };
}
