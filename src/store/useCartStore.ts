"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import cartService from "@/services/cart.service";
import { useAuthStore } from "@/store/useAuthStore";
import { getApiErrorMessage } from "@/lib/apiError";
import type { CartLineInput, CartResponse } from "@/types/api/cart.types";

/** Most of one SKU a shopper can put in the cart (design 04). */
export const MAX_LINE_QTY = 10;

/**
 * The cart, for guests and signed-in customers alike (FR-ST-09).
 *
 * - Guests: the lines live in this browser (localStorage `ec-cart-v1`) and are
 *   priced by POST /api/cart/preview, so stock, tax and shipping always come
 *   from the server.
 * - Customers: the server cart (/api/cart). Guest lines are merged into it
 *   after sign-in (`mergeAfterLogin`).
 *
 * Pages read `cart` for display and call the actions; every action re-prices.
 */
interface CartState {
  /** Guest lines; empty once merged into an account. */
  lines: CartLineInput[];
  /** The priced cart, or null before the first load. */
  cart: CartResponse | null;
  loading: boolean;
  error: string | null;

  refresh: () => Promise<CartResponse | null>;
  add: (productId: string, quantity?: number) => Promise<CartResponse | null>;
  setQty: (productId: string, quantity: number) => Promise<CartResponse | null>;
  remove: (productId: string) => Promise<CartResponse | null>;
  /** Empties the cart (after a guest order is placed, or on request). */
  clear: () => Promise<void>;
  /** Moves guest lines into the account's cart; call right after sign-in. */
  mergeAfterLogin: () => Promise<CartResponse | null>;
  /** Forget the priced cart on sign-out (guest lines are kept). */
  reset: () => void;
  /** Units in the cart, for the header badge. */
  count: () => number;
}

const isCustomer = () => useAuthStore.getState().user?.role === "ROLE_CUSTOMER";

const clampQty = (q: number) => Math.max(1, Math.min(MAX_LINE_QTY, Math.floor(q)));

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => {
      /** Runs one cart call, keeping `loading`/`error` and the priced cart in step. */
      async function run(call: () => Promise<CartResponse | null>): Promise<CartResponse | null> {
        set({ loading: true, error: null });
        try {
          const cart = await call();
          set({ cart, loading: false });
          return cart;
        } catch (e) {
          set({ loading: false, error: getApiErrorMessage(e, "Something went wrong with your cart") });
          throw e;
        }
      }

      const priceGuest = async (lines: CartLineInput[]) => {
        if (!lines.length) return emptyCart(get().cart);
        const res = await cartService.preview(lines);
        return res.data.data ?? null;
      };

      return {
        lines: [],
        cart: null,
        loading: false,
        error: null,

        refresh: () =>
          run(async () => {
            if (isCustomer()) return (await cartService.getCart()).data.data ?? null;
            return priceGuest(get().lines);
          }),

        add: (productId, quantity = 1) =>
          run(async () => {
            if (isCustomer()) {
              return (await cartService.addItem({ productId, quantity })).data.data ?? null;
            }
            const lines = [...get().lines];
            const line = lines.find((l) => l.productId === productId);
            if (line) line.quantity = clampQty(line.quantity + quantity);
            else lines.push({ productId, quantity: clampQty(quantity) });
            const cart = await priceGuest(lines);
            // Keep within what's in stock, as the server cart would.
            set({ lines: capToStock(lines, cart) });
            return cart;
          }),

        setQty: (productId, quantity) =>
          run(async () => {
            if (isCustomer()) {
              return (await cartService.updateItem(productId, { quantity: clampQty(quantity) })).data.data ?? null;
            }
            const lines = get().lines.map((l) => (l.productId === productId ? { ...l, quantity: clampQty(quantity) } : l));
            set({ lines });
            return priceGuest(lines);
          }),

        remove: (productId) =>
          run(async () => {
            if (isCustomer()) {
              await cartService.removeItem(productId);
              return (await cartService.getCart()).data.data ?? null;
            }
            const lines = get().lines.filter((l) => l.productId !== productId);
            set({ lines });
            return priceGuest(lines);
          }),

        clear: async () => {
          if (isCustomer()) await cartService.clearCart().catch(() => undefined);
          set({ lines: [], cart: emptyCart(get().cart) });
        },

        mergeAfterLogin: () =>
          run(async () => {
            if (!isCustomer()) return priceGuest(get().lines);
            const lines = get().lines;
            const res = lines.length ? await cartService.merge(lines) : await cartService.getCart();
            set({ lines: [] });
            return res.data.data ?? null;
          }),

        reset: () => set({ cart: null, error: null }),

        count: () => {
          const cart = get().cart;
          if (cart) return cart.totalItems;
          return get().lines.reduce((n, l) => n + l.quantity, 0);
        },
      };
    },
    {
      name: "ec-cart-v1",
      // Only the guest lines persist; prices are always re-read from the server.
      partialize: (s) => ({ lines: s.lines }),
    }
  )
);

/** Lines lowered to the stock the server reported (never below 1). */
function capToStock(lines: CartLineInput[], cart: CartResponse | null): CartLineInput[] {
  if (!cart) return lines;
  const stock = new Map(cart.items.map((i) => [i.productId, i.stockQuantity]));
  return lines.map((l) => {
    const s = stock.get(l.productId);
    return s !== undefined && s > 0 && l.quantity > s ? { ...l, quantity: s } : l;
  });
}

function emptyCart(prev: CartResponse | null): CartResponse {
  return {
    cartId: prev?.cartId ?? null,
    customerId: prev?.customerId ?? null,
    items: [],
    totalItems: 0,
    totalPrice: 0,
    savings: 0,
    taxTotal: 0,
    shippingEstimate: 0,
    grandTotalEstimate: 0,
    pricesIncludeTax: prev?.pricesIncludeTax ?? false,
    freeShippingThreshold: prev?.freeShippingThreshold ?? null,
    updatedAt: null,
  };
}
