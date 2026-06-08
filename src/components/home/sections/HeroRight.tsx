import HeroCategoryCard from '../cards/HeroCategoryCard';

const categories = [
  { label: 'Electronics',    imageSrc: '/heropics/electronics.png' },
  { label: 'Fashion',        imageSrc: '/heropics/fashion.png' },
  { label: 'Home & Kitchen', imageSrc: '/heropics/home-kitchen.png' },
  { label: 'Beauty',         imageSrc: '/heropics/beauty.png' },
];

export default function HeroRight() {
  return (
    <div className="hero-right">
      {categories.map((cat) => (
        <HeroCategoryCard
          key={cat.label}
          label={cat.label}
          imageSrc={cat.imageSrc}
        />
      ))}
    </div>
  );
}
