import Image from 'next/image';

interface CategoryCardProps {
  name: string;
  items: string;
  imageSrc: string;
}

export default function CategoryCard({ name, items, imageSrc }: CategoryCardProps) {
  return (
    <div className="cat-card">
      <div className="cat-card-image-box">
        <Image
          src={imageSrc}
          alt={name}
          fill
          style={{ objectFit: 'cover' }}
        />
      </div>
      <div className="cat-card-text-area">
        <span className="cat-card-name">{name}</span>
        <span className="cat-card-count">{items}</span>
      </div>
    </div>
  );
}
