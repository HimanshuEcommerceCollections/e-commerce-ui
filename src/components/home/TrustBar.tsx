import { Truck, Shield, RotateCcw, Headphones, MapPin } from "lucide-react";
import Container from "./Container";

const items = [
  { icon: Truck, title: "Fast Shipping", sub: "Free on orders $50+" },
  { icon: Shield, title: "Secure Payments", sub: "100% protected" },
  { icon: RotateCcw, title: "Easy Returns", sub: "30-day guarantee" },
  { icon: Headphones, title: "24/7 Support", sub: "Always here to help" },
  { icon: MapPin, title: "US Customer Service", sub: "Based in America" },
];

/** Reassurance strip with shipping / payment / support guarantees. */
export default function TrustBar() {
  return (
    <section className="border-y border-slate-200 bg-white py-8">
      <Container>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {items.map(({ icon: Icon, title, sub }) => (
            <div key={title} className="flex flex-col items-center text-center">
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Icon width={22} height={22} />
              </span>
              <p className="text-sm font-bold text-slate-900">{title}</p>
              <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
