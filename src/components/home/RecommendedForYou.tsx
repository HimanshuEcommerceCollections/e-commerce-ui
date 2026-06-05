import { Sparkles, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import Container from "./Container";
import SectionHeading from "./SectionHeading";
import StarRating from "./StarRating";
import { recommended } from "./data";

/** Personalised product suggestions. */
export default function RecommendedForYou() {
  return (
    <section className="bg-white py-12">
      <Container>
        <SectionHeading
          title="Recommended For You"
          subtitle="Based on your browsing history"
          action={null}
          icon={
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Sparkles width={20} height={20} />
            </span>
          }
        />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {recommended.map((p) => (
            <a
              key={p.name}
              href="#"
              className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className={cn("relative aspect-square bg-gradient-to-br", p.swatch)}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Package className="h-12 w-12 text-white/40" strokeWidth={1.5} />
                </div>
              </div>
              <div className="p-3">
                <h3 className="line-clamp-1 text-sm font-semibold text-slate-900">{p.name}</h3>
                <div className="mt-1.5">
                  <StarRating rating={p.rating} reviews={p.reviews} />
                </div>
                <span className="mt-2 block text-lg font-bold text-slate-900">
                  ${p.price.toFixed(2)}
                </span>
              </div>
            </a>
          ))}
        </div>
      </Container>
    </section>
  );
}
