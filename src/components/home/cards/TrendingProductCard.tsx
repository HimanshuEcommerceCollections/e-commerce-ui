import Image from 'next/image';
import SafeImage from '@/components/shared/SafeImage';

interface TrendingProductCardProps {
  badge: string;
  image?: string;
  name: string;
  salePrice: string;
  originalPrice: string;
  rating: number;
  reviewCount: string;
  delivery: string;
}

export default function TrendingProductCard({
  badge,
  image,
  name,
  salePrice,
  originalPrice,
  rating,
  reviewCount,
  delivery,
}: TrendingProductCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-[19px] border border-[#E5E7EB] bg-white shadow-[0px_5px_19px_rgba(0,0,0,0.06)]">
      <div className="relative h-[298px] w-full shrink-0 overflow-hidden bg-[#D1D5DB]">
        <SafeImage src={image} alt={name} fill style={{ objectFit: 'cover' }} />
        <div className="absolute left-[14px] top-[14px] z-10 rounded-full bg-[#2563EB] px-3 py-[5px]">
          <span className="whitespace-nowrap text-[14px] font-semibold leading-[19px] text-white [font-family:'Inter',sans-serif]">{badge}</span>
        </div>
        <button className="absolute right-[14px] top-[14px] z-10 flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-full border-none bg-white" aria-label="Add to wishlist">
          <Image
            src="/flashsale/wishlist.png"
            alt="Wishlist"
            width={19}
            height={19}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-start p-[19px]">
        <p className="m-0 w-full text-[17px] font-normal leading-6 text-[#111827] [font-family:'Inter',sans-serif]">{name}</p>

        <div className="mt-[10px] flex flex-row items-baseline gap-[10px]">
          <span className="text-[24px] font-bold leading-[34px] text-[#0F172A] [font-family:'Inter',sans-serif]">{salePrice}</span>
          <span className="text-[17px] font-normal leading-6 text-[#6B7280] line-through [font-family:'Inter',sans-serif]">{originalPrice}</span>
        </div>

        <div className="mt-[10px] flex flex-row items-center gap-[5px]">
          <Image
            src="/flashsale/star.png"
            alt="Star"
            width={19}
            height={19}
          />
          <span className="text-[17px] font-semibold leading-6 text-[#111827] [font-family:'Inter',sans-serif]">{rating}</span>
          <span className="ml-[5px] text-[14px] font-normal leading-[19px] text-[#6B7280] [font-family:'Inter',sans-serif]">{reviewCount}</span>
        </div>

        <div className="mb-[14px] mt-[10px] flex flex-row items-center gap-[10px]">
          <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.5 3.5H12.5V13H1.5V3.5Z" stroke="#111827" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M12.5 6.5H15.5L17.5 9.5V13H12.5V6.5Z" stroke="#111827" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="4.5" cy="14.5" r="1.5" stroke="#111827" strokeWidth="1.5" />
            <circle cx="14.5" cy="14.5" r="1.5" stroke="#111827" strokeWidth="1.5" />
          </svg>
          <span className="text-[14px] font-normal leading-[19px] text-[#111827] [font-family:'Inter',sans-serif]">{delivery}</span>
        </div>

        <button className="mt-auto flex h-[43px] w-full cursor-pointer items-center justify-center rounded-full border-none bg-[#2563EB]">
          <span className="text-[17px] font-semibold leading-6 text-white [font-family:'Inter',sans-serif]">Quick Add</span>
        </button>
      </div>
    </div>
  );
}
