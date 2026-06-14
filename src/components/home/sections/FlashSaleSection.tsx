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
    imageSrc: '/products/smart-watch.png',
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
    imageSrc: '', // TODO: add a real Bluetooth Speaker image to /public
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
    imageSrc: '', // TODO: add a real Gaming Mouse image to /public
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
    imageSrc: '', // TODO: add a real 4K Webcam image to /public
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
    <section className="w-full py-12 px-[48.06px] max-md:px-4 max-md:py-6">
      <div className="box-border w-full rounded-[28.83px] border border-[rgba(249,115,22,0.2)] bg-[linear-gradient(135deg,rgba(249,115,22,0.05)_0%,rgba(249,115,22,0.1)_50%,rgba(37,99,235,0.05)_100%)] p-[38.44px] max-md:p-5">

        {/* Header */}
        <div className="flex w-full flex-row items-center justify-between max-md:flex-col max-md:items-start max-md:gap-4">
          <div className="flex flex-row items-center gap-[19.22px]">
            <Image
              src="/flashsale/clock.png"
              width={38}
              height={38}
              alt="flash sale"
              className="w-[38.44px] h-[38.44px] shrink-0"
            />
            <div>
              <div className="[font-family:'Inter',sans-serif] font-bold text-[36.04px] leading-[43px] text-[#0F172A] max-md:text-[26px] max-md:leading-[32px]">Flash Sale</div>
              <div className="pt-[9.61px] [font-family:'Inter',sans-serif] font-normal text-[19.22px] leading-[29px] text-[#6B7280] max-md:text-[15px] max-md:leading-[22px]">Deals ending soon - Don&apos;t miss out!</div>
            </div>
          </div>
          <FlashCountdown />
        </div>

        {/* Product Grid */}
        <div className="pt-[38.44px]">
          <div className="grid grid-cols-4 gap-[28.83px] max-lg:grid-cols-2 max-md:gap-4 max-sm:grid-cols-1">
            {flashProducts.map((product) => (
              <FlashSaleCard key={product.name} {...product} />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
