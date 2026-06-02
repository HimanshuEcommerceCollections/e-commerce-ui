"use client";
import { create } from "zustand";
import type { CartResponse } from "@/types/api/cart.types";

interface CartState {
  cart: CartResponse | null;
  loading: boolean;
  error: string | null;
  // Actions
  setCart: (cart: CartResponse) => void;
  clearCartState: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  // Derived
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>()((set, get) => ({
  cart: null,
  loading: false,
  error: null,

  setCart: (cart) => set({ cart }),

  clearCartState: () => set({ cart: null }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  totalItems: () => get().cart?.totalItems ?? 0,

  totalPrice: () => get().cart?.totalPrice ?? 0,
}));
