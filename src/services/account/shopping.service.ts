import api from "@/lib/Axios";
import type { ApiResponse, PageResponse } from "@/types/api/common.types";
import type {
  AccountSummary,
  BuyAgainItem,
  CustomerReturn,
  MyReview,
  MyReviews,
  ReviewInput,
} from "@/types/api/shopping.types";

/** Your account, shopping side (API contract C1, C3, C4, C6). */
const shoppingService = {
  /** Counts for the side nav and the overview tiles, plus the latest order. */
  getSummary: () => api.get<ApiResponse<AccountSummary>>("/api/users/me/summary"),

  getReturns: (params?: { page?: number; size?: number }) =>
    api.get<ApiResponse<PageResponse<CustomerReturn>>>("/api/users/me/returns", { params }),

  getBuyAgain: (params?: { page?: number; size?: number }) =>
    api.get<ApiResponse<PageResponse<BuyAgainItem>>>("/api/users/me/buy-again", { params }),

  /** Purchases waiting for a review, and the reviews already written. */
  getReviews: () => api.get<ApiResponse<MyReviews>>("/api/users/me/reviews"),

  createReview: (data: ReviewInput) => api.post<ApiResponse<MyReview>>("/api/users/me/reviews", data),

  deleteReview: (id: string) => api.delete<ApiResponse<null>>(`/api/users/me/reviews/${encodeURIComponent(id)}`),
};

export default shoppingService;
