"use client";
import { useOrderStore } from "@/store/useOrderStore";
import orderService from "@/services/order.service";
import type {
  CheckoutRequest,
  Order,
  OrderListParams,
} from "@/types/api/order.types";

type AxiosErrorShape = { response?: { data?: { message?: string } } };

const extractMessage = (err: unknown, fallback: string): string =>
  (err as AxiosErrorShape).response?.data?.message ??
  (err instanceof Error ? err.message : fallback);

export const useOrder = () => {
  const {
    orders,
    currentOrder,
    pagination,
    isLoadingList,
    isLoadingDetail,
    isCheckingOut,
    isCancelling,
    error,
    setOrders,
    setCurrentOrder,
    prependOrder,
    patchOrder,
    clearCurrentOrder,
    setIsLoadingList,
    setIsLoadingDetail,
    setIsCheckingOut,
    setIsCancelling,
    setError,
  } = useOrderStore();

  // GET /api/orders — load paginated list for the authenticated user
  const fetchOrders = async (params?: OrderListParams) => {
    setIsLoadingList(true);
    setError(null);
    try {
      const res = await orderService.getOrders(params);
      const page = res.data.data!;
      setOrders(page.content, {
        currentPage:   page.number,
        totalPages:    page.totalPages,
        totalElements: page.totalElements,
        pageSize:      page.size,
        isFirst:       page.number === 0,
        isLast:        page.number >= page.totalPages - 1,
      });
    } catch (err: unknown) {
      setError(extractMessage(err, "Failed to fetch orders"));
    } finally {
      setIsLoadingList(false);
    }
  };

  // GET /api/orders/:id — load full order detail
  const fetchOrder = async (id: string) => {
    setIsLoadingDetail(true);
    setError(null);
    try {
      const res = await orderService.getOrder(id);
      setCurrentOrder(res.data.data!);
    } catch (err: unknown) {
      setError(extractMessage(err, "Failed to fetch order"));
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // POST /api/orders — checkout; returns the created Order for navigation
  const checkout = async (request: CheckoutRequest): Promise<Order> => {
    setIsCheckingOut(true);
    setError(null);
    try {
      const res = await orderService.checkout(request);
      const order = res.data.data!;
      prependOrder(order);
      setCurrentOrder(order);
      return order;
    } catch (err: unknown) {
      setError(extractMessage(err, "Checkout failed"));
      throw err;
    } finally {
      setIsCheckingOut(false);
    }
  };

  // POST /api/orders/:id/cancel — cancel a PENDING_PAYMENT order
  const cancelOrder = async (id: string) => {
    setIsCancelling(true);
    setError(null);
    try {
      const res = await orderService.cancelOrder(id);
      patchOrder(res.data.data!);
    } catch (err: unknown) {
      setError(extractMessage(err, "Failed to cancel order"));
      throw err;
    } finally {
      setIsCancelling(false);
    }
  };

  // POST /api/orders/:id/pay — admin: manually mark order as paid
  const markOrderPaid = async (id: string) => {
    setIsLoadingDetail(true);
    setError(null);
    try {
      const res = await orderService.markPaid(id);
      patchOrder(res.data.data!);
    } catch (err: unknown) {
      setError(extractMessage(err, "Failed to mark order as paid"));
      throw err;
    } finally {
      setIsLoadingDetail(false);
    }
  };

  return {
    // State
    orders,
    currentOrder,
    pagination,
    isLoadingList,
    isLoadingDetail,
    isCheckingOut,
    isCancelling,
    error,

    // Methods — import any of these directly in your components
    fetchOrders,
    fetchOrder,
    checkout,
    cancelOrder,
    markOrderPaid,
    clearCurrentOrder,
    clearError: () => setError(null),
  };
};
