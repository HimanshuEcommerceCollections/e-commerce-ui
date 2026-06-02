"use client";
import { useProductStore } from "@/store/useProductStore";
import publicProductService from "@/services/public/product.service";
import type { ProductListParams } from "@/types/api/product.types";

export const usePublicProducts = () => {
  const {
    productsPage,
    selectedProduct,
    loading,
    error,
    setProductsPage,
    setSelectedProduct,
    setLoading,
    setError,
  } = useProductStore();

  const fetchProducts = async (params?: ProductListParams) => {
    setLoading(true);
    setError(null);
    try {
      const res = await publicProductService.getAll(params);
      setProductsPage(res.data.data!);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch products";
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductById = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await publicProductService.getById(id);
      setSelectedProduct(res.data.data!);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch product";
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? message);
    } finally {
      setLoading(false);
    }
  };

  const fetchByCategory = async (categoryId: string, params?: ProductListParams) => {
    setLoading(true);
    setError(null);
    try {
      const res = await publicProductService.getByCategory(categoryId, params);
      setProductsPage(res.data.data!);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch products";
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? message);
    } finally {
      setLoading(false);
    }
  };

  return {
    productsPage,
    selectedProduct,
    loading,
    error,
    fetchProducts,
    fetchProductById,
    fetchByCategory,
  };
};
