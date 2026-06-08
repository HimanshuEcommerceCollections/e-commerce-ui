import Image from 'next/image';
import FlashCountdown from '../ui/FlashCountdown';
import FlashSaleCard from '../cards/FlashSaleCard';

const flashProducts = [
  {
    name: 'Wireless Headphones Pro',
    price: '$89.99',
    originalPrice: '$299.99',
    discount: '-70%',
    rating: '4.8',
    reviews: '2453',
    stockLeft: 45,
    stockPercent: 45,
    imageSrc: '/flashsaleimages/headphones.png',
  },
  {
    name: 'Smart Watch Series 5',
    price: '$199.99',
    originalPrice: '$499.99',
    discount: '-60%',
    rating: '4.9',
    reviews: '5821',
    stockLeft: 28,
    stockPercent: 28,
    imageSrc: '/flashsaleimages/smartwatch.jpg',
  },
  {
    name: 'Premium Laptop 15"',
    price: '$799.99',
    originalPrice: '$1499.99',
    discount: '-47%',
    rating: '4.7',
    reviews: '1234',
    stockLeft: 15,
    stockPercent: 15,
    imageSrc: '/flashsaleimages/laptop.png',
  },
  {
    name: 'Bluetooth Speaker',
    price: '$49.99',
    originalPrice: '$149.99',
    discount: '-67%',
    rating: '4.6',
    reviews: '3892',
    stockLeft: 67,
    stockPercent: 67,
    imageSrc: '/flashsaleimages/speaker.jpg',
  },
  {
    name: 'Gaming Mouse RGB',
    price: '$29.99',
    originalPrice: '$79.99',
    discount: '-63%',
    rating: '4.8',
    reviews: '4521',
    stockLeft: 89,
    stockPercent: 89,
    imageSrc: '/flashsaleimages/mouse.jpg',
  },
  {
    name: '4K Webcam Ultra',
    price: '$79.99',
    originalPrice: '$199.99',
    discount: '-60%',
    rating: '4.7',
    reviews: '1876',
    stockLeft: 34,
    stockPercent: 34,
    imageSrc: '/flashsaleimages/webcam.jpg',
  },
  {
    name: 'Wireless Keyboard',
    price: '$39.99',
    originalPrice: '$99.99',
    discount: '-60%',
    rating: '4.5',
    reviews: '2341',
    stockLeft: 56,
    stockPercent: 56,
    imageSrc: '/flashsaleimages/keyboard.png',
  },
  {
    name: 'USB-C Hub 7-in-1',
    price: '$34.99',
    originalPrice: '$89.99',
    discount: '-61%',
    rating: '4.6',
    reviews: '1567',
    stockLeft: 78,
    stockPercent: 78,
    imageSrc: '/flashsaleimages/usbub.png',
  },
];

export default function FlashSaleSection() {
  return (
    <section className="flash-sale-section">
      <div className="flash-sale-wrapper">

        {/* Header */}
        <div className="flash-sale-header">
          <div className="flash-sale-title-group">
            <Image
              src="/flashsale/clock.png"
              width={38}
              height={38}
              alt="flash sale"
              className="flash-sale-clock-icon"
            />
            <div>
              <div className="flash-sale-title">Flash Sale</div>
              <div className="flash-sale-subtitle">Deals ending soon - Don&apos;t miss out!</div>
            </div>
          </div>
          <FlashCountdown />
        </div>

        {/* Product Grid */}
        <div className="flash-sale-grid-wrapper">
          <div className="flash-sale-grid">
            {flashProducts.map((product) => (
              <FlashSaleCard key={product.name} {...product} />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
