import type { ProductStatus, UserRole } from "./common.types";
import type { OrderStatus } from "./order.types";

/** The order status as the string the API sends ("PAID"…), not the enum. */
export type OrderStatusValue = `${OrderStatus}`;

// Shapes of the admin panel API (/api/admin/*). Catalog routes are open to
// ROLE_ADMIN and ROLE_CATALOG; orders, returns, customers, analytics and
// settings are ROLE_ADMIN only (FR-AD-08).

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
export type PaymentStatusValue = "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";
export type FulfilmentStatus = "UNFULFILLED" | "PICKED" | "PACKED" | "SHIPPED" | "DELIVERED";
export type ShipmentStatus = "LABEL_CREATED" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED" | "EXCEPTION" | "RETURNED";
export type ReturnStatus = "REQUESTED" | "APPROVED" | "REJECTED" | "RECEIVED" | "REFUNDED";
export type ShippingMethod = "STANDARD" | "EXPRESS";

type Ref = { id: string; name: string };

// ── Products and variants ───────────────────────────────────────────────────

/** A parent product row: the variants' status when they agree, otherwise MIXED. */
export interface AdminProductRow {
  id: string;
  code: string;
  name: string;
  brand: string | null;
  category: Ref | null;
  subcategory: Ref | null;
  productType: string | null;
  featured: boolean;
  variantCount: number;
  minPrice: number | null;
  maxPrice: number | null;
  totalStock: number;
  lowStockVariants: number;
  /** Images that failed the URL check (FR-IM-08). */
  brokenImages: number;
  status: ProductStatus | "MIXED";
  primaryImageUrl: string | null;
  updatedAt: string;
}

export type ImageCheckStatus = "OK" | "BROKEN" | "UNCHECKED" | (string & {});

export interface AdminVariant {
  id: string;
  sku: string;
  variantName: string | null;
  color: string | null;
  size: string | null;
  price: number;
  mrp: number | null;
  cost: number | null;
  taxCode: string | null;
  taxRate: number | null;
  stockQuantity: number;
  /** Effective threshold: the SKU's own, or the store default. */
  lowStockThreshold: number;
  ownLowStockThreshold: number | null;
  status: ProductStatus;
  stockStatus: StockStatus;
  urlSlug: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
  primaryImageUrl: string | null;
  imageUrls: string[];
  images: { url: string; checkStatus: ImageCheckStatus | null; checkError: string | null }[];
}

export interface AdminProductDetail extends AdminProductRow {
  shortDescription: string | null;
  description: string | null;
  keyFeatures: string[] | null;
  attributes: Record<string, string> | null;
  variants: AdminVariant[];
}

export interface AdminProductUpdate {
  name?: string;
  brand?: string;
  status?: ProductStatus;
  productType?: string;
  shortDescription?: string;
  description?: string;
  subcategoryId?: string;
  featured?: boolean;
  /** Replaces the list; an empty array clears it. */
  keyFeatures?: string[];
}

export interface AdminVariantUpdate {
  price?: number;
  /** 0 clears it. */
  mrp?: number;
  cost?: number;
  taxCode?: string;
  /** Percent, 0–100. */
  taxRate?: number;
  lowStockThreshold?: number;
  /** Drops the SKU's own threshold so the store default applies. */
  clearLowStockThreshold?: boolean;
  stockQuantity?: number;
  status?: ProductStatus;
}

export type ProductStatusCounts = Record<ProductStatus | "ALL", number>;

export interface AdminProductListParams {
  search?: string;
  status?: ProductStatus;
  categoryId?: string;
  subcategoryId?: string;
  page?: number;
  size?: number;
  sort?: string;
}

// ── Inventory (FR-AD-03) ────────────────────────────────────────────────────

export interface AdminInventoryRow {
  id: string;
  sku: string;
  warehouseId: string | null;
  parentId: string;
  productName: string;
  variantName: string | null;
  categoryName: string | null;
  price: number;
  mrp: number | null;
  taxRate: number | null;
  stockQuantity: number;
  lowStockThreshold: number;
  ownLowStockThreshold: number | null;
  stockStatus: StockStatus;
  status: ProductStatus;
  updatedAt: string;
}

export interface InventoryStats {
  skus: number;
  units: number;
  lowStock: number;
  outOfStock: number;
  lowStockThreshold: number;
}

export interface AdminInventoryListParams {
  search?: string;
  categoryId?: string;
  stock?: "low" | "out";
  page?: number;
  size?: number;
  sort?: string;
}

export type StockMovementSource = "ADJUSTMENT" | "BULK_UPDATE" | "IMPORT" | "RETURN";

export interface StockMovement {
  id: string;
  delta: number;
  quantityAfter: number;
  source: StockMovementSource;
  reason: string | null;
  actor: string | null;
  createdAt: string;
}

// ── Image checks (FR-IM-08) ─────────────────────────────────────────────────

export interface ImageIssue {
  imageId: string;
  url: string;
  error: string | null;
  checkedAt: string | null;
  position: number;
  sku: string;
  productId: string;
  parentId: string;
  productName: string;
  status: ProductStatus;
}

