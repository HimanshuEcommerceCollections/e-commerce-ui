"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";

interface CartState {
  items: CartItem[];
  // Derived
  totalItems: () => number;
  totalCents: () => number;
  // Actions
  addToCart: (item: CartItem) => void;
  removeFromCart: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      totalItems: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      totalCents: () =>
        get().items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        ),

      addToCart: (incoming) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.variantId === incoming.variantId
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === incoming.variantId
                  ? { ...i, quantity: i.quantity + incoming.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, incoming] };
        }),

      removeFromCart: (variantId) =>
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        })),

      updateQuantity: (variantId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((i) => i.variantId !== variantId),
            };
          }
          return {
            items: state.items.map((i) =>
              i.variantId === variantId ? { ...i, quantity } : i
            ),
          };
        }),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: "nexus-cart",   // localStorage key
    }
  )
);
