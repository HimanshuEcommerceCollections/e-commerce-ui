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
  /** Saved cards in the account (Stripe only). Optional until every backend serves it. */
  savedPaymentMethods?: boolean;
  twoFactorAvailable?: boolean;
  /** True once a real SMS provider sends codes and delivery texts; absent means codes are only logged. */
  smsAvailable?: boolean;
  stripePublishableKeyIsTest?: boolean;
  /** CONTRACT E (cart / checkout). */
  promoCodesEnabled?: boolean;
  taxMode?: "destination" | "flat";
  supportHours?: string;
}

const storeService = {
  /** Shipping, returns and tax settings the storefront shows (FR-ST-06), so it never contradicts checkout. */
  getConfig: () => api.get<ApiResponse<StoreConfig>>("/api/store/config"),
};

export default storeService;
