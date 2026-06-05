import { Heart, Package, ShoppingCart, Zap, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import StarRating from "./StarRating";
import type { Product } from "./data";

const BADGE_COLORS: Record<string, string> = {
  Sale: "bg-red-500",
  "Best Seller": "bg-blue-600",
  Trending: "bg-violet-600",
  Popular: "bg-amber-500",
  New: "bg-emerald-500",
};

export type ProductCardVariant = "flash" | "trending" | "recommended";

/** Product tile used across Flash Sale, Trending, and Recommended sections. */
export default function ProductCard({
  product,
  variant = "trending",
}: {
  product: Product;
  variant?: ProductCardVariant;
}) {
  const { name, price, original, rating, reviews, badge, swatch, stock, sold, delivery } =
    product;

  const discountBadge = variant === "flash";
  const badgeClass = discountBadge
    ? "bg-orange-500"
    : BADGE_COLORS[badge ?? ""] ?? "bg-slate-700";

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Image placeholder */}
      <div className={cn("relative aspect-square bg-gradient-to-br", swatch)}>
        <div className="absolute inset-0 flex items-center justify-center">
          <Package className="h-12 w-12 text-white/40" strokeWidth={1.5} />
        </div>

        {badge && (
          <span
            className={cn(
              "absolute left-2 top-2 rounded-md px-2 py-0.5 text-[11px] font-bold text-white",
              badgeClass
            )}
          >
            {badge}
          </span>
        )}

        <button
          aria-label="Add to wishlist"
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm transition-colors hover:text-rose-500"
        >
          <Heart width={16} height={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-1 text-sm font-semibold text-slate-900">{name}</h3>

        <div className="mt-1.5">
          <StarRating rating={rating} reviews={reviews} />
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-slate-900">${price.toFixed(2)}</span>
          {original && (
            <span className="text-sm text-slate-400 line-through">
              ${original.toFixed(2)}
            </span>
          )}
        </div>

        {/* Flash-sale stock bar */}
        {variant === "flash" && stock !== undefined && (
          <div className="mt-2">
            <div className="mb-1 flex justify-between text-[11px] font-medium text-slate-500">
              <span>Only {stock} left</span>
              <span>{sold}% sold</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500"
                style={{ width: `${Math.min(sold ?? 0, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Trending delivery line */}
        {variant === "trending" && delivery && (
          <p className="mt-2 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
            <Truck width={13} height={13} />
            Delivery by {delivery}
          </p>
        )}

        {/* CTA */}
        {variant !== "recommended" && (
          <button className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-blue-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
            {variant === "flash" ? (
              <>
                <ShoppingCart width={15} height={15} />
                Add to Cart
              </>
            ) : (
              <>
                <Zap width={15} height={15} />
                Quick Add
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
