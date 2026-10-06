"use client";
import { useCartStore } from "@/store/useCartStore";
import type { CartItemRequest, CartItemUpdateRequest } from "@/types/api/cart.types";

/** The cart for guests and customers alike; see useCartStore. */
export const useCart = () => {
  const { cart, loading, error, refresh, add, setQty, remove, clear, count } = useCartStore();

  return {
    cart,
    loading,
    error,
    totalItems: count(),
    totalPrice: cart?.totalPrice ?? 0,
    fetchCart: refresh,
    addItem: (data: CartItemRequest) => add(data.productId, data.quantity),
    updateItem: (productId: string, data: CartItemUpdateRequest) => setQty(productId, data.quantity),
    removeItem: remove,
    clearCart: clear,
  };
};
