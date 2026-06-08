import Image from 'next/image';

interface FlashSaleCardProps {
  name: string;
  price: string;
  originalPrice: string;
  discount: string;
  rating: string;
  reviews: string;
  stockLeft: number;
  stockPercent: number;
  imageSrc: string;
}

export default function FlashSaleCard({
  name, price, originalPrice, discount,
  rating, reviews, stockLeft, stockPercent, imageSrc,
}: FlashSaleCardProps) {
  return (
    <div className="flash-card">

      {/* Image */}
      <div className="flash-card-image-wrap">
        <Image src={imageSrc} alt={name} fill style={{ objectFit: 'cover' }} />
        <span className="flash-card-discount-badge">{discount}</span>
        <button className="flash-card-wishlist-btn" aria-label="Add to wishlist">
          <Image src="/flashsale/wishlist.png" width={19} height={19} alt="wishlist" />
        </button>
      </div>

      {/* Body */}
      <div className="flash-card-body">

        <span className="flash-card-name">{name}</span>

        <div className="flash-card-price-row">
          <span className="flash-card-price">{price}</span>
          <span className="flash-card-original-price">{originalPrice}</span>
        </div>

        <div className="flash-card-rating-row">
          <div className="flash-card-star-group">
            <Image src="/flashsale/star.png" width={19} height={19} alt="star" />
            <span className="flash-card-rating-num">{rating}</span>
          </div>
          <span className="flash-card-reviews">({reviews})</span>
        </div>

        <div className="flash-card-stock-section">
          <div className="flash-card-stock-row">
            <span className="flash-card-stock-left">Only {stockLeft} left</span>
            <span className="flash-card-stock-pct">{stockPercent}%</span>
          </div>
          <div className="flash-card-progress-track">
            <div
              className="flash-card-progress-fill"
              style={{ width: `${stockPercent}%` }}
            />
          </div>
        </div>

        <button className="flash-card-add-btn">Add to Cart</button>

      </div>
    </div>
  );
}
