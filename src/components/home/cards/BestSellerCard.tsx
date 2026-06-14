import Image from 'next/image';
import SafeImage from '@/components/shared/SafeImage';

interface BestSellerCardProps {
  rank: string;
  image?: string;
  name: string;
  price: string;
  rating: number;
  reviews: string;
  purchased: string;
}

export default function BestSellerCard({
  rank,
  image,
  name,
  price,
  rating,
  reviews,
  purchased,
}: BestSellerCardProps) {
  return (
    <div className="flex flex-row items-start gap-[19px] rounded-[19px] border border-[#E5E7EB] bg-white p-[29px] shadow-[0px_5px_19px_rgba(0,0,0,0.06)] max-md:gap-3 max-md:p-5">
      <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full bg-[#F97316]">
        <span className="text-[24px] font-bold leading-[34px] text-white [font-family:'Inter',sans-serif]">{rank}</span>
      </div>

      <div className="relative h-[115px] w-[115px] shrink-0 overflow-hidden rounded-3xl bg-[#D1D5DB] max-sm:h-[90px] max-sm:w-[90px]">
        <SafeImage src={image} alt={name} fill style={{ objectFit: 'cover' }} />
      </div>

      <div className="flex flex-1 flex-col items-start">
        <p className="m-0 text-[17px] font-semibold leading-6 text-[#111827] [font-family:'Inter',sans-serif]">{name}</p>
        <p className="mt-[10px] text-[24px] font-bold leading-[34px] text-[#0F172A] [font-family:'Inter',sans-serif]">{price}</p>
        <div className="mt-[10px] flex flex-row items-center gap-[5px]">
          <Image
            src="/flashsale/star.png"
            alt="Star"
            width={19}
            height={19}
          />
          <span className="text-[17px] font-semibold leading-6 text-[#111827] [font-family:'Inter',sans-serif]">{rating}</span>
          <span className="ml-[5px] text-[14px] font-normal leading-[19px] text-[#6B7280] [font-family:'Inter',sans-serif]">{reviews}</span>
        </div>
        <p className="mt-[5px] text-[14px] font-normal leading-[19px] text-[#6B7280] [font-family:'Inter',sans-serif]">{purchased}</p>
      </div>
    </div>
  );
}
