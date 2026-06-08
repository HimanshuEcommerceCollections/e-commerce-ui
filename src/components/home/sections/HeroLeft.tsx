import Image from 'next/image';

export default function HeroLeft() {
  return (
    <div className="hero-left">
      <Image
        src="/heropics/summer-sale.png"
        alt="Summer Sale"
        fill
        style={{ objectFit: 'cover' }}
        priority
      />
      <div className="hero-left-overlay">
        <div className="hero-glass-card">
          <span className="hero-eyebrow">SUMMER SAVINGS EVENT</span>
          <h1 className="hero-heading">Up To 70% Off</h1>
          <p className="hero-subtext">Thousands of products on sale. Limited time only.</p>
          <div className="hero-btn-row">
            <button className="hero-btn-primary">Shop Deals</button>
            <button className="hero-btn-secondary">Browse Categories</button>
          </div>
        </div>
      </div>
    </div>
  );
}