export interface ImageIssuePage {
  content: ImageIssue[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  /** Images not checked yet (checks run in the background after an import). */
  uncheckedImages: number;
}

export interface ImageRecheckResult {
  checked: number;
  broken: number;
  enabled: boolean;
}

// ── Orders, fulfilment and shipping (FR-AD-02, FR-IN-03/04) ─────────────────

export interface AdminOrderRow {
  id: string;
  orderNumber: string;
  status: OrderStatusValue;
  fulfilmentStatus: FulfilmentStatus | null;
  paymentStatus: PaymentStatusValue | null;
  currency: string;
  grandTotal: number;
  itemCount: number;
  shippingMethod: ShippingMethod | null;
  tracking: { carrier: string; trackingNumber: string; status: ShipmentStatus }[];
  customer: { name: string; email: string; city: string; state: string };
  createdAt: string;
}

export interface AdminAddress {
  recipientName: string;
  phone: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface AdminOrderItem {
  id: string;
  productId: string;
  merchantId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  taxCode: string | null;
  taxRate: number;
  taxAmount: number;
  returnedQuantity: number;
}

export interface OrderTimelineEntry {
  /** "" when the entry only changed the fulfilment status. */
  status: OrderStatusValue | "";
  fulfilmentStatus: FulfilmentStatus | null;
  note: string | null;
  actor: string;
  at: string;
}

export interface ShipmentEvent {
  status: ShipmentStatus;
  description: string | null;
  location: string | null;
  occurredAt: string;
}

export interface AdminShipment {
  id: string;
  provider: string;
  carrier: string;
  service: string | null;
  trackingNumber: string;
  trackingUrl: string | null;
  status: ShipmentStatus;
  deliveredAt: string | null;
  createdAt: string;
  labelUrl?: string | null;
  providerReference?: string | null;
  /** Newest first. */
  events: ShipmentEvent[];
}

export interface OrderReturnSummary {
  id: string;
  rmaNumber: string;
  status: ReturnStatus;
  reason: string;
  requestedBy: string;
  /** Set once refunded. */
  refundAmount: number | null;
  restocked: boolean;
  items: { orderItemId: string; quantity: number }[];
  createdAt: string;
  receivedAt: string | null;
  refundedAt: string | null;
}

export interface OrderNotification {
  template: string;
  subject: string;
  status: string;
  toAddress: string;
  createdAt: string;
}

export interface AdminOrderDetail {
  id: string;
  orderNumber: string;
  status: OrderStatusValue;
  fulfilmentStatus: FulfilmentStatus | null;
  currency: string;
  subtotal: number;
  taxTotal: number;
  shippingTotal: number;
  discountTotal: number;
  grandTotal: number;
  refundedTotal: number;
  shippingMethod: ShippingMethod | null;
  paymentStatus: PaymentStatusValue | null;
  paymentReference: string | null;
  shippingAddress: AdminAddress;
  items: AdminOrderItem[];
  timeline: OrderTimelineEntry[];
  shipments: AdminShipment[];
  returns: OrderReturnSummary[];
  notifications: OrderNotification[];
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** `id` is null for a guest order. */
  customer: { id: string | null; fullName: string; email: string; phoneNumber: string | null; orders: number; guest: boolean };
  cancellationReason: string | null;
  cancelledBy: string | null;
}

export interface OrderStats {
  total: number;
  byStatus: Partial<Record<OrderStatusValue, number>>;
  awaitingFulfilment: Partial<Record<"UNFULFILLED" | "PICKED" | "PACKED", number>>;
  returnsByStatus: Partial<Record<ReturnStatus, number>>;
}

/** POST /api/admin/products: manual product entry (FR-AD-01). Blank SKUs are generated. */
export interface AdminProductCreate {
  name: string;
  brand?: string;
  subcategoryId: string;
  productType?: string;
  shortDescription?: string;
  description?: string;
  status: ProductStatus;
  featured?: boolean;
  variants: {
    sku?: string;
    variantName?: string;
    color?: string;
    size?: string;
    price: number;
    mrp?: number;
    taxRate?: number;
    stockQuantity: number;
    lowStockThreshold?: number;
    /** At least one. */
    imageUrls: string[];
  }[];
}

export interface AdminOrderListParams {
  search?: string;
  status?: OrderStatusValue;
  fulfilmentStatus?: FulfilmentStatus;
  page?: number;
  size?: number;
  sort?: string;
}

export interface CreateShipmentRequest {
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  service?: string;
}

export interface TrackingEventRequest {
  status: Exclude<ShipmentStatus, "LABEL_CREATED">;
  description?: string;
  location?: string;
  occurredAt?: string;
}

// ── Returns and refunds (FR-AD-07) ──────────────────────────────────────────

export interface AdminReturn extends OrderReturnSummary {
  /** How the parcel comes back, when the customer chose. */
  method?: "DROPOFF" | "PICKUP" | null;
  /** The refund the lines are worth (price and tax). */
  estimatedRefund?: number;
  adminNote: string | null;
  refundReference: string | null;
  /** What a REFUND pays by default: the lines' price and tax, capped at what's left. */
  refundDue: number;
  updatedAt: string;
  order: {
    id: string;
    orderNumber: string;
    status: OrderStatusValue;
    currency: string;
    grandTotal: number;
    refundedTotal: number;
    customer: { name: string; email: string };
  };
  lines: { orderItemId: string; quantity: number; sku: string; productName: string; unitPrice: number }[];
}

export type ReturnAction = "APPROVE" | "REJECT" | "RECEIVE" | "REFUND";

export interface ReturnActionRequest {
  action: ReturnAction;
  note?: string;
  restock?: boolean;
  refundAmount?: number;
}

// ── Customers and staff (FR-AD-06, FR-AD-08) ────────────────────────────────

export interface AdminCustomerRow {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  role: UserRole;
  enabled: boolean;
  marketingOptIn: boolean;
  /** "City, ST" from the latest order. */
  location: string | null;
  createdAt: string;
  orders: number;
  totalSpent: number;
  lastOrderAt: string | null;
}

export interface AdminCustomerAddress extends AdminAddress {
  id: string;
  label: string;
  isDefault: boolean;
}

export interface AdminCustomerDetail {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  role: UserRole;
  enabled: boolean;
  marketingOptIn: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  totalSpent: number;
  addresses: AdminCustomerAddress[];
  orders: {
    id: string;
    orderNumber: string;
    status: OrderStatusValue;
    fulfilmentStatus: FulfilmentStatus | null;
    currency: string;
    grandTotal: number;
    createdAt: string;
    paymentStatus: PaymentStatusValue | null;
  }[];
}

export interface AdminCustomerListParams {
  search?: string;
  role?: UserRole;
  page?: number;
  size?: number;
  sort?: string;
}

// ── Analytics (FR-IN-05) ────────────────────────────────────────────────────

export type AnalyticsEventType = "PRODUCT_VIEW" | "ADD_TO_CART" | "CHECKOUT_START" | "PURCHASE" | "SEARCH";

export interface TopProduct {
  productId: string;
  sku: string;
  name: string;
  count: number;
}

export interface AnalyticsSummary {
  from: string;
  to: string;
  events: Record<AnalyticsEventType, { events: number; sessions: number }>;
  orders: number;
  revenue: number;
  /** Percent, or null with no sessions. */
  conversionRate: number | null;
  topViewedProducts: TopProduct[];
  topAddedToCartProducts: TopProduct[];
}

// ── Reports (design 12) ─────────────────────────────────────────────────────

export interface SalesReport {
  from: string;
  to: string;
  currency: string;
  totals: { revenue: number; orders: number; units: number; averageOrderValue: number };
  /** The preceding period of the same length, for deltas. */
  previous: { revenue: number; orders: number };
  daily: { date: string; revenue: number; orders: number }[];
  byDepartment: { categoryId: string | null; name: string; revenue: number; units: number }[];
  topProducts: {
    productId: string;
    parentId: string | null;
    name: string;
    sku: string;
    imageUrl: string | null;
    units: number;
    revenue: number;
    stockLeft: number;
  }[];
}

// ── Settings (read-only, from server configuration) ─────────────────────────

export interface AdminSettings {
  currency: string;
  paymentProvider: string;
  manualPaymentConfirmation: boolean;
  shippingProvider: "manual" | "shippo" | (string & {});
  pricesIncludeTax: boolean;
  /** The API sends fee and threshold as decimal strings ("5.99"). */
  shipping: { method: ShippingMethod; fee: string | number; estimatedDelivery: string }[];
  freeShippingThreshold: string | number | null;
  lowStockThreshold: number;
  returnWindowDays: number;
  imageChecks: boolean;
  email: "smtp" | "log-only" | (string & {});
}

// ── Catalog import, bulk update and export (FR-IM-01..11, NFR-06) ───────────

export interface ImportRowError {
  row: number;
  sku: string | null;
  reason: string;
}

export interface ImportWarning {
  row: number;
  sku: string | null;
  message: string;
}

export interface ImportImageError {
  row: number;
  sku: string | null;
  column: string;
  url: string;
  reason: string;
}

export interface ImportedRow {
  row: number;
  sku: string;
  parentProductId: string;
  generated: boolean;
  action?: "CREATED" | "UPDATED";
}

export interface CatalogImportReport {
  fileName: string;
  totalRows: number;
  importedRows: number;
  createdRows: number;
  updatedRows: number;
  failedRows: number;
  parentProductsCreated: number;
  parentProductsUpdated: number;
  ignoredColumns: string[];
  imported: ImportedRow[];
  errors: ImportRowError[];
  warnings: ImportWarning[];
  imageErrors: ImportImageError[];
  /** False when image URL checks are switched off on the server. */
  imagesChecked: boolean;
  durationMs: number;
}

export interface BulkUpdateReport {
  fileName: string;
  totalRows: number;
  updatedRows: number;
  unchangedRows: number;
  failedRows: number;
  columns: string[];
  errors: ImportRowError[];
  durationMs: number;
}
