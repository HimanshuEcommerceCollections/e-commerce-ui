"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import cartService from "@/services/cart.service";
import { useAuthStore } from "@/store/useAuthStore";
import { getApiErrorMessage } from "@/lib/apiError";
import { getPromoCode, setPromoCode } from "@/lib/promo";
import type { CartLineInput, CartResponse } from "@/types/api/cart.types";

/** localStorage key of the guest lines (also watched for changes from other tabs). */
export const CART_STORAGE_KEY = "ec-cart-v1";

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
 * Pages read `cart` for display and call the actions; every action re-prices,
 * with the promo code applied in the cart (lib/promo, CONTRACT B1).
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
  /** Puts a removed line back (Undo), at its old position for a guest cart. */
  restore: (productId: string, quantity: number, index: number) => Promise<CartResponse | null>;
  /** Re-reads the guest lines another tab saved, then re-prices. */
  syncFromStorage: () => Promise<CartResponse | null>;
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

      /**
       * Runs a pricing call with the applied promo code. A code the server
       * refuses (400) is forgotten and the cart priced without it.
       */
      async function withPromo(call: (code: string | null) => Promise<CartResponse | null>) {
        const code = getPromoCode();
        if (!code) return call(null);
        try {
          return await call(code);
        } catch (e) {
          if ((e as { response?: { status?: number } }).response?.status !== 400) throw e;
          setPromoCode(null);
          return call(null);
        }
      }

      const priceGuest = async (lines: CartLineInput[]) => {
        if (!lines.length) return emptyCart(get().cart);
        return withPromo(async (code) => (await cartService.preview(lines, code)).data.data ?? null);
      };

      /** The server cart; re-read with the promo code when one is applied (mutations don't take it). */
      const serverCart = async (res?: CartResponse | null) => {
        if (res !== undefined && !getPromoCode()) return res;
        return withPromo(async (code) => (await cartService.getCart(code)).data.data ?? null);
      };

      return {
        lines: [],
        cart: null,
        loading: false,
        error: null,

        refresh: () =>
          run(async () => {
            if (isCustomer()) return serverCart();
            return priceGuest(get().lines);
          }),

        add: (productId, quantity = 1) =>
          run(async () => {
            if (isCustomer()) {
              return serverCart((await cartService.addItem({ productId, quantity })).data.data ?? null);
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
              return serverCart((await cartService.updateItem(productId, { quantity: clampQty(quantity) })).data.data ?? null);
            }
            const lines = get().lines.map((l) => (l.productId === productId ? { ...l, quantity: clampQty(quantity) } : l));
            set({ lines });
            return priceGuest(lines);
          }),

        remove: (productId) =>
          run(async () => {
            if (isCustomer()) {
              await cartService.removeItem(productId);
              return serverCart();
            }
            const lines = get().lines.filter((l) => l.productId !== productId);
            set({ lines });
            return priceGuest(lines);
          }),

        restore: (productId, quantity, index) =>
          run(async () => {
            if (isCustomer()) {
              // The server cart keeps its own order; the cart page re-places the line.
              return serverCart((await cartService.addItem({ productId, quantity })).data.data ?? null);
            }
            const lines = get().lines.filter((l) => l.productId !== productId);
            lines.splice(Math.max(0, Math.min(index, lines.length)), 0, { productId, quantity: clampQty(quantity) });
            const cart = await priceGuest(lines);
            set({ lines: capToStock(lines, cart) });
            return cart;
          }),

        syncFromStorage: async () => {
          await useCartStore.persist.rehydrate();
          return get().refresh();
        },

        clear: async () => {
          if (isCustomer()) await cartService.clearCart().catch(() => undefined);
          set({ lines: [], cart: emptyCart(get().cart) });
        },

        mergeAfterLogin: () =>
          run(async () => {
            if (!isCustomer()) return priceGuest(get().lines);
            const lines = get().lines;
            const merged = lines.length ? (await cartService.merge(lines)).data.data ?? null : undefined;
            set({ lines: [] });
            return serverCart(merged);
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
      name: CART_STORAGE_KEY,
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
