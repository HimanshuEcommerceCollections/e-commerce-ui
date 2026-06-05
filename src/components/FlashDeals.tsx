import Image from "next/image";
import ProductCard, { type ProductCardData } from "@/components/shared/ProductCard";

const products: ProductCardData[] = [
  { badge: "-50% OFF", brand: "Nike",        name: "Air Max 270 Running Shoes",      rating: 5, reviews: "2.1k", price: "$89",  original: "$179", imgGradient: "linear-gradient(300deg, #D4E4F7 100%, #A8C8EF 173.21%)" },
  { badge: "-47% OFF", brand: "Samsung",     name: "Galaxy Buds Pro 2 Wireless",     rating: 5, reviews: "3.4k", price: "$79",  original: "$149", imgGradient: "linear-gradient(295deg, #D4F0E8 100%, #A8DCCB 175.25%)" },
  { badge: "-32% OFF", brand: "Levi's",      name: "501 Original Fit Jeans",         rating: 5, reviews: "890",  price: "$34",  original: "$50",  imgGradient: "linear-gradient(310deg, #F5DADA 100%, #EAB4B4 170.98%)" },
  { badge: "-40% OFF", brand: "Instant Pot", name: "Duo 7-in-1 Electric Pressure",   rating: 5, reviews: "5.6k", price: "$59",  original: "$99",  imgGradient: "linear-gradient(285deg, #FEF3D0 100%, #FCD97A 181.65%)" },
  { badge: "-40% OFF", brand: "Maybelline",  name: "Mascara Set Bundle 3-Pack",      rating: 5, reviews: "1.2k", price: "$18",  original: "$30",  imgGradient: "linear-gradient(305deg, #FCE4F0 100%, #F6B8D8 171.80%)" },
];

const countdown = [
  { val: "02", label: "HRS" },
  { val: "45", label: "MIN" },
  { val: "18", label: "SEC" },
];

export default function FlashDeals() {
  return (
    <section className="flash-deals-section">

      {/* ── Header row ── */}
      <div className="fd-header">
        {/* fd-bolt: 22×22 amber icon */}
        <Image src="/flashicons/fd-bolt.png" alt="" width={22} height={22} />

        {/* fd-h: "Flash Deals" title, 10px gap from bolt */}
        <span className="fd-title">Flash Deals</span>

        {/* Countdown: 47px gap from title end (matches left:268 in Figma) */}
        <div className="countdown-block">
          {countdown.map((d, i) => (
            <div key={d.label} style={{ display: "flex", alignItems: "center" }}>
              {i > 0 && <span className="countdown-sep">:</span>}
              <div className="countdown-digit">
                <span className="countdown-val">{d.val}</span>
              </div>
            </div>
          ))}
        </div>

        {/* fd-va: "View all →" pushed to right */}
        <a className="fd-view-all">View all →</a>
      </div>

      {/* fd-rule: 1px divider */}
      <div className="fd-rule" />

      {/* 5-column cards grid */}
      <div className="fd-grid">
        {products.map((p) => (
          <ProductCard key={p.name} {...p} variant="flash" />
        ))}
      </div>

    </section>
  );
}
