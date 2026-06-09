import Image from 'next/image';

interface RecommendedCardProps {
  image?: string;
  name: string;
  price: string;
  rating: number;
  reviews: string;
}

export default function RecommendedCard({
  image,
  name,
  price,
  rating,
  reviews,
}: RecommendedCardProps) {
  return (
    <div className="recom-card">
      <div className="recom-card-image-box">
        {image && (
          <Image
            src={image}
            alt={name}
            fill
            style={{ objectFit: 'cover' }}
          />
        )}
      </div>
      <div className="recom-card-body">
        <p className="recom-card-name">{name}</p>
        <p className="recom-card-price">{price}</p>
        <div className="recom-card-rating-row">
          <Image
            src="/flashsale/star.png"
            alt="Star"
            width={19}
            height={19}
          />
          <span className="recom-card-rating-num">{rating}</span>
          <span className="recom-card-review-count">{reviews}</span>
        </div>
      </div>
    </div>
  );
}
