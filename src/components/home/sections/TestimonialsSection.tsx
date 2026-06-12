import TestimonialCard from '../cards/TestimonialCard';

const testimonials = [
  {
    review: 'Absolutely love shopping here! Fast shipping and great quality products. Will definitely order again.',
    name: 'Sarah Johnson',
  },
  {
    review: 'Best online shopping experience ever. Customer service is outstanding and prices are unbeatable.',
    name: 'Michael Chen',
  },
  {
    review: 'The product selection is amazing and everything arrives perfectly packaged. Highly recommend!',
    name: 'Emma Williams',
  },
];

const stats = [
  { number: '5M+', label: 'Happy Customers' },
  { number: '1M+', label: 'Product Reviews' },
  { number: '98%', label: 'Satisfaction Rate' },
];

export default function TestimonialsSection() {
  return (
    <section className="flex w-full flex-col items-center bg-white py-12 max-md:py-6">
      <div className="mx-auto flex w-full max-w-[1384px] flex-col items-start px-12 max-md:px-4">
        <h2 className="mb-[38px] w-full text-center text-[36px] font-bold leading-[43px] text-[#0F172A] [font-family:'Inter',sans-serif] max-md:text-[26px] max-md:leading-[32px]">What Our Customers Say</h2>
        <div className="grid w-full grid-cols-3 gap-[29px] max-lg:grid-cols-2 max-sm:grid-cols-1">
          {testimonials.map((item, index) => (
            <TestimonialCard key={index} review={item.review} name={item.name} />
          ))}
        </div>
        <div className="mt-[58px] grid w-full grid-cols-3">
          {stats.map((stat, index) => (
            <div className="flex flex-col items-center" key={index}>
              <p className="m-0 text-center text-[43px] font-bold leading-[48px] text-[#2563EB] [font-family:'Inter',sans-serif] max-md:text-[28px] max-md:leading-[34px]">{stat.number}</p>
              <p className="mt-[10px] text-center text-[19px] font-normal leading-[29px] text-[#6B7280] [font-family:'Inter',sans-serif] max-md:text-[14px]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
