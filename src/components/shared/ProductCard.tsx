"use client";
import { ShoppingCart } from "lucide-react";

export type ProductStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";

export interface ProductSummary {
  id:              string;
  name:            string;
  price:           number;
  stockQuantity:   number;
  sku:             string;
  status:          ProductStatus;
  categoryName:    string;        // flat string — summary endpoint does NOT return category object
  primaryImageUrl: string;        // single URL — summary endpoint does NOT return imageUrls array
  merchantId:      string;
  createdAt:       string;
}

interface ProductCardProps {
  product:      ProductSummary;
  onAddToCart?: (product: ProductSummary) => void;
}

const formatPrice = (price: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const {
    name,
    price,
    stockQuantity,
    status,
    primaryImageUrl,
    categoryName,
  } = product;

  const inStock: boolean    = stockQuantity > 0 && status === "ACTIVE";
  const lowStock: boolean   = inStock && stockQuantity < 10;
  const isArchived: boolean = status === "ARCHIVED" || status === "DRAFT";

  return (
    <div className="product-card group">

      {lowStock && status === "ACTIVE" && (
        <span className="product-card-badge">Only {stockQuantity} left</span>
      )}
      {isArchived && (
        <span className="product-card-badge-muted">{status.toLowerCase()}</span>
      )}

      <div className="product-card-image-wrap">
        {primaryImageUrl ? (
          <img
            src={primaryImageUrl}
            alt={name}
            className="product-card-image"
          />
        ) : (
          <span className="product-card-placeholder">🛍️</span>
        )}
      </div>

      <div className="product-card-body">

        {categoryName && (
          <span className="product-card-category">{categoryName}</span>
        )}

        <h3 className="product-card-name">{name}</h3>

        <div className="product-card-price-row">
          <span className="product-card-price">{formatPrice(price)}</span>
          <span className={inStock ? "product-card-stock-in" : "product-card-stock-out"}>
            {inStock ? "In Stock" : "Out of Stock"}
          </span>
        </div>

        {inStock ? (
          <button
            className="product-card-btn-add"
            onClick={() => onAddToCart?.(product)}
          >
            <ShoppingCart size={12} />
            Add to Cart
          </button>
        ) : (
          <button className="product-card-btn-sold" disabled>
            <ShoppingCart size={12} />
            Sold Out
          </button>
        )}

      </div>
    </div>
  );
}
