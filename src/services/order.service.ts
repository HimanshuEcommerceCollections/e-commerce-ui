import api from "@/lib/Axios";
import type { ApiResponse, PageResponse } from "@/types/api/common.types";
import type { AuthResponse } from "@/types/api/auth.types";
import type { CartLineInput } from "@/types/api/cart.types";
import type {
  CheckoutQuote,
  CheckoutRequest,
  CheckoutResponse,
  GuestCheckoutRequest,
  GuestCheckoutResponse,
  Order,
  OrderListParams,
  OrderReturn,
  OrderSummary,
  ReturnRequestBody,
  ShippingMethod,
  TrackedOrder,
} from "@/types/api/order.types";

const orderService = {
  /** Signed-in checkout from the server cart. Idempotency-Key makes a retry return the same order. */
  checkout: (data: CheckoutRequest, idempotencyKey?: string) =>
    api.post<ApiResponse<CheckoutResponse>>("/api/orders", data, {
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
    }),

  /** Guest checkout (design 05: guest by default). */
  guestCheckout: (data: GuestCheckoutRequest, idempotencyKey: string) =>
    api.post<ApiResponse<GuestCheckoutResponse>>("/api/checkout/guest", data, {
      headers: { "Idempotency-Key": idempotencyKey },
    }),

  /**
   * Shipping options and totals (FR-ST-10). Guests send their lines; a signed-in
   * customer sends none and the server cart is used.
   */
  quote: (shippingMethod?: ShippingMethod, items?: CartLineInput[]) =>
    api.post<ApiResponse<CheckoutQuote>>("/api/checkout/quote", { shippingMethod, items }),

  /** A guest's order, readable with the token returned at checkout. */
  getGuestOrder: (orderNumber: string, guestToken: string) =>
    api.get<ApiResponse<Order>>(`/api/checkout/orders/${encodeURIComponent(orderNumber)}`, {
      headers: { "X-Order-Token": guestToken },
    }),

  /** Account creation after a guest purchase (design 06): one password field. */
  createAccountFromOrder: (orderNumber: string, guestToken: string, password: string) =>
    api.post<ApiResponse<AuthResponse>>(
      `/api/checkout/orders/${encodeURIComponent(orderNumber)}/account`,
      { password },
      { headers: { "X-Order-Token": guestToken } }
    ),

  getOrders: (params?: OrderListParams) =>
    api.get<ApiResponse<PageResponse<OrderSummary>>>("/api/orders", { params }),

  /** By id or order number (EC-1234567). */
  getOrder: (idOrNumber: string) =>
    api.get<ApiResponse<Order>>(`/api/orders/${encodeURIComponent(idOrNumber)}`),

  cancelOrder: (id: string) =>
    api.post<ApiResponse<Order>>(`/api/orders/${id}/cancel`),

  /** FR-AD-07: a return request for a delivered order. */
  requestReturn: (id: string, data: ReturnRequestBody) =>
    api.post<ApiResponse<OrderReturn>>(`/api/orders/${id}/returns`, data),

  /** Guest tracking by order number plus the order's email or 5-digit ZIP (design 09). */
  track: (orderNumber: string, emailOrZip: string) =>
    api.post<ApiResponse<TrackedOrder>>("/api/orders/track", { orderNumber, emailOrZip }),
};

export default orderService;
