import api from "@/lib/Axios";
import type { ApiResponse } from "@/types/api/common.types";
import type {
  CartItemRequest,
  CartItemUpdateRequest,
  CartLineInput,
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

  /** Prices a guest's browser cart: stock, tax and shipping, without an account (FR-ST-09). */
  preview: (items: CartLineInput[]) =>
    api.post<ApiResponse<CartResponse>>("/api/cart/preview", { items }),

  /** After sign-in: moves the guest's lines into the account's cart. */
  merge: (items: CartLineInput[]) =>
    api.post<ApiResponse<CartResponse>>("/api/cart/merge", { items }),
};

export default cartService;
