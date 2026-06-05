import { Clock } from "lucide-react";
import Container from "./Container";
import Countdown from "./Countdown";
import ProductCard from "./ProductCard";
import { flashDeals } from "./data";

/** Time-limited deals with a live countdown and discounted product grid. */
export default function FlashSale() {
  return (
    <section className="bg-slate-50 py-10">
      <Container>
        <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-orange-50 to-rose-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-500 text-white">
              <Clock width={22} height={22} />
            </span>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Flash Sale
              </h2>
              <p className="text-sm text-slate-500">
                Deals ending soon - Don&apos;t miss out!
              </p>
            </div>
          </div>
          <Countdown hours={12} minutes={33} seconds={4} />
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {flashDeals.map((p) => (
            <ProductCard key={p.name} product={p} variant="flash" />
          ))}
        </div>
      </Container>
    </section>
  );
}
