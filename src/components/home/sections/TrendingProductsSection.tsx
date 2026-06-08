import Image from 'next/image';
import TrendingProductCard from '../cards/TrendingProductCard';

const trendingProducts = [
  {
    badge: 'Sale',
    image: undefined,
    name: 'Premium Laptop Stand',
    salePrice: '$49.99',
    originalPrice: '$89.99',
    rating: 4.8,
    reviewCount: '(3241)',
    delivery: 'Delivery by Jun 6',
  },
  {
    badge: 'Best Seller',
    image: '/trending/trendingImages/Image (Ergonomic Office Chair).png',
    name: 'Ergonomic Office Chair',
    salePrice: '$299.99',
    originalPrice: '$599.99',
    rating: 4.9,
    reviewCount: '(1876)',
    delivery: 'Delivery by Jun 7',
  },
  {
    badge: 'Trending',
    image: '/trending/trendingImages/Image (Vintage Denim Jacket).png',
    name: 'Vintage Denim Jacket',
    salePrice: '$79.99',
    originalPrice: '$149.99',
    rating: 4.7,
    reviewCount: '(892)',
    delivery: 'Delivery by Jun 6',
  },
  {
    badge: 'Sale',
    image: '/trending/trendingImages/Image (Stainless Steel Cookware).png',
    name: 'Stainless Steel Cookware',
    salePrice: '$159.99',
    originalPrice: '$299.99',
    rating: 4.8,
    reviewCount: '(2341)',
    delivery: 'Delivery by Jun 8',
  },
  {
    badge: 'Popular',
    image: '/trending/trendingImages/Image (Luxury Skincare Set).png',
    name: 'Luxury Skincare Set',
    salePrice: '$129.99',
    originalPrice: '$249.99',
    rating: 4.9,
    reviewCount: '(4523)',
    delivery: 'Delivery by Jun 6',
  },
  {
    badge: 'New',
    image: '/trending/trendingImages/Image (Modern Floor Lamp).png',
    name: 'Modern Floor Lamp',
    salePrice: '$89.99',
    originalPrice: '$179.99',
    rating: 4.6,
    reviewCount: '(567)',
    delivery: 'Delivery by Jun 9',
  },
  {
    badge: 'Best Seller',
    image: undefined,
    name: 'Wireless Earbuds Pro',
    salePrice: '$149.99',
    originalPrice: '$249.99',
    rating: 4.8,
    reviewCount: '(6789)',
    delivery: 'Delivery by Jun 6',
  },
  {
    badge: 'Sale',
    image: undefined,
    name: 'Smart Home Hub',
    salePrice: '$99.99',
    originalPrice: '$199.99',
    rating: 4.7,
    reviewCount: '(3456)',
    delivery: 'Delivery by Jun 7',
  },
  {
    badge: 'Popular',
    image: '/trending/trendingImages/Image (Yoga Mat Premium).png',
    name: 'Yoga Mat Premium',
    salePrice: '$39.99',
    originalPrice: '$79.99',
    rating: 4.8,
    reviewCount: '(2134)',
    delivery: 'Delivery by Jun 6',
  },
  {
    badge: 'Sale',
    image: '/trending/trendingImages/Image (Coffee Maker Deluxe).png',
    name: 'Coffee Maker Deluxe',
    salePrice: '$189.99',
    originalPrice: '$349.99',
    rating: 4.9,
    reviewCount: '(1892)',
    delivery: 'Delivery by Jun 8',
  },
  {
    badge: 'Trending',
    image: '/trending/trendingImages/Image (Designer Sneakers).png',
    name: 'Designer Sneakers',
    salePrice: '$119.99',
    originalPrice: '$249.99',
    rating: 4.7,
    reviewCount: '(4521)',
    delivery: 'Delivery by Jun 7',
  },
  {
    badge: 'New',
    image: '/trending/trendingImages/Image (Portable Blender).png',
    name: 'Portable Blender',
    salePrice: '$44.99',
    originalPrice: '$89.99',
    rating: 4.6,
    reviewCount: '(1234)',
    delivery: 'Delivery by Jun 6',
  },
];

export default function TrendingProductsSection() {
  return (
    <section className="trending-section">
      <div className="trending-container">
        <div className="trending-header">
          <div className="trending-header-left">
            <div className="trending-header-icon">
              <Image
                src="/trending/trendingicons/increase.png"
                alt="Trending icon"
                width={38}
                height={38}
              />
              <div className="trending-header-icon-badge">
                <Image
                  src="/trending/trendingicons/halfsquare.png"
                  alt=""
                  width={14}
                  height={14}
                />
              </div>
            </div>
            <h2 className="trending-heading">Trending Products</h2>
          </div>
          <div className="trending-view-all">
            <span className="trending-view-all-text">View All</span>
            <svg className="trending-view-all-chevron" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <div className="trending-grid">
          {trendingProducts.map((product, index) => (
            <TrendingProductCard key={index} {...product} />
          ))}
        </div>
      </div>
    </section>
  );
}
