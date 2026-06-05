import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Container from "./Container";
import SectionHeading from "./SectionHeading";
import { rooms } from "./data";

/** Lifestyle entry points organised by room. */
export default function ShopByRoom() {
  return (
    <section className="bg-white py-12">
      <Container>
        <SectionHeading title="Shop By Room" action={null} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <a
              key={room.name}
              href="#"
              className={cn(
                "group relative flex min-h-[200px] flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-br p-6 shadow-md",
                room.swatch
              )}
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="relative">
                <h3 className="text-xl font-bold text-white">{room.name}</h3>
                <p className="mt-1 text-sm text-white/80">{room.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-white">
                  Shop This Room
                  <ArrowRight
                    width={16}
                    height={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </span>
              </div>
            </a>
          ))}
        </div>
      </Container>
    </section>
  );
}
