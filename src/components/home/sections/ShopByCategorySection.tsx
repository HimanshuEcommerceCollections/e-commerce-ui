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
    <section className="shop-cat-section">
      <h2 className="shop-cat-title">Shop By Category</h2>
      <div className="shop-cat-grid-wrapper">
        <div className="shop-cat-grid">
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
