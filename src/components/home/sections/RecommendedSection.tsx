import RecommendedCard from '../cards/RecommendedCard';

const recommendedProducts = [
  {
    image: '/recommendedimages/Image (Premium Laptop Stand).png',
    name: 'Premium Laptop Stand',
    price: '$49.99',
    rating: 4.8,
    reviews: '(3241)',
  },
  {
    image: '/recommendedimages/Image (Ergonomic Office Chair).png',
    name: 'Ergonomic Office Chair',
    price: '$299.99',
    rating: 4.9,
    reviews: '(1876)',
  },
  {
    image: '/recommendedimages/Image (Vintage Denim Jacket).png',
    name: 'Vintage Denim Jacket',
    price: '$79.99',
    rating: 4.7,
    reviews: '(892)',
  },
  {
    image: '/recommendedimages/Image (Stainless Steel Cookware).png',
    name: 'Stainless Steel Cookware',
    price: '$159.99',
    rating: 4.8,
    reviews: '(2341)',
  },
  {
    image: '/recommendedimages/Image (Luxury Skincare Set).png',
    name: 'Luxury Skincare Set',
    price: '$129.99',
    rating: 4.9,
    reviews: '(4523)',
  },
  {
    image: '/recommendedimages/Image (Modern Floor Lamp).png',
    name: 'Modern Floor Lamp',
    price: '$89.99',
    rating: 4.6,
    reviews: '(567)',
  },
  {
    image: '/recommendedimages/Image (Wireless Earbuds Pro).png',
    name: 'Wireless Earbuds Pro',
    price: '$149.99',
    rating: 4.8,
    reviews: '(6789)',
  },
  {
    image: undefined,
    name: 'Smart Home Hub',
    price: '$99.99',
    rating: 4.7,
    reviews: '(3456)',
  },
];

export default function RecommendedSection() {
  return (
    <section className="recom-section">
      <div className="recom-container">
        <h2 className="recom-heading">Recommended For You</h2>
        <p className="recom-subtext">Based on your browsing history</p>
        <div className="recom-grid">
          {recommendedProducts.map((product, index) => (
            <RecommendedCard key={index} {...product} />
          ))}
        </div>
      </div>
    </section>
  );
}
