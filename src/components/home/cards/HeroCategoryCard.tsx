import Image from 'next/image';

interface HeroCategoryCardProps {
  label: string;
  imageSrc: string;
}

export default function HeroCategoryCard({ label, imageSrc }: HeroCategoryCardProps) {
  return (
    <div className="hero-cat-card">
      <Image
        src={imageSrc}
        alt={label}
        fill
        style={{ objectFit: 'cover' }}
        priority
      />
      <div className="hero-cat-overlay">
        <span className="hero-cat-label">{label}</span>
      </div>
    </div>
  );
}
