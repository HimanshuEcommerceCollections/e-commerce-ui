import Image from 'next/image';

const banners = [
  {
    image: '/displayimages/Image (Electronics Event).png',
    label: 'MEGA SALE',
    heading: 'Electronics Event',
    subtext: 'Up to 60% off tech essentials',
    buttonText: 'Shop Now',
  },
  {
    image: '/displayimages/Image (Home Makeover).png',
    label: 'SUMMER REFRESH',
    heading: 'Home Makeover',
    subtext: 'Transform your space',
    buttonText: 'Explore',
  },
];

export default function PromoBannersSection() {
  return (
    <section className="flex w-full bg-white py-12 max-md:py-6">
      <div className="mx-auto flex w-full max-w-[1384px] flex-row gap-[29px] px-12 max-md:flex-col max-md:px-4">
        {banners.map((banner, index) => (
          <div className="relative h-96 flex-1 overflow-hidden rounded-[19px]" key={index}>
            <Image
              src={banner.image}
              alt={banner.heading}
              fill
              style={{ objectFit: 'cover' }}
            />
            <div className="absolute left-0 top-0 z-[1] h-full w-full bg-[linear-gradient(0deg,rgba(0,0,0,0.8)_0%,rgba(0,0,0,0.4)_50%,rgba(0,0,0,0)_100%)]" />
            <div className="absolute bottom-0 left-0 z-[2] flex w-full flex-col items-start p-[38px] max-md:p-6">
              <p className="m-0 text-[17px] font-semibold leading-6 text-[#F97316] [font-family:'Inter',sans-serif]">{banner.label}</p>
              <h2 className="mt-[10px] text-[36px] font-bold leading-[43px] text-white [font-family:'Inter',sans-serif] max-md:text-[26px] max-md:leading-[32px]">{banner.heading}</h2>
              <p className="mb-[19px] mt-[10px] text-[19px] font-normal leading-[29px] text-white/80 [font-family:'Inter',sans-serif]">{banner.subtext}</p>
              <button className="inline-flex cursor-pointer items-center justify-center rounded-full border-none bg-white px-7 py-[14px] text-[17px] font-semibold leading-6 text-[#0F172A] [font-family:'Inter',sans-serif]">{banner.buttonText}</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
