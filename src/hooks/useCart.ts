"use client";
import { useCartStore } from "@/store/useCartStore";
import cartService from "@/services/cart.service";
import type { CartItemRequest, CartItemUpdateRequest } from "@/types/api/cart.types";

export const useCart = () => {
  const {
    cart,
    loading,
    error,
    setCart,
    clearCartState,
    setLoading,
    setError,
    totalItems,
    totalPrice,
  } = useCartStore();

  const fetchCart = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await cartService.getCart();
      setCart(res.data.data!);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch cart";
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? message);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (data: CartItemRequest) => {
    setLoading(true);
    setError(null);
    try {
      const res = await cartService.addItem(data);
      setCart(res.data.data!);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add item";
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (productId: string, data: CartItemUpdateRequest) => {
    setLoading(true);
    setError(null);
    try {
      const res = await cartService.updateItem(productId, data);
      setCart(res.data.data!);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update item";
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Optimistic remove — server confirms via CartResponse; fall back to re-fetch on error
  const removeItem = async (productId: string) => {
    setLoading(true);
    setError(null);
    try {
      await cartService.removeItem(productId);
      if (cart) {
        const removed = cart.items.find((i) => i.productId === productId);
        setCart({
          ...cart,
          items: cart.items.filter((i) => i.productId !== productId),
          totalItems: cart.totalItems - (removed?.quantity ?? 0),
          totalPrice: cart.totalPrice - (removed?.subtotal ?? 0),
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to remove item";
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    setLoading(true);
    setError(null);
    try {
      await cartService.clearCart();
      clearCartState();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to clear cart";
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    cart,
    loading,
    error,
    totalItems: totalItems(),
    totalPrice: totalPrice(),
    fetchCart,
    addItem,
    updateItem,
    removeItem,
    clearCart,
  };
};
