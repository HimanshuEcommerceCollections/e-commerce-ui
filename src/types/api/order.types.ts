import type { CartItemResponse, CartLineInput } from "./cart.types";

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
  parentId:         string | null;
  merchantId:       string;
  productName:      string;
  sku:              string;
  variantName:      string | null;
  color:            string | null;
  size:             string | null;
  imageUrl:         string | null;
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

export interface ShipmentEvent {
  status:      ShipmentStatus;
  description: string | null;
  location:    string | null;
  occurredAt:  string;
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
  /** Newest first. */
  events:         ShipmentEvent[];
}

export type ReturnMethod = "DROPOFF" | "PICKUP";

export interface OrderReturn {
  id:              string;
  rmaNumber:       string;
  status:          ReturnStatus;
  reason:          string;
  method:          ReturnMethod | null;
  requestedBy:     "CUSTOMER" | "ADMIN";
  /** Set once refunded. */
  refundAmount:    number | null;
  /** Price and tax of the returned lines. */
  estimatedRefund: number;
  restocked:       boolean;
  items:           { orderItemId: string; quantity: number }[];
  createdAt:       string;
  receivedAt:      string | null;
  refundedAt:      string | null;
}

/** ISO dates, business days after payment (or placement). */
export interface DeliveryWindow {
  from: string;
  to:   string;
}

export interface Order {
  id:                string;
  orderNumber:       string;
  status:            OrderStatus;
  fulfilmentStatus:  FulfilmentStatus | null;
  currency:          string;
  subtotal:          number;
  taxTotal:          number;
  shippingTotal:     number;
  discountTotal:     number;
  grandTotal:        number;
  refundedTotal:     number;
  shippingMethod:    ShippingMethod | null;
  paymentStatus:     PaymentStatus | null;
  customerEmail:     string | null;
  guest:             boolean;
  estimatedDelivery: DeliveryWindow | null;
  shippingAddress:   ShippingAddressSnapshot;
  items:             OrderItem[];
  timeline:          OrderTimelineEvent[];
  shipments:         Shipment[];
  returns:           OrderReturn[];
  /** Delivered + the return window; null until delivered. */
  returnableUntil:   string | null;
  paidAt:            string | null;
  shippedAt:         string | null;
  deliveredAt:       string | null;
  createdAt:         string;
  updatedAt:         string;
}

export interface OrderSummaryItem {
  productId:   string;
  productName: string;
  variantName: string | null;
  color:       string | null;
  size:        string | null;
  imageUrl:    string | null;
  quantity:    number;
}

export interface OrderSummary {
  id:                string;
  orderNumber:       string;
  status:            OrderStatus;
  fulfilmentStatus:  FulfilmentStatus | null;
  currency:          string;
  grandTotal:        number;
  itemCount:         number;
  createdAt:         string;
  deliveredAt:       string | null;
  estimatedDelivery: DeliveryWindow | null;
  shipToName:        string;
  items:             OrderSummaryItem[];
  latestShipment:    { carrier: string; trackingNumber: string; trackingUrl: string | null; status: ShipmentStatus } | null;
  returnableUntil:   string | null;
}

/** POST /api/orders returns the order and, for Stripe, the secret to confirm payment with. */
export interface CheckoutResponse {
  order:        Order;
  clientSecret: string | null;
}

/** POST /api/checkout/guest also returns the secret that lets this browser read the order. */
export interface GuestCheckoutResponse extends CheckoutResponse {
  guestToken: string;
}

export interface ShippingOption {
  method:            ShippingMethod;
  label:             string;
  estimatedDelivery: string;
  minDays:           number;
  maxDays:           number;
  fee:               number;
  free:              boolean;
}

/** POST /api/checkout/quote (FR-ST-10). */
export interface CheckoutQuote {
  currency:              string;
  shippingMethod:        ShippingMethod;
  shippingOptions:       ShippingOption[];
  freeShippingThreshold: number | null;
  subtotal:              number;
  savings:               number;
  taxTotal:              number;
  shippingTotal:         number;
  discountTotal:         number;
  grandTotal:            number;
  pricesIncludeTax:      boolean;
  lines:                 CartItemResponse[];
}

export interface ReturnRequestBody {
  items:   { orderItemId: string; quantity: number }[];
  reason:  string;
  method?: ReturnMethod;
}

/** POST /api/orders/track: a guest's view of one order (FR-ST-12, FR-IN-04). */
export interface TrackedOrder {
  orderNumber:       string;
  status:            OrderStatus;
  fulfilmentStatus:  FulfilmentStatus | null;
  createdAt:         string;
  shippingMethod:    ShippingMethod | null;
  estimatedDelivery: DeliveryWindow | null;
  deliveredAt:       string | null;
  items:             Omit<OrderSummaryItem, "productId">[];
  shipments:         Shipment[];
  timeline:          OrderTimelineEvent[];
  /** City only, for privacy. */
  shipTo:            { city: string; state: string; postalCode5: string };
}

// ─── Request Types ───────────────────────────────────────────────────────────

export interface ShippingAddressInput {
  recipientName: string;
  phone?:        string;
  addressLine1:  string;
  addressLine2?: string;
  city:          string;
  state:         string;
  postalCode:    string;
  country:       string; // "US"
}

/** Signed-in checkout from the server cart: a saved address or one typed in. */
export interface CheckoutRequest {
  addressId?:       string;
  shippingAddress?: ShippingAddressInput;
  saveAddress?:     boolean;
  shippingMethod?:  ShippingMethod;
}

export interface GuestCheckoutRequest {
  email:           string;
  marketingOptIn?: boolean;
  shippingAddress: ShippingAddressInput;
  shippingMethod?: ShippingMethod;
  items:           CartLineInput[];
}

export interface OrderListParams {
  page?:   number;
  size?:   number;
  /** open = on the way; done = delivered, cancelled or refunded. */
  status?: "open" | "done";
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
