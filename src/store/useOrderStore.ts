"use client";
import { create } from "zustand";
import type { Order, OrderSummary, OrderListMeta } from "@/types/api/order.types";

interface OrderState {
  orders:          OrderSummary[];
  currentOrder:    Order | null;
  pagination:      OrderListMeta | null;
  isLoadingList:   boolean;
  isLoadingDetail: boolean;
  isCheckingOut:   boolean;
  isCancelling:    boolean;
  error:           string | null;

  // Actions
  setOrders:         (orders: OrderSummary[], pagination: OrderListMeta) => void;
  setCurrentOrder:   (order: Order) => void;
  prependOrder:      (order: Order) => void;
  patchOrder:        (order: Order) => void;
  clearCurrentOrder: () => void;
  setIsLoadingList:   (v: boolean) => void;
  setIsLoadingDetail: (v: boolean) => void;
  setIsCheckingOut:   (v: boolean) => void;
  setIsCancelling:    (v: boolean) => void;
  setError:           (error: string | null) => void;
}

export const useOrderStore = create<OrderState>()((set, get) => ({
  orders:          [],
  currentOrder:    null,
  pagination:      null,
  isLoadingList:   false,
  isLoadingDetail: false,
  isCheckingOut:   false,
  isCancelling:    false,
  error:           null,

  setOrders: (orders, pagination) => set({ orders, pagination }),

  setCurrentOrder: (order) => set({ currentOrder: order }),

  // Prepend newly created order as a summary at the front of the list
  prependOrder: (order) => {
    const summary: OrderSummary = {
      id:          order.id,
      orderNumber: order.orderNumber,
      status:      order.status,
      currency:    order.currency,
      grandTotal:  order.grandTotal,
      createdAt:   order.createdAt,
    };
    const current = get().pagination;
    set({
      orders:     [summary, ...get().orders],
      pagination: current
        ? { ...current, totalElements: current.totalElements + 1 }
        : null,
    });
  },

  // Patch matching row in the list and update currentOrder if it's the same order
  patchOrder: (order) => {
    const summary: OrderSummary = {
      id:          order.id,
      orderNumber: order.orderNumber,
      status:      order.status,
      currency:    order.currency,
      grandTotal:  order.grandTotal,
      createdAt:   order.createdAt,
    };
    set((state) => ({
      orders:       state.orders.map((o) => (o.id === order.id ? summary : o)),
      currentOrder: state.currentOrder?.id === order.id ? order : state.currentOrder,
    }));
  },

  clearCurrentOrder: () => set({ currentOrder: null }),

  setIsLoadingList:   (v) => set({ isLoadingList: v }),
  setIsLoadingDetail: (v) => set({ isLoadingDetail: v }),
  setIsCheckingOut:   (v) => set({ isCheckingOut: v }),
  setIsCancelling:    (v) => set({ isCancelling: v }),
  setError:           (error) => set({ error }),
}));
