import CategoryCard from '../cards/CategoryCard';

const categories = [
  { name: 'Electronics',      items: '15K+ Items', imageSrc: '/shopimages/Image (Electronics).png' },
  { name: 'Fashion',          items: '25K+ Items', imageSrc: '/shopimages/Image (Fashion).png' },
  { name: 'Home & Kitchen',   items: '18K+ Items', imageSrc: '/shopimages/Image (Home & Kitchen).png' },
  { name: 'Beauty',           items: '12K+ Items', imageSrc: '/shopimages/Image (Beauty).png' },
  { name: 'Sports & Fitness', items: '9K+ Items',  imageSrc: '/shopimages/Image (Sports & Fitness).png' },
  { name: 'Books & Media',    items: '45K+ Items', imageSrc: '/shopimages/Image (Books & Media).png' },
  { name: 'Toys & Games',     items: '8K+ Items',  imageSrc: '/shopimages/Image (Toys & Games).png' },
  { name: 'Pet Supplies',     items: '5K+ Items',  imageSrc: '/shopimages/Image (Pet Supplies).png' },
  { name: 'Automotive',       items: '11K+ Items', imageSrc: '/shopimages/Image (Automotive).png' },
  { name: 'Garden & Outdoor', items: '7K+ Items',  imageSrc: '/shopimages/Image (Garden & Outdoor).png' },
  { name: 'Office Supplies',  items: '14K+ Items', imageSrc: '/shopimages/Image (Office Supplies).png' },
  { name: 'Baby Products',    items: '6K+ Items',  imageSrc: '/shopimages/Image (Baby Products).png' },
];

export default function ShopByCategorySection() {
  return (
    <section className="w-full py-12 px-[48.06px] max-md:px-4 max-md:py-6">
      <h2 className="[font-family:'Inter',sans-serif] not-italic font-bold text-[36.04px] leading-[43px] text-[#0F172A] max-md:text-[26px] max-md:leading-[32px]">Shop By Category</h2>
      <div className="pt-[38.44px]">
        <div className="grid grid-cols-6 gap-[28.83px] max-lg:grid-cols-3 max-md:gap-4 max-sm:grid-cols-2">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.name}
              name={cat.name}
              items={cat.items}
              imageSrc={cat.imageSrc}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
