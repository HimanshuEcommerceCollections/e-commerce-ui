import api from "@/lib/Axios";
import type { ApiResponse, PageResponse } from "@/types/api/common.types";
import type {
  Order,
  OrderSummary,
  CheckoutRequest,
  OrderListParams,
} from "@/types/api/order.types";

const orderService = {
  checkout: (data: CheckoutRequest) =>
    api.post<ApiResponse<Order>>("/api/orders", data),

  getOrders: (params?: OrderListParams) =>
    api.get<ApiResponse<PageResponse<OrderSummary>>>("/api/orders", { params }),

  getOrder: (id: string) =>
    api.get<ApiResponse<Order>>(`/api/orders/${id}`),

  cancelOrder: (id: string) =>
    api.post<ApiResponse<Order>>(`/api/orders/${id}/cancel`),

  markPaid: (id: string) =>
    api.post<ApiResponse<Order>>(`/api/orders/${id}/pay`),
};

export default orderService;
