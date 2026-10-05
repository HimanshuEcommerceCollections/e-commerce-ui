import api from "@/lib/Axios";
import type { ApiResponse, PageResponse } from "@/types/api/common.types";
import type {
  CheckoutQuote,
  CheckoutRequest,
  CheckoutResponse,
  Order,
  OrderListParams,
  OrderReturn,
  OrderSummary,
  ReturnRequestBody,
  ShippingMethod,
} from "@/types/api/order.types";

const orderService = {
  /** Idempotency-Key makes a retried checkout return the same order instead of a second one. */
  checkout: (data: CheckoutRequest, idempotencyKey?: string) =>
    api.post<ApiResponse<CheckoutResponse>>("/api/orders", data, {
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
    }),

  /** Shipping options and totals for the current cart (FR-ST-10). */
  quote: (shippingMethod?: ShippingMethod) =>
    api.post<ApiResponse<CheckoutQuote>>("/api/orders/quote", { shippingMethod }),

  getOrders: (params?: OrderListParams) =>
    api.get<ApiResponse<PageResponse<OrderSummary>>>("/api/orders", { params }),

  getOrder: (id: string) =>
    api.get<ApiResponse<Order>>(`/api/orders/${id}`),

  cancelOrder: (id: string) =>
    api.post<ApiResponse<Order>>(`/api/orders/${id}/cancel`),

  /** FR-AD-07: a return request for a delivered order. */
  requestReturn: (id: string, data: ReturnRequestBody) =>
    api.post<ApiResponse<OrderReturn>>(`/api/orders/${id}/returns`, data),

  markPaid: (id: string) =>
    api.post<ApiResponse<Order>>(`/api/orders/${id}/pay`),
};

export default orderService;
