import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import Container from "./Container";
import SectionHeading from "./SectionHeading";
import StarRating from "./StarRating";
import { bestSellers } from "./data";

/** Ranked best-selling products with monthly purchase counts. */
export default function BestSellers() {
  return (
    <section className="bg-slate-50 py-12">
      <Container>
        <SectionHeading title="Best Sellers" action={null} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bestSellers.map((p) => (
            <div
              key={p.rank}
              className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Thumbnail with rank */}
              <div className={cn("relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br", p.swatch)}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Package className="h-8 w-8 text-white/40" strokeWidth={1.5} />
                </div>
                <span className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  {p.rank}
                </span>
              </div>

              {/* Details */}
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-1 text-sm font-semibold text-slate-900">{p.name}</h3>
                <div className="mt-1">
                  <StarRating rating={p.rating} reviews={p.reviews} />
                </div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="text-base font-bold text-slate-900">${p.price.toFixed(2)}</span>
                </div>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {p.purchased} purchased this month
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
