import Image from 'next/image';
import SafeImage from '@/components/shared/SafeImage';

interface TrendingProductCardProps {
  badge: string;
  image?: string;
  name: string;
  salePrice: string;
  originalPrice: string;
  rating: number;
  reviewCount: string;
  delivery: string;
}

export default function TrendingProductCard({
  badge,
  image,
  name,
  salePrice,
  originalPrice,
  rating,
  reviewCount,
  delivery,
}: TrendingProductCardProps) {
  return (
    <div className="trend-card">
      <div className="trend-card-image-box">
        <SafeImage src={image} alt={name} fill style={{ objectFit: 'cover' }} />
        <div className="trend-card-badge">
          <span className="trend-card-badge-text">{badge}</span>
        </div>
        <button className="trend-card-wishlist-btn" aria-label="Add to wishlist">
          <Image
            src="/flashsale/wishlist.png"
            alt="Wishlist"
            width={19}
            height={19}
          />
        </button>
      </div>

      <div className="trend-card-body">
        <p className="trend-card-name">{name}</p>

        <div className="trend-card-price-row">
          <span className="trend-card-sale-price">{salePrice}</span>
          <span className="trend-card-original-price">{originalPrice}</span>
        </div>

        <div className="trend-card-rating-row">
          <Image
            src="/flashsale/star.png"
            alt="Star"
            width={19}
            height={19}
          />
          <span className="trend-card-rating-num">{rating}</span>
          <span className="trend-card-review-count">{reviewCount}</span>
        </div>

        <div className="trend-card-delivery-row">
          <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.5 3.5H12.5V13H1.5V3.5Z" stroke="#111827" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M12.5 6.5H15.5L17.5 9.5V13H12.5V6.5Z" stroke="#111827" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="4.5" cy="14.5" r="1.5" stroke="#111827" strokeWidth="1.5" />
            <circle cx="14.5" cy="14.5" r="1.5" stroke="#111827" strokeWidth="1.5" />
          </svg>
          <span className="trend-card-delivery-text">{delivery}</span>
        </div>

        <button className="trend-card-quick-add-btn">
          <span className="trend-card-quick-add-text">Quick Add</span>
        </button>
      </div>
    </div>
  );
}
