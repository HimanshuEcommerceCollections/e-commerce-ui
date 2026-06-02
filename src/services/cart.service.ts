import api from "@/lib/Axios";
import type { ApiResponse } from "@/types/api/common.types";
import type {
  CartItemRequest,
  CartItemUpdateRequest,
  CartResponse,
} from "@/types/api/cart.types";

const cartService = {
  getCart: () =>
    api.get<ApiResponse<CartResponse>>("/api/cart"),

  addItem: (data: CartItemRequest) =>
    api.post<ApiResponse<CartResponse>>("/api/cart/items", data),

  updateItem: (productId: string, data: CartItemUpdateRequest) =>
    api.put<ApiResponse<CartResponse>>(`/api/cart/items/${productId}`, data),

  removeItem: (productId: string) =>
    api.delete<ApiResponse<null>>(`/api/cart/items/${productId}`),

  clearCart: () =>
    api.delete<ApiResponse<null>>("/api/cart"),
};

export default cartService;
