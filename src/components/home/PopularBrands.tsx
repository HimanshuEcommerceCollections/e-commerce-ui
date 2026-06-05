import Container from "./Container";
import SectionHeading from "./SectionHeading";
import { brands } from "./data";

/** Wordmark grid of featured brands. */
export default function PopularBrands() {
  return (
    <section className="bg-slate-50 py-12">
      <Container>
        <SectionHeading title="Popular Brands" action={null} />
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {brands.map((brand) => (
            <a
              key={brand}
              href="#"
              className="flex h-20 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-lg font-bold text-slate-700 shadow-sm transition-all hover:border-blue-200 hover:text-blue-600 hover:shadow-md"
            >
              {brand}
            </a>
          ))}
        </div>
      </Container>
    </section>
  );
}
