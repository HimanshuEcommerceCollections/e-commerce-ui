// ─── User ────────────────────────────────────────────────────────────────────

export type UserRole = "customer" | "merchant" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

// ─── Merchant ────────────────────────────────────────────────────────────────

export type MerchantStatus = "pending" | "active" | "suspended";

export interface Merchant {
  id: string;
  userId: string;
  storeName: string;
  storeSlug: string;
  logoUrl?: string;
  description?: string;
  status: MerchantStatus;
  createdAt: string;
}

// ─── Product ─────────────────────────────────────────────────────────────────

export interface ProductVariant {
  id: string;
  name: string;       // e.g. "Red / L"
  sku: string;
  price: number;      // cents
  stock: number;
  imageUrl?: string;
}

export interface Product {
  id: string;
  merchantId: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  imageUrls: string[];
  variants: ProductVariant[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string;
  variantId: string;
  merchantId: string;
  name: string;
  variantName: string;
  imageUrl?: string;
  price: number;      // cents
  quantity: number;
}

// ─── Order ───────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface OrderItem {
  productId: string;
  variantId: string;
  merchantId: string;
  name: string;
  variantName: string;
  imageUrl?: string;
  price: number;
  quantity: number;
}

export interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  status: OrderStatus;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  stripePaymentIntentId?: string;
  createdAt: string;
  updatedAt: string;
}
