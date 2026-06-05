import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Five-star row with an amber fill rounded to the nearest whole star. */
export default function StarRating({
  rating,
  reviews,
  size = 12,
  className,
}: {
  rating: number;
  reviews?: number;
  size?: number;
  className?: string;
}) {
  const filled = Math.round(rating);
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            width={size}
            height={size}
            className={
              i < filled
                ? "fill-amber-400 text-amber-400"
                : "fill-slate-200 text-slate-200"
            }
          />
        ))}
      </div>
      <span className="text-[11px] font-medium text-slate-700">{rating}</span>
      {reviews !== undefined && (
        <span className="text-[11px] text-slate-400">
          ({reviews.toLocaleString()})
        </span>
      )}
    </div>
  );
}
