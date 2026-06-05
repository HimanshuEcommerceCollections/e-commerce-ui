import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Container from "./Container";
import { promoBanners } from "./data";

/** Pair of large promotional call-to-action banners. */
export default function PromoBanners() {
  return (
    <section className="bg-white py-6">
      <Container>
        <div className="grid gap-6 md:grid-cols-2">
          {promoBanners.map((b) => (
            <div
              key={b.title}
              className={cn(
                "relative flex min-h-[200px] flex-col justify-center overflow-hidden rounded-2xl bg-gradient-to-br p-8 shadow-md",
                b.swatch
              )}
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
              <span className="relative text-xs font-semibold uppercase tracking-wider text-white/70">
                {b.tag}
              </span>
              <h3 className="relative mt-2 text-2xl font-bold text-white sm:text-3xl">
                {b.title}
              </h3>
              <p className="relative mt-1 text-sm text-white/80">{b.subtitle}</p>
              <button className="relative mt-5 flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition-transform hover:scale-105">
                {b.cta}
                <ArrowRight width={16} height={16} />
              </button>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
