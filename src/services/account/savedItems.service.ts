import api from "@/lib/Axios";
import type { ApiResponse } from "@/types/api/common.types";
import type { CartResponse } from "@/types/api/cart.types";
import type { SavedItem } from "@/types/api/shopping.types";

/** Saved items ("hearts") of the signed-in customer (API contract C5). */
const savedItemsService = {
  list: () => api.get<ApiResponse<SavedItem[]>>("/api/users/me/saved-items"),

  /** Just the product (SKU) ids, for painting hearts. */
  ids: () => api.get<ApiResponse<string[]>>("/api/users/me/saved-items/ids"),

  /** Idempotent. */
  save: (productId: string) => api.post<ApiResponse<unknown>>("/api/users/me/saved-items", { productId }),

  remove: (productId: string) =>
    api.delete<ApiResponse<null>>(`/api/users/me/saved-items/${encodeURIComponent(productId)}`),

  /** Adds one to the server cart and removes the saved row; returns the cart. */
  moveToCart: (productId: string) =>
    api.post<ApiResponse<CartResponse>>(`/api/users/me/saved-items/${encodeURIComponent(productId)}/move-to-cart`),

  /** Hearts tapped as a guest, after sign-in; returns every saved id. */
  merge: (productIds: string[]) =>
    api.post<ApiResponse<string[]>>("/api/users/me/saved-items/merge", { productIds }),
};

export default savedItemsService;
