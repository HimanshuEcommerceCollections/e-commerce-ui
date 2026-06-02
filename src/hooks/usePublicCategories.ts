"use client";
import { useCategoryStore } from "@/store/useCategoryStore";
import publicCategoryService from "@/services/public/category.service";

export const usePublicCategories = () => {
  const {
    categories,
    selectedCategory,
    loading,
    error,
    setCategories,
    setSelectedCategory,
    setLoading,
    setError,
  } = useCategoryStore();

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await publicCategoryService.getAll();
      setCategories(res.data.data!);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch categories";
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryById = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await publicCategoryService.getById(id);
      setSelectedCategory(res.data.data!);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch category";
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? message);
    } finally {
      setLoading(false);
    }
  };

  return {
    categories,
    selectedCategory,
    loading,
    error,
    fetchCategories,
    fetchCategoryById,
  };
};
