"use client";
import { useState } from "react";
import SectionHeader from "@/components/shared/SectionHeader";
import ProductCard, { type ProductCardData } from "@/components/shared/ProductCard";

const tabs = ["All", "Fashion", "Electronics", "Home", "Beauty", "Sports"];

const products: ProductCardData[] = [
  {
    badge: "-48% OFF",
    brand: "Levi's",
    name: "501 Original Fit Jeans Men's",
    rating: 5,
    reviews: "3.2k",
    price: "$49",
    original: "$94",
    imgGradient: "linear-gradient(300deg, #E0D7F8 100%, #C4B3F0 173%)",
    shipping: "Free — Get it by Thu Jun 5",
    variant: "trending",
  },
  {
    badge: "-36% OFF",
    brand: "Apple",
    name: "AirPods 3rd Generation",
    rating: 5,
    reviews: "8.9k",
    price: "$149",
    original: "$234",
    imgGradient: "linear-gradient(295deg, #C8E8D8 100%, #90CDB0 175%)",
    shipping: "Free — Get it by Tomorrow",
    variant: "trending",
  },
  {
    badge: "-38% OFF",
    brand: "Quay",
    name: "V/O Sunglasses UV400",
    rating: 5,
    reviews: "1.4k",
    price: "$249",
    original: "$401",
    imgGradient: "linear-gradient(290deg, #FFF0D8 100%, #FFCF88 178%)",
    shipping: "Free — Get it by Thu Jun 5",
    variant: "trending",
  },
  {
    badge: "-37% OFF",
    brand: "Zen",
    name: "Zara Floral Dress Summer",
    rating: 5,
    reviews: "670",
    price: "$39",
    original: "$62",
    imgGradient: "linear-gradient(305deg, #DCE8FF 100%, #A8C4F0 172%)",
    shipping: "Free — Get it by Jun 6",
    variant: "trending",
  },
  {
    badge: "-37% OFF",
    brand: "Lodge",
    name: "Cast Iron Skillet 12 Inch",
    rating: 5,
    reviews: "4.1k",
    price: "$29",
    original: "$46",
    imgGradient: "linear-gradient(295deg, #E8F8E8 100%, #B8E8B8 175%)",
    shipping: "Free — Get it by Tomorrow",
    variant: "trending",
  },
];

export default function TrendingNow() {
  const [activeTab, setActiveTab] = useState("All");

  return (
    <section className="trending-section">
      <SectionHeader
        icon={<span style={{ fontSize: 14 }}>🔥</span>}
        iconBg="#2563EB"
        title="Trending Right Now"
      />
      <p style={{ fontSize: 13, color: "#475569", marginBottom: 12 }}>
        What America is buying this week
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`trending-tab ${activeTab === tab ? "trending-tab-active" : "trending-tab-inactive"}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 243px)", gap: 16 }}>
        {products.map((p) => (
          <ProductCard key={p.name} {...p} variant="trending" />
        ))}
      </div>
    </section>
  );
}
