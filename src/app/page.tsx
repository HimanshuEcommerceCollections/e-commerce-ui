import HeroSection from "@/components/shared/HeroSection";
import ProductCard from "@/components/shared/ProductCard";

type ProductStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";

interface Product {
  id?: string;
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  sku?: string;
  status: ProductStatus;
  imageUrls?: string[];
  category?: { name: string };
  rating?: number | null;
}

const SAMPLE_PRODUCTS: Product[] = [
  { name: "boAt Rockerz 450 Bluetooth Headphone", price: 1299,  description: "Over-ear wireless headphone with 15hr playtime", stockQuantity: 24, status: "ACTIVE", imageUrls: [], category: { name: "Electronics" }, rating: 4.2 },
  { name: "Levi's Men's 511 Slim Fit Jeans",       price: 2499,  description: "Classic slim-cut stretch denim",                stockQuantity: 8,  status: "ACTIVE", imageUrls: [], category: { name: "Fashion" },     rating: 4.5 },
  { name: "Prestige Iris 750W Mixer Grinder",      price: 2195,  description: "3 jars, 3 speed control with incher & pulse",   stockQuantity: 0,  status: "ACTIVE", imageUrls: [], category: { name: "Kitchen" },     rating: 4.0 },
  { name: "Redmi 13C 5G Midnight Black",           price: 11999, description: "Snapdragon 4 Gen 2, 50MP camera, 5000mAh",     stockQuantity: 15, status: "ACTIVE", imageUrls: [], category: { name: "Mobiles" },     rating: 4.3 },
  { name: "Mamaearth Vitamin C Face Wash",         price: 299,   description: "With turmeric for natural skin illumination",   stockQuantity: 3,  status: "ACTIVE", imageUrls: [], category: { name: "Beauty" },      rating: 3.9 },
  { name: "Adidas Running Shoes Ultraboost",       price: 7999,  description: "Responsive cushioning for long distance runs",  stockQuantity: 12, status: "ACTIVE", imageUrls: [], category: { name: "Sports" },      rating: 4.7 },
  { name: "Sony WH-1000XM5 Headphones",           price: 24990, description: "Industry-leading noise cancellation",           stockQuantity: 6,  status: "ACTIVE", imageUrls: [], category: { name: "Electronics" }, rating: 4.8 },
];

export default function Home() {
  return (
    <main>
      <HeroSection />

      <section className="page-section">
        <div className="section-header">
          <h2 className="section-title">
            Featured <span className="section-title-accent">Products</span>
          </h2>
          <button className="section-see-all">See all →</button>
        </div>

        <div className="horizontal-scroll scrollbar-hide">
          {SAMPLE_PRODUCTS.map((p, i) => (
            <ProductCard key={i} product={p} />
          ))}
        </div>
      </section>
    </main>
  );
}