import Image from 'next/image';

interface BestSellerCardProps {
  rank: string;
  image?: string;
  name: string;
  price: string;
  rating: number;
  reviews: string;
  purchased: string;
}

export default function BestSellerCard({
  rank,
  image,
  name,
  price,
  rating,
  reviews,
  purchased,
}: BestSellerCardProps) {
  return (
    <div className="bestseller-card">
      <div className="bestseller-rank">
        <span className="bestseller-rank-text">{rank}</span>
      </div>

      <div className="bestseller-image-box">
        {image && (
          <Image
            src={image}
            alt={name}
            fill
            style={{ objectFit: 'cover' }}
          />
        )}
      </div>

      <div className="bestseller-info">
        <p className="bestseller-name">{name}</p>
        <p className="bestseller-price">{price}</p>
        <div className="bestseller-rating-row">
          <Image
            src="/flashsale/star.png"
            alt="Star"
            width={19}
            height={19}
          />
          <span className="bestseller-rating-num">{rating}</span>
          <span className="bestseller-review-count">{reviews}</span>
        </div>
        <p className="bestseller-purchased">{purchased}</p>
      </div>
    </div>
  );
}
