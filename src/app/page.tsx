import HeroSection from "@/components/shared/HeroSection";
import ProductCard from "@/components/shared/ProductCard";
import type { ProductSummary } from "@/components/shared/ProductCard";

const SAMPLE_PRODUCTS: ProductSummary[] = [
  { id: "1", name: "boAt Rockerz 450 Bluetooth Headphone", price: 1299,  stockQuantity: 24, status: "ACTIVE", sku: "BOAT-ROCKERZ-450",   primaryImageUrl: "", categoryName: "Electronics", merchantId: "m-1", createdAt: "2024-01-01T00:00:00Z" },
  { id: "2", name: "Levi's Men's 511 Slim Fit Jeans",       price: 2499,  stockQuantity: 8,  status: "ACTIVE", sku: "LEVIS-511-SLIM",    primaryImageUrl: "", categoryName: "Fashion",     merchantId: "m-2", createdAt: "2024-01-01T00:00:00Z" },
  { id: "3", name: "Prestige Iris 750W Mixer Grinder",      price: 2195,  stockQuantity: 0,  status: "ACTIVE", sku: "PRES-IRIS-750W",   primaryImageUrl: "", categoryName: "Kitchen",     merchantId: "m-3", createdAt: "2024-01-01T00:00:00Z" },
  { id: "4", name: "Redmi 13C 5G Midnight Black",           price: 11999, stockQuantity: 15, status: "ACTIVE", sku: "REDMI-13C-5G-BLK", primaryImageUrl: "", categoryName: "Mobiles",     merchantId: "m-4", createdAt: "2024-01-01T00:00:00Z" },
  { id: "5", name: "Mamaearth Vitamin C Face Wash",         price: 299,   stockQuantity: 3,  status: "ACTIVE", sku: "MAMA-VITC-FW",     primaryImageUrl: "", categoryName: "Beauty",      merchantId: "m-5", createdAt: "2024-01-01T00:00:00Z" },
  { id: "6", name: "Adidas Running Shoes Ultraboost",       price: 7999,  stockQuantity: 12, status: "ACTIVE", sku: "ADIDAS-UB-RUN",    primaryImageUrl: "", categoryName: "Sports",      merchantId: "m-6", createdAt: "2024-01-01T00:00:00Z" },
  { id: "7", name: "Sony WH-1000XM5 Headphones",           price: 24990, stockQuantity: 6,  status: "ACTIVE", sku: "SONY-WH1000XM5",   primaryImageUrl: "", categoryName: "Electronics", merchantId: "m-7", createdAt: "2024-01-01T00:00:00Z" },
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
