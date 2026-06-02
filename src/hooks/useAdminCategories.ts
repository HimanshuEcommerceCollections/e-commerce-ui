"use client";
import { useCategoryStore } from "@/store/useCategoryStore";
import adminCategoryService from "@/services/admin/category.service";
import type { CategoryCreateRequest } from "@/types/api/category.types";

export const useAdminCategories = () => {
  const {
    categories,
    loading,
    error,
    upsertCategory,
    setLoading,
    setError,
  } = useCategoryStore();

  const createCategory = async (data: CategoryCreateRequest) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminCategoryService.create(data);
      const created = res.data.data!;
      upsertCategory(created);
      return created;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create category";
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    categories,
    loading,
    error,
    createCategory,
  };
};
