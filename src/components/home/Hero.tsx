import { ArrowRight, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import Container from "./Container";
import { heroCategories } from "./data";

/** Hero: large promotional banner alongside a column of category cards. */
export default function Hero() {
  return (
    <section className="bg-slate-50 py-6">
      <Container>
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Main banner */}
          <div className="relative flex min-h-[420px] flex-col justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-900 p-8 shadow-lg lg:col-span-2 lg:min-h-[560px] lg:p-12">
            {/* Decorative glow */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 right-10 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
            <ShoppingBag
              className="pointer-events-none absolute right-8 top-1/2 hidden h-72 w-72 -translate-y-1/2 text-white/5 lg:block"
              strokeWidth={1}
            />

            <div className="relative max-w-xl">
              <span className="inline-flex items-center rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-300">
                Summer Savings Event
              </span>
              <h1 className="mt-5 text-5xl font-extrabold leading-none tracking-tight text-white sm:text-6xl lg:text-7xl">
                Up To 70% Off
              </h1>
              <p className="mt-5 text-lg text-slate-300">
                Thousands of products on sale. Limited time only.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-colors hover:bg-blue-700">
                  Shop Deals
                  <ArrowRight width={17} height={17} />
                </button>
                <button className="rounded-xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20">
                  Browse Categories
                </button>
              </div>
            </div>
          </div>

          {/* Category cards */}
          <div className="grid grid-cols-2 gap-4 lg:h-full lg:grid-cols-1 lg:grid-rows-4">
            {heroCategories.map((cat) => (
              <a
                key={cat.name}
                href="#"
                className={cn(
                  "group relative flex min-h-[120px] items-end overflow-hidden rounded-2xl bg-gradient-to-br p-5 shadow-md lg:flex-1",
                  cat.swatch
                )}
              >
                <div className="pointer-events-none absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/0" />
                <span className="relative text-lg font-bold text-white drop-shadow">
                  {cat.name}
                </span>
              </a>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
