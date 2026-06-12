import HeroCategoryCard from '../cards/HeroCategoryCard';

const categories = [
  { label: 'Electronics',    imageSrc: '/heropics/electronics.png' },
  { label: 'Fashion',        imageSrc: '/heropics/fashion.png' },
  { label: 'Home & Kitchen', imageSrc: '/heropics/home-kitchen.png' },
  { label: 'Beauty',         imageSrc: '/heropics/beauty.png' },
];

export default function HeroRight() {
  return (
    <div className="flex flex-1 flex-col gap-[28.83px] max-lg:grid max-lg:w-full max-lg:grid-cols-2 max-lg:gap-4 max-sm:grid-cols-1">
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
