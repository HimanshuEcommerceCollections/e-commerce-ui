"use client";
import { create } from "zustand";
import type { CategoryResponse } from "@/types/api/category.types";

interface CategoryState {
  categories: CategoryResponse[];
  selectedCategory: CategoryResponse | null;
  loading: boolean;
  error: string | null;
  // Actions
  setCategories: (categories: CategoryResponse[]) => void;
  upsertCategory: (category: CategoryResponse) => void;
  setSelectedCategory: (category: CategoryResponse | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useCategoryStore = create<CategoryState>()((set, get) => ({
  categories: [],
  selectedCategory: null,
  loading: false,
  error: null,

  setCategories: (categories) => set({ categories }),

  upsertCategory: (category) => {
    const existing = get().categories.find((c) => c.id === category.id);
    set({
      categories: existing
        ? get().categories.map((c) => (c.id === category.id ? category : c))
        : [...get().categories, category],
    });
  },

  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),
}));
