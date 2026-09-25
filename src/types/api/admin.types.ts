import type { ProductStatus } from "./common.types";
import type { Order, OrderStatus } from "./order.types";

/** The order status as the string the API sends ("PAID"…), not the enum. */
export type OrderStatusValue = `${OrderStatus}`;

// Shapes of the admin panel API (/api/admin/*, ROLE_ADMIN only).

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

/** A parent product row: the variants' status when they agree, otherwise MIXED. */
export interface AdminProductRow {
  id: string;
  code: string;
  name: string;
  brand: string | null;
  category: { id: string; name: string } | null;
  variantCount: number;
  minPrice: number | null;
  maxPrice: number | null;
  totalStock: number;
  lowStockVariants: number;
  status: ProductStatus | "MIXED";
  primaryImageUrl: string | null;
  updatedAt: string;
}

export interface AdminVariant {
  id: string;
  sku: string;
  variantName: string | null;
  color: string | null;
  size: string | null;
  price: number;
  stockQuantity: number;
  status: ProductStatus;
  stockStatus: StockStatus;
  primaryImageUrl: string | null;
  imageUrls: string[];
}

export interface AdminProductDetail extends AdminProductRow {
  shortDescription: string | null;
  description: string | null;
  variants: AdminVariant[];
}

export type ProductStatusCounts = Record<ProductStatus | "ALL", number>;

export interface AdminProductListParams {
  search?: string;
  status?: ProductStatus;
  categoryId?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface AdminInventoryRow {
  id: string;
  sku: string;
  parentId: string;
  productName: string;
  variantName: string | null;
  categoryName: string | null;
  price: number;
  stockQuantity: number;
  lowStockThreshold: number;
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

export interface AdminOrderRow {
  id: string;
  orderNumber: string;
  status: OrderStatusValue;
  paymentStatus: Order["paymentStatus"];
  currency: string;
  grandTotal: number;
  itemCount: number;
  customer: { name: string; email: string; city: string; state: string };
  createdAt: string;
}

export interface AdminOrderDetail extends Order {
  customer: { id: string; fullName: string; email: string; phoneNumber: string | null; orders: number };
  cancellationReason: string | null;
  cancelledBy: string | null;
}

export interface OrderStats {
  total: number;
  byStatus: Partial<Record<OrderStatusValue, number>>;
}

export interface AdminOrderListParams {
  search?: string;
  status?: OrderStatusValue;
  page?: number;
  size?: number;
  sort?: string;
}

// Catalog import (POST /api/catalog/import)

export interface ImportRowError {
  row: number;
  sku: string | null;
  reason: string;
}

export interface ImportedRow {
  row: number;
  sku: string;
  parentProductId: string;
  generated: boolean;
}

export interface CatalogImportReport {
  fileName: string;
  totalRows: number;
  importedRows: number;
  failedRows: number;
  parentProductsCreated: number;
  ignoredColumns: string[];
  imported: ImportedRow[];
  errors: ImportRowError[];
}
