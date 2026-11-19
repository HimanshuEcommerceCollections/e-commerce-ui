import api from "@/lib/Axios";
import type { ApiResponse, PageResponse } from "@/types/api/common.types";
import type { TicketDetail, TicketSummary, TicketTab } from "@/types/api/seller.types";

export interface TicketSeller {
  name: string;
  email: string;
  company: string | null;
}

export type AdminTicketRow = TicketSummary & { seller: TicketSeller };
export type AdminTicketDetail = TicketDetail & { seller: TicketSeller };
export interface AdminTicketList extends PageResponse<AdminTicketRow> {
  counts: { open: number; waiting: number; resolved: number; urgent: number };
}

/** Seller Help & support tickets, staff side (ROLE_ADMIN, ROLE_CATALOG). */
const sellerTicketsService = {
  list: (params: { tab: TicketTab; q?: string; mine?: boolean; page?: number; size?: number }) =>
    api.get<ApiResponse<AdminTicketList>>("/api/admin/seller-tickets", { params }),
  get: (reference: string) => api.get<ApiResponse<AdminTicketDetail>>(`/api/admin/seller-tickets/${reference}`),
  reply: (reference: string, body: string, files: File[], resolve: boolean) => {
    const form = new FormData();
    if (body) form.append("body", body);
    form.append("resolve", String(resolve));
    for (const f of files) form.append("files", f);
    return api.post<ApiResponse<AdminTicketDetail>>(`/api/admin/seller-tickets/${reference}/messages`, form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120_000,
    });
  },
  assign: (reference: string) => api.post<ApiResponse<AdminTicketDetail>>(`/api/admin/seller-tickets/${reference}/assign`),
  attachment: (reference: string, id: string) =>
    api.get<Blob>(`/api/admin/seller-tickets/${reference}/attachments/${id}`, { responseType: "blob" }),
};

export default sellerTicketsService;
