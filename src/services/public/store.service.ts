import api from "@/lib/Axios";
import type { ApiResponse } from "@/types/api/common.types";

export interface StoreConfig {
  storeName: string;
  currency: string;
  pricesIncludeTax: boolean;
  /** Standard shipping is free at or above this subtotal; null when never. */
  freeShippingThreshold: string | null;
  shippingOptions: { method: "STANDARD" | "EXPRESS"; label: string; estimatedDelivery: string; fee: string }[];
  returnWindowDays: number;
  lowStockThreshold: number;
  paymentProvider: "manual" | "stripe";
}

const storeService = {
  /** Shipping, returns and tax settings the storefront shows (FR-ST-06), so it never contradicts checkout. */
  getConfig: () => api.get<ApiResponse<StoreConfig>>("/api/store/config"),
};

export default storeService;
