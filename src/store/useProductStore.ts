"use client";
import { create } from "zustand";
import type { PageResponse } from "@/types/api/common.types";
import type { ProductSummaryResponse, ProductDetailResponse } from "@/types/api/product.types";

interface ProductState {
  // Public browsing
  productsPage: PageResponse<ProductSummaryResponse> | null;
  selectedProduct: ProductDetailResponse | null;
  // Merchant's own listings
  myProductsPage: PageResponse<ProductSummaryResponse> | null;
  loading: boolean;
  error: string | null;
  // Actions
  setProductsPage: (page: PageResponse<ProductSummaryResponse>) => void;
  setSelectedProduct: (product: ProductDetailResponse | null) => void;
  setMyProductsPage: (page: PageResponse<ProductSummaryResponse>) => void;
  removeFromMyProducts: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useProductStore = create<ProductState>()((set, get) => ({
  productsPage: null,
  selectedProduct: null,
  myProductsPage: null,
  loading: false,
  error: null,

  setProductsPage: (productsPage) => set({ productsPage }),

  setSelectedProduct: (selectedProduct) => set({ selectedProduct }),

  setMyProductsPage: (myProductsPage) => set({ myProductsPage }),

  removeFromMyProducts: (id) => {
    const current = get().myProductsPage;
    if (!current) return;
    set({
      myProductsPage: {
        ...current,
        content: current.content.filter((p) => p.id !== id),
        totalElements: current.totalElements - 1,
      },
    });
  },

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),
}));
