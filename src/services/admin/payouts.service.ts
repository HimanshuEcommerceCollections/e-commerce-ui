import api from "@/lib/Axios";
import type { ApiResponse, PageResponse } from "@/types/api/common.types";

export interface AdminPayout {
  reference: string;
  seller: string;
  sellerEmail: string;
  status: "SCHEDULED" | "PAID";
  scheduledFor: string;
  paidAt: string | null;
  paidBy: string | null;
  orders: number;
  sales: number;
  commission: number;
  refunds: number;
  net: number;
}

/** Seller payouts (ROLE_ADMIN): the weekly list, closing a week by hand, marking paid. */
const payoutsService = {
  list: (params: { status?: "SCHEDULED" | "PAID"; page?: number; size?: number }) =>
    api.get<ApiResponse<PageResponse<AdminPayout>>>("/api/admin/payouts", { params }),
  closeWeek: () => api.post<ApiResponse<{ payouts: string[]; scheduledFor: string }>>("/api/admin/payouts/close-week"),
  markPaid: (reference: string) => api.post<ApiResponse<{ reference: string }>>(`/api/admin/payouts/${reference}/paid`),
};

export default payoutsService;
