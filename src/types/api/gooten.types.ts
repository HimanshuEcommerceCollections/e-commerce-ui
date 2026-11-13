import type { ProductStatus } from "./common.types";

export interface GootenStatus {
  vendor: "GOOTEN";
  /** The Settings › API integrations entry; null until Gooten is connected. */
  integration: { slug: string; name: string } | null;
  recipeIdConfigured: boolean;
  billingKeyConfigured: boolean;
  testMode: boolean;
  currency: string;
  connection: { ok: boolean; products?: number; error?: string };
  importedProducts: number;
  ordersSent: number;
}

export interface GootenCatalogRow {
  id: number;
  name: string;
  shortDescription: string | null;
  retailPrice: number | null;
  currency: string;
  imageUrl: string | null;
  categories: string[];
  importedParentId: string | null;
}

export interface GootenCatalog {
  products: GootenCatalogRow[];
  categories: string[];
  total: number;
}

export interface GootenVariant {
  sku: string;
  ourSku: string;
  /** What Gooten charges us per unit. */
  cost: number | null;
  color: string | null;
  size: string | null;
  name: string;
  options: Array<{ name: string; value: string }>;
  imageUrl: string | null;
}

export interface GootenProductDetail {
  id: number;
  name: string;
  shortDescription?: string;
  description?: string;
  retailPrice: number | null;
  currency: string;
  images: string[];
  categories: string[];
  importedParentId: string | null;
  variants: GootenVariant[];
}

export interface GootenImportRequest {
  subcategoryId: string;
  markupPercent: number;
  status: ProductStatus;
  skus?: string[];
  name?: string;
  brand?: string;
  printFileUrl?: string;
}

export interface GootenLink {
  id: string;
  parentId: string;
  name: string;
  code: string;
  vendorProductId: string;
  vendorName: string;
  variants: number;
  minPrice: number | null;
  maxPrice: number | null;
  statuses: ProductStatus[];
  markupPercent: number;
  printFileUrl: string | null;
  importedBy: string | null;
  createdAt: string;
}

export type GootenShipMethod = "STANDARD" | "EXPEDITED" | "OVERNIGHT";

export interface GootenAttempt {
  id: string;
  createdAt: string;
  status: string;
  vendorOrderId: string | null;
  testMode: boolean;
  shipMethod: GootenShipMethod;
  error: string | null;
  submittedBy: string | null;
}

export interface GootenOrderRow {
  orderId: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentStatus: string | null;
  recipient: string;
  shipTo: string;
  items: Array<{ productName: string; sku: string; quantity: number }>;
  submission: GootenAttempt | null;
  attempts: GootenAttempt[];
}
