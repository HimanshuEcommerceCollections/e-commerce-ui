import api from "@/lib/Axios";
import type { ApiResponse } from "@/types/api/common.types";
import type { ShippingMethod } from "@/types/api/order.types";

export interface StoreShippingOption {
  method: ShippingMethod;
  label: string;
  estimatedDelivery: string;
  minDays: number;
  maxDays: number;
  fee: number;
}

export interface StoreConfig {
  storeName: string;
  currency: string;
  pricesIncludeTax: boolean;
  /** Standard shipping is free at or above this subtotal; null when never. */
  freeShippingThreshold: number | null;
  shippingOptions: StoreShippingOption[];
  returnWindowDays: number;
  lowStockThreshold: number;
  paymentProvider: "manual" | "stripe";
  /** For Stripe Elements; null under the manual gateway. */
  stripePublishableKey: string | null;
}

const storeService = {
  /** Shipping, returns and tax settings the storefront shows (FR-ST-06), so it never contradicts checkout. */
  getConfig: () => api.get<ApiResponse<StoreConfig>>("/api/store/config"),
};

export default storeService;
