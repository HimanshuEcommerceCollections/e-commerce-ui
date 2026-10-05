// ─── Enums ───────────────────────────────────────────────────────────────────

export enum OrderStatus {
  PENDING_PAYMENT = "PENDING_PAYMENT",
  PAID            = "PAID",
  CONFIRMED       = "CONFIRMED",
  SHIPPED         = "SHIPPED",
  DELIVERED       = "DELIVERED",
  CANCELLED       = "CANCELLED",
  PAYMENT_FAILED  = "PAYMENT_FAILED",
  REFUNDED        = "REFUNDED",
}

export enum PaymentStatus {
  PENDING            = "PENDING",
  SUCCEEDED          = "SUCCEEDED",
  FAILED             = "FAILED",
  REFUNDED           = "REFUNDED",
  PARTIALLY_REFUNDED = "PARTIALLY_REFUNDED",
}

export type FulfilmentStatus = "UNFULFILLED" | "PICKED" | "PACKED" | "SHIPPED" | "DELIVERED";
export type ShippingMethod = "STANDARD" | "EXPRESS";
export type ShipmentStatus = "LABEL_CREATED" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED" | "EXCEPTION" | "RETURNED";
export type ReturnStatus = "REQUESTED" | "APPROVED" | "REJECTED" | "RECEIVED" | "REFUNDED";

// ─── Core Data Models ────────────────────────────────────────────────────────

export interface ShippingAddressSnapshot {
  recipientName: string;
  phone:         string | null;
  addressLine1:  string;
  addressLine2:  string | null;
  city:          string;
  state:         string;
  postalCode:    string;
  country:       string;
}

export interface OrderItem {
  id:               string;
  productId:        string;
  merchantId:       string;
  productName:      string;
  sku:              string;
  unitPrice:        number;
  quantity:         number;
  lineTotal:        number;
  taxCode:          string | null;
  taxRate:          number;
  taxAmount:        number;
  returnedQuantity: number;
}

/** One entry of the order's timeline (FR-ST-12). */
export interface OrderTimelineEvent {
  status:           string;
  fulfilmentStatus: FulfilmentStatus | null;
  note:             string | null;
  actor:            string;
  at:               string;
}

export interface Shipment {
  id:             string;
  provider:       string;
  carrier:        string;
  service:        string | null;
  trackingNumber: string;
  trackingUrl:    string | null;
  status:         ShipmentStatus;
  deliveredAt:    string | null;
  createdAt:      string;
  events: { status: ShipmentStatus; description: string | null; location: string | null; occurredAt: string }[];
}

export interface OrderReturn {
  id:           string;
  rmaNumber:    string;
  status:       ReturnStatus;
  reason:       string;
  requestedBy:  "CUSTOMER" | "ADMIN";
  refundAmount: number | null;
  restocked:    boolean;
  items:        { orderItemId: string; quantity: number }[];
  createdAt:    string;
  receivedAt:   string | null;
  refundedAt:   string | null;
}

export interface Order {
  id:               string;
  orderNumber:      string;
  status:           OrderStatus;
  fulfilmentStatus: FulfilmentStatus | null;
  currency:         string;
  subtotal:         number;
  taxTotal:         number;
  shippingTotal:    number;
  discountTotal:    number;
  grandTotal:       number;
  refundedTotal:    number;
  shippingMethod:   ShippingMethod | null;
  paymentStatus:    PaymentStatus | null;
  shippingAddress:  ShippingAddressSnapshot;
  items:            OrderItem[];
  /** Present on the order detail (GET /api/orders/:id). */
  timeline?:        OrderTimelineEvent[];
  shipments?:       Shipment[];
  returns?:         OrderReturn[];
  paidAt:           string | null;
  shippedAt:        string | null;
  deliveredAt:      string | null;
  createdAt:        string;
  updatedAt:        string;
}

export interface OrderSummary {
  id:               string;
  orderNumber:      string;
  status:           OrderStatus;
  fulfilmentStatus: FulfilmentStatus | null;
  currency:         string;
  grandTotal:       number;
  createdAt:        string;
}

/** POST /api/orders returns the order and, for Stripe, the secret to confirm payment with. */
export interface CheckoutResponse {
  order:        Order;
  clientSecret: string | null;
}

export interface ShippingOption {
  method:            ShippingMethod;
  label:             string;
  estimatedDelivery: string;
  fee:               number;
  free:              boolean;
}

/** POST /api/orders/quote (FR-ST-10). */
export interface CheckoutQuote {
  currency:              string;
  shippingMethod:        ShippingMethod;
  shippingOptions:       ShippingOption[];
  freeShippingThreshold: number | null;
  subtotal:              number;
  taxTotal:              number;
  shippingTotal:         number;
  discountTotal:         number;
  grandTotal:            number;
  pricesIncludeTax:      boolean;
}

export interface ReturnRequestBody {
  items:  { orderItemId: string; quantity: number }[];
  reason: string;
}

// ─── Request Types ───────────────────────────────────────────────────────────

export interface CheckoutRequest {
  addressId:       string;
  shippingMethod?: ShippingMethod;
}

export interface OrderListParams {
  page?: number;
  size?: number;
}

// ─── Pagination Meta ─────────────────────────────────────────────────────────

export interface OrderListMeta {
  currentPage:   number;
  totalPages:    number;
  totalElements: number;
  pageSize:      number;
  isFirst:       boolean;
  isLast:        boolean;
}

// ─── Status Helpers ──────────────────────────────────────────────────────────

/** Unshipped orders can be cancelled; paid ones are refunded in full. */
export const isCancellable = (status: OrderStatus): boolean =>
  [OrderStatus.PENDING_PAYMENT, OrderStatus.PAID, OrderStatus.CONFIRMED].includes(status);

export const isTerminal = (status: OrderStatus): boolean =>
  [
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
    OrderStatus.REFUNDED,
    OrderStatus.PAYMENT_FAILED,
  ].includes(status);

export const isActive = (status: OrderStatus): boolean =>
  [OrderStatus.PAID, OrderStatus.CONFIRMED, OrderStatus.SHIPPED].includes(status);

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  OrderStatus.PENDING_PAYMENT,
  OrderStatus.PAID,
  OrderStatus.CONFIRMED,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  [OrderStatus.PENDING_PAYMENT]: "Pending Payment",
  [OrderStatus.PAID]:            "Paid",
  [OrderStatus.CONFIRMED]:       "Confirmed",
  [OrderStatus.SHIPPED]:         "Shipped",
  [OrderStatus.DELIVERED]:       "Delivered",
  [OrderStatus.CANCELLED]:       "Cancelled",
  [OrderStatus.PAYMENT_FAILED]:  "Payment Failed",
  [OrderStatus.REFUNDED]:        "Refunded",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]:            "Pending",
  [PaymentStatus.SUCCEEDED]:          "Paid",
  [PaymentStatus.FAILED]:             "Failed",
  [PaymentStatus.REFUNDED]:           "Refunded",
  [PaymentStatus.PARTIALLY_REFUNDED]: "Partly refunded",
};
