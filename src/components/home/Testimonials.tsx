import { Star, Quote, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import Container from "./Container";
import { testimonials, testimonialStats } from "./data";

/** Customer reviews and headline trust statistics. */
export default function Testimonials() {
  return (
    <section className="bg-slate-50 py-14">
      <Container>
        <h2 className="mb-8 text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          What Our Customers Say
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <Quote className="h-8 w-8 text-blue-100" fill="currentColor" />
              <div className="mt-3 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} width={16} height={16} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br text-base font-bold text-white",
                    t.swatch
                  )}
                >
                  {t.initial}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                  <p className="flex items-center gap-1 text-xs text-emerald-600">
                    <BadgeCheck width={13} height={13} />
                    Verified Purchase
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-3 gap-6 border-t border-slate-200 pt-10">
          {testimonialStats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-extrabold text-blue-600 sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
