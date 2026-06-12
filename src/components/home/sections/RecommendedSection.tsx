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
    <section className="flex w-full flex-col items-center bg-white p-12 max-md:px-4 max-md:py-6">
      <div className="mx-auto flex w-full max-w-[1384px] flex-col items-start">
        <h2 className="m-0 text-[36px] font-bold leading-[43px] text-[#0F172A] [font-family:'Inter',sans-serif] max-md:text-[26px] max-md:leading-[32px]">Recommended For You</h2>
        <p className="mb-[38px] mt-[10px] text-[19px] font-normal leading-[29px] text-[#6B7280] [font-family:'Inter',sans-serif]">Based on your browsing history</p>
        <div className="grid w-full grid-cols-4 gap-[29px] max-lg:grid-cols-2 max-md:gap-4 max-sm:grid-cols-1">
          {recommendedProducts.map((product, index) => (
            <RecommendedCard key={index} {...product} />
          ))}
        </div>
      </div>
    </section>
  );
}
