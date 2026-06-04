import Image from "next/image";
import SideBannerCard from "@/components/shared/SideBannerCard";

const sideBanners = [
  {
    title: "Electronics",
    subtitle: "Top deals on gadgets",
    btnLabel: "Shop Now",
    gradient: "linear-gradient(90deg, #0C1445 0%, #1E3A8A 100%)",
    imgGradient: "linear-gradient(280deg, #1A1A2E 100%, #16213E 186%)",
  },
  {
    title: "Fashion Week",
    subtitle: "New arrivals daily",
    btnLabel: "Shop Now",
    gradient: "linear-gradient(90deg, #052E16 0%, #166534 100%)",
    imgGradient: "linear-gradient(305deg, #F8E8E8 100%, #F0C8C8 172%)",
  },
  {
    title: "Home & Living",
    subtitle: "Starting at $29",
    btnLabel: "Shop Now",
    gradient: "linear-gradient(90deg, #1C1917 0%, #44403C 100%)",
    imgGradient: "linear-gradient(295deg, #FFF8E7 100%, #FDE8AA 175%)",
  },
];

export default function HeroSection() {
  return (
    <section className="hero-section">

      {/* ── Main Banner (836 × 328) ── */}
      <div className="hero-main-banner">

        {/* mb-tag: left 40, top 32 */}
        <span className="hero-tag">SUMMER SALE 2024</span>

        {/* mb-h: left 40, top 56, 40px/48px, letter-spacing -1.5px */}
        <h1 className="hero-headline">
          Up to 70% off
          <br />
          on top brands
        </h1>

        {/* mb-s: left 40, top 160 */}
        <p className="hero-subtext">
          Free shipping on all orders above $35.
          <br />
          Limited time — ends Sunday midnight.
        </p>

        {/* mb-cta: 164 × 44, left 40, top 214 */}
        <button className="hero-cta-primary">Shop Now →</button>

        {/* mb-ex: 136 × 44, left 216, top 214 */}
        <button className="hero-cta-secondary">Today&apos;s Deals</button>

        {/* img-hero: 348 × 292 at left 468, top 16 */}
        <div className="hero-product-img">
          <Image
            src="/herosectionicon/img-hero.png"
            alt="Hero product"
            fill
            style={{ objectFit: "cover" }}
            priority
          />
        </div>

        {/* glass-deal: 348 × 80 at left 468, top 220 — overlays the lower portion of img-hero */}
        <div className="hero-glass-deal">

          {/* gfire: bolt-nav.png 16 × 16 at left 12, top 12 */}
          <Image
            src="/herosectionicon/bolt-nav.png"
            alt=""
            width={16}
            height={16}
            style={{ position: "absolute", left: 12, top: 12 }}
          />

          {/* gc-t: left 34, top 10 — starts after bolt icon (12 + 16 + 6 gap) */}
          <p className="hero-glass-title">Flash Deal — Ends in 01:42:18</p>

          {/* gc-n: left 12, top 26 */}
          <p className="hero-glass-product">Apple MacBook Air M2</p>

          {/* gc-p: left 12, top 48 */}
          <span className="hero-glass-price">$89</span>

          {/* gc-o: left 58, top 52 */}
          <span className="hero-glass-original">$179</span>

          {/* gc-btn: 100 × 26 at left 230, top 46 */}
          <button className="hero-glass-btn">Add to Cart</button>
        </div>

      </div>

      {/* ── Side Banners column — flex:1 fills the remaining width after the 836px banner ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
        {sideBanners.map((b) => (
          <SideBannerCard key={b.title} {...b} />
        ))}
      </div>

    </section>
  );
}
