import api from "@/lib/Axios";
import type { ApiResponse } from "@/types/api/common.types";
import type { SellerApplicationRequest, SupportMessageRequest } from "@/types/api/support.types";

const supportService = {
  /** Help center contact form (design 10). */
  sendMessage: (data: SupportMessageRequest) =>
    api.post<ApiResponse<{ ticketNumber: string }>>("/api/support/messages", data),

  /** Sell with us (design 11). */
  applyToSell: (data: SellerApplicationRequest) =>
    api.post<ApiResponse<{ reference: string }>>("/api/seller-applications", data),
};

export default supportService;
