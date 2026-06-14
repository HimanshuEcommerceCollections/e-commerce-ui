import { cn } from "@/lib/utils";

type AddToCartButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label?: string;
  /** "md" = homepage flash sale card size (default); "sm" = compact (small cards). */
  size?: "sm" | "md";
};

/** Canonical ShopHub "Add to Cart" button (blue pill) — shared base styles. */
const BASE_CLASS =
  "flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border-none bg-[#2563EB] [font-family:'Inter',sans-serif] font-semibold text-white transition-[background-color] duration-150 [transition-timing-function:ease] hover:bg-[#1D4ED8]";

// Full literal class names — Tailwind scans source for complete strings,
// so don't build them dynamically.
const SIZE_CLASS: Record<NonNullable<AddToCartButtonProps["size"]>, string> = {
  sm: "py-[6px] px-3 text-[12px] leading-[18px]",
  md: "py-[9.6px] px-4 text-[16.82px] leading-6",
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
    <button type={type} className={cn(BASE_CLASS, SIZE_CLASS[size], className)} {...props}>
      {label}
    </button>
  );
}
