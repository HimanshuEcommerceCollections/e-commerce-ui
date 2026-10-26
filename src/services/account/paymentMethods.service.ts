import api from "@/lib/Axios";
import type { ApiResponse } from "@/types/api/common.types";
import type { SavedPaymentMethod } from "@/types/api/account.types";

const BASE = "/api/users/me/payment-methods";

/**
 * Saved cards (contract C12). Card details go straight to Stripe through a
 * SetupIntent; our API only ever sees Stripe's payment method id.
 */
const paymentMethodsService = {
  list: () => api.get<ApiResponse<SavedPaymentMethod[]>>(BASE),

  setupIntent: () => api.post<ApiResponse<{ clientSecret: string }>>(`${BASE}/setup-intent`),

  add: (providerPaymentMethodId: string, makeDefault?: boolean) =>
    api.post<ApiResponse<SavedPaymentMethod>>(BASE, { providerPaymentMethodId, makeDefault }),

  setDefault: (id: string) => api.patch<ApiResponse<SavedPaymentMethod>>(`${BASE}/${id}/default`),

  remove: (id: string) => api.delete<ApiResponse<null>>(`${BASE}/${id}`),
};

export default paymentMethodsService;
