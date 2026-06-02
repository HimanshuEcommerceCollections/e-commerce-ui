"use client";
import { useProductStore } from "@/store/useProductStore";
import merchantProductService from "@/services/merchant/product.service";
import type { ProductCreateRequest, ProductUpdateRequest, ProductListParams } from "@/types/api/product.types";

export const useMerchantProducts = () => {
  const {
    myProductsPage,
    selectedProduct,
    loading,
    error,
    setMyProductsPage,
    setSelectedProduct,
    removeFromMyProducts,
    setLoading,
    setError,
  } = useProductStore();

  const fetchMyProducts = async (params?: ProductListParams) => {
    setLoading(true);
    setError(null);
    try {
      const res = await merchantProductService.getMyProducts(params);
      setMyProductsPage(res.data.data!);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch products";
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? message);
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (data: ProductCreateRequest) => {
    setLoading(true);
    setError(null);
    try {
      const res = await merchantProductService.create(data);
      return res.data.data!;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create product";
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (id: string, data: ProductUpdateRequest) => {
    setLoading(true);
    setError(null);
    try {
      const res = await merchantProductService.update(id, data);
      const updated = res.data.data!;
      setSelectedProduct(updated);
      return updated;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update product";
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await merchantProductService.delete(id);
      removeFromMyProducts(id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete product";
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    myProductsPage,
    selectedProduct,
    loading,
    error,
    fetchMyProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };
};
