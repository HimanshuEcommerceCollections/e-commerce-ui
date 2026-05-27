"use client";
import { ShoppingCart, Star } from "lucide-react";

type ProductStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";

interface ProductCategory {
  id?: string;
  name: string;
  slug?: string;
  description?: string;
}

interface Product {
  id?: string;
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  sku?: string;
  status: ProductStatus;
  imageUrls?: string[];
  category?: ProductCategory;
  merchantId?: string;
  createdAt?: string;
  updatedAt?: string;
  deleted?: boolean;
  rating?: number | null;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

const formatPrice = (price: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);

function StarRating({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={11}
          className={
            i < rounded
              ? "fill-yellow-400 text-yellow-400"
              : "fill-transparent text-gray-600"
          }
        />
      ))}
    </div>
  );
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const {
    name,
    price,
    description,
    stockQuantity,
    status,
    imageUrls = [],
    category,
    rating,
  } = product;

  const displayImage: string | undefined = imageUrls?.[0];
  const inStock: boolean  = stockQuantity > 0 && status === "ACTIVE";
  const lowStock: boolean = inStock && stockQuantity < 10;
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
        {displayImage ? (
          <img
            src={displayImage}
            alt={name}
            className="product-card-image"
          />
        ) : (
          <span className="product-card-placeholder">🛍️</span>
        )}
      </div>

      <div className="product-card-body">

        {category?.name && (
          <span className="product-card-category">{category.name}</span>
        )}

        <h3 className="product-card-name">{name}</h3>

        {description && (
          <p className="product-card-description">{description}</p>
        )}

        {rating !== null && rating !== undefined && (
          <div className="product-card-rating">
            <StarRating rating={rating} />
            <span className="product-card-rating-value">
              {rating.toFixed(1)}
            </span>
          </div>
        )}

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