import { TrendingUp } from "lucide-react";
import Container from "./Container";
import SectionHeading from "./SectionHeading";
import ProductCard from "./ProductCard";
import { trendingProducts } from "./data";

/** Curated trending products grid. */
export default function TrendingProducts() {
  return (
    <section className="bg-slate-50 py-12">
      <Container>
        <SectionHeading
          title="Trending Products"
          icon={
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <TrendingUp width={20} height={20} />
            </span>
          }
        />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {trendingProducts.map((p) => (
            <ProductCard key={p.name} product={p} variant="trending" />
          ))}
        </div>
      </Container>
    </section>
  );
}
