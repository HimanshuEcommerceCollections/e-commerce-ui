import type { FulfilmentStatus, Order, OrderSummary, ReturnStatus, ShipmentStatus } from "@/types/api/order.types";

/** What a shopper reads for each order state (FR-ST-12, FR-IN-04). */
export function orderStatusLabel(o: Pick<Order | OrderSummary, "status" | "fulfilmentStatus">): string {
  switch (o.status) {
    case "PENDING_PAYMENT": return "Awaiting payment";
    case "PAID": return "Order confirmed";
    case "CONFIRMED": return o.fulfilmentStatus === "PACKED" ? "Packed" : "Preparing";
    case "SHIPPED": return "Shipped";
    case "DELIVERED": return "Delivered";
    case "CANCELLED": return "Cancelled";
    case "PAYMENT_FAILED": return "Payment failed";
    case "REFUNDED": return "Refunded";
    default: return o.status;
  }
}

export type Tone = "ok" | "warn" | "err" | "muted" | "info";

export function orderTone(status: string): Tone {
  if (status === "DELIVERED") return "ok";
  if (status === "PENDING_PAYMENT") return "warn";
  if (status === "CANCELLED" || status === "PAYMENT_FAILED") return "err";
  if (status === "REFUNDED") return "muted";
  return "info";
}

/** The five tracker steps and how far an order has got (−1 for cancelled or failed). */
export const TRACKER_STEPS = ["Ordered", "Confirmed", "Packed", "Shipped", "Delivered"] as const;

export function trackerIndex(status: string, fulfilment: FulfilmentStatus | null): number {
  switch (status) {
    case "PENDING_PAYMENT": return 0;
    case "PAID": return 1;
    case "CONFIRMED": return fulfilment === "PACKED" ? 2 : 1;
    case "SHIPPED": return 3;
    case "DELIVERED":
    case "REFUNDED": return 4;
    default: return -1;
  }
}

export const SHIPMENT_LABEL: Record<ShipmentStatus, string> = {
  LABEL_CREATED: "Label created",
  IN_TRANSIT: "In transit",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  EXCEPTION: "Delivery problem",
  RETURNED: "Returned to sender",
};

export const RETURN_LABEL: Record<ReturnStatus, string> = {
  REQUESTED: "Return requested",
  APPROVED: "Return approved",
  REJECTED: "Return declined",
  RECEIVED: "Return received",
  REFUNDED: "Refunded",
};

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/** Money in the order's currency. */
export const money = (n: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
