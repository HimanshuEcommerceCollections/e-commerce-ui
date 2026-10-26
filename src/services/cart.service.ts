import api from "@/lib/Axios";
import type { ApiResponse } from "@/types/api/common.types";
import type {
  CartItemRequest,
  CartItemUpdateRequest,
  CartLineInput,
  CartResponse,
  PromoValidation,
} from "@/types/api/cart.types";
import type { ProductCard } from "@/types/api/product.types";

const cartService = {
  /** The signed-in cart, priced with the applied promo code if any (CONTRACT B1). */
  getCart: (promoCode?: string | null) =>
    api.get<ApiResponse<CartResponse>>("/api/cart", { params: promoCode ? { promoCode } : undefined }),

  addItem: (data: CartItemRequest) =>
    api.post<ApiResponse<CartResponse>>("/api/cart/items", data),

  updateItem: (productId: string, data: CartItemUpdateRequest) =>
    api.put<ApiResponse<CartResponse>>(`/api/cart/items/${productId}`, data),

  removeItem: (productId: string) =>
    api.delete<ApiResponse<null>>(`/api/cart/items/${productId}`),

  clearCart: () =>
    api.delete<ApiResponse<null>>("/api/cart"),

  /** Prices a guest's browser cart: stock, tax and shipping, without an account (FR-ST-09). */
  preview: (items: CartLineInput[], promoCode?: string | null) =>
    api.post<ApiResponse<CartResponse>>("/api/cart/preview", { items, promoCode: promoCode || undefined }),

  /** After sign-in: moves the guest's lines into the account's cart. */
  merge: (items: CartLineInput[]) =>
    api.post<ApiResponse<CartResponse>>("/api/cart/merge", { items }),

  /** Checks a promo code against these lines; 400 with field `code` when it can't be used. */
  validatePromo: (code: string, items?: CartLineInput[], email?: string) =>
    api.post<ApiResponse<PromoValidation>>("/api/cart/promo/validate", { code, items, email }),

  /** "You might also like" for the cart; popular items when nothing is excluded (CONTRACT A3). */
  recommendations: (exclude: string[], limit = 4) =>
    api.get<ApiResponse<ProductCard[]>>("/api/products/recommendations", {
      params: { exclude: exclude.length ? exclude : undefined, limit },
      paramsSerializer: { indexes: null },
    }),
};

export default cartService;
