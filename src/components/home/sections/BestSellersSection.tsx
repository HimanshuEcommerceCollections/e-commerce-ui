import BestSellerCard from '../cards/BestSellerCard';

const bestSellers = [
  {
    rank: '#1',
    image: undefined,
    name: 'Ultra HD Smart TV 55"',
    price: '$599.99',
    rating: 4.8,
    reviews: '(8234)',
    purchased: '12,453 purchased this month',
  },
  {
    rank: '#2',
    image: undefined,
    name: 'Robot Vacuum Cleaner',
    price: '$349.99',
    rating: 4.9,
    reviews: '(15234)',
    purchased: '23,451 purchased this month',
  },
  {
    rank: '#3',
    image: undefined,
    name: 'Memory Foam Mattress',
    price: '$799.99',
    rating: 4.8,
    reviews: '(6789)',
    purchased: '9,876 purchased this month',
  },
  {
    rank: '#4',
    image: undefined,
    name: 'Air Fryer XL',
    price: '$129.99',
    rating: 4.9,
    reviews: '(23456)',
    purchased: '34,521 purchased this month',
  },
  {
    rank: '#5',
    image: undefined,
    name: 'Instant Pot 8-Qt',
    price: '$99.99',
    rating: 4.8,
    reviews: '(18765)',
    purchased: '28,934 purchased this month',
  },
  {
    rank: '#6',
    image: undefined,
    name: 'Weighted Blanket Queen',
    price: '$79.99',
    rating: 4.7,
    reviews: '(5432)',
    purchased: '8,765 purchased this month',
  },
];

export default function BestSellersSection() {
  return (
    <section className="bestsellers-section">
      <div className="bestsellers-container">
        <h2 className="bestsellers-heading">Best Sellers</h2>
        <div className="bestsellers-grid">
          {bestSellers.map((item, index) => (
            <BestSellerCard key={index} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
}
