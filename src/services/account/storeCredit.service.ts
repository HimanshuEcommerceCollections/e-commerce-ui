import api from "@/lib/Axios";
import type { ApiResponse } from "@/types/api/common.types";
import type { RedeemGiftCardResponse, StoreCredit } from "@/types/api/account.types";

/** Store credit balance, activity and gift card redemption (contract C11). */
const storeCreditService = {
  get: () => api.get<ApiResponse<StoreCredit>>("/api/users/me/store-credit"),

  /** `code` is 16 letters/digits (dashes ignored), `pin` 4 digits. */
  redeem: (code: string, pin: string) =>
    api.post<ApiResponse<RedeemGiftCardResponse>>("/api/users/me/store-credit/redeem", { code, pin }),
};

export default storeCreditService;
