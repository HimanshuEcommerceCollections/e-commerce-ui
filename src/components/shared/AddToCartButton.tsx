import { cn } from "@/lib/utils";

type AddToCartButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label?: string;
  /** "md" = homepage flash-card size (default); "sm" = compact (small cards). */
  size?: "sm" | "md";
};

// Full literal class names — Tailwind tree-shakes @layer component classes by
// scanning source for complete strings, so don't build them dynamically.
const SIZE_CLASS: Record<NonNullable<AddToCartButtonProps["size"]>, string> = {
  sm: "add-to-cart-btn add-to-cart-btn--sm",
  md: "add-to-cart-btn",
};

/** Canonical ShopHub "Add to Cart" button (blue pill). Use everywhere. */
export default function AddToCartButton({
  label = "Add to Cart",
  size = "md",
  className,
  type = "button",
  ...props
}: AddToCartButtonProps) {
  return (
    <button type={type} className={cn(SIZE_CLASS[size], className)} {...props}>
      {label}
    </button>
  );
}
