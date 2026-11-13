"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import profileService from "@/services/account/profile.service";

/**
 * The signed-in user as the seller portal sees them, once the persisted auth
 * store has loaded on the client (`ready` is false during server rendering
 * and the first client render, so pages don't flash or redirect early).
 * Only ROLE_MERCHANT accounts are approved sellers.
 */
export function useSellerSession() {
  const user = useAuthStore((s) => s.user);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const token = ready ? localStorage.getItem("accessToken") : null;
  const signedIn = ready && !!token && !!user;

  // The role saved at sign-in goes stale when the catalog team approves,
  // suspends or reinstates the seller: re-read it once per visit so the portal
  // opens (or closes) without signing out and in again.
  const userId = signedIn ? user?.userId : undefined;
  useEffect(() => {
    if (!userId) return;
    let live = true;
    profileService
      .getProfile()
      .then(({ data }) => {
        const role = data.data?.role;
        const current = useAuthStore.getState().user;
        if (live && role && current && current.userId === userId && current.role !== role) {
          useAuthStore.setState({ user: { ...current, role } });
        }
      })
      .catch(() => undefined); // offline or expired: the Axios handler deals with 401s
    return () => {
      live = false;
    };
  }, [userId]);

  return {
    ready,
    signedIn,
    user: signedIn ? user : null,
    isSeller: signedIn && user?.role === "ROLE_MERCHANT",
  };
}

/** "Page · Seller Portal" in the tab, like the designs. */
export function useTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · Seller Portal`;
  }, [title]);
}
