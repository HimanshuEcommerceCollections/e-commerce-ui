import { cn } from "@/lib/utils";
import Container from "./Container";
import SectionHeading from "./SectionHeading";
import { categories } from "./data";

/** Grid of shoppable product categories with item counts. */
export default function ShopByCategory() {
  return (
    <section className="bg-white py-12">
      <Container>
        <SectionHeading title="Shop By Category" action={null} />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((cat) => (
            <a
              key={cat.name}
              href="#"
              className="group flex flex-col items-center rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm transition-shadow hover:shadow-md"
            >
              <span
                className={cn(
                  "mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br text-lg font-bold text-white shadow-sm transition-transform group-hover:scale-105",
                  cat.swatch
                )}
              >
                {cat.name.charAt(0)}
              </span>
              <p className="text-sm font-semibold text-slate-900">{cat.name}</p>
              <p className="mt-0.5 text-xs font-medium text-blue-600">{cat.items}</p>
            </a>
          ))}
        </div>
      </Container>
    </section>
  );
}
