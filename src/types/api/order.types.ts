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
  PENDING   = "PENDING",
  SUCCEEDED = "SUCCEEDED",
  FAILED    = "FAILED",
  REFUNDED  = "REFUNDED",
}

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
  productId:   string;
  merchantId:  string;
  productName: string;
  sku:         string;
  unitPrice:   number;
  quantity:    number;
  lineTotal:   number;
}

export interface Order {
  id:              string;
  orderNumber:     string;
  status:          OrderStatus;
  currency:        string;
  subtotal:        number;
  taxTotal:        number;
  shippingTotal:   number;
  discountTotal:   number;
  grandTotal:      number;
  paymentStatus:   PaymentStatus | null;
  shippingAddress: ShippingAddressSnapshot;
  items:           OrderItem[];
  createdAt:       string;
  updatedAt:       string;
}

export interface OrderSummary {
  id:          string;
  orderNumber: string;
  status:      OrderStatus;
  currency:    string;
  grandTotal:  number;
  createdAt:   string;
}

// ─── Request Types ───────────────────────────────────────────────────────────

export interface CheckoutRequest {
  addressId: string;
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

export const isCancellable = (status: OrderStatus): boolean =>
  status === OrderStatus.PENDING_PAYMENT;

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
  [PaymentStatus.PENDING]:   "Pending",
  [PaymentStatus.SUCCEEDED]: "Paid",
  [PaymentStatus.FAILED]:    "Failed",
  [PaymentStatus.REFUNDED]:  "Refunded",
};
