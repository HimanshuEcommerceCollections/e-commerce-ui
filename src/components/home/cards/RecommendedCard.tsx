import Image from 'next/image';

interface RecommendedCardProps {
  image?: string;
  name: string;
  price: string;
  rating: number;
  reviews: string;
}

export default function RecommendedCard({
  image,
  name,
  price,
  rating,
  reviews,
}: RecommendedCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-[19px] border border-[#E5E7EB] bg-white shadow-[0px_5px_19px_rgba(0,0,0,0.06)]">
      <div className="relative h-[298px] w-full shrink-0 bg-[#D1D5DB]">
        {image && (
          <Image
            src={image}
            alt={name}
            fill
            style={{ objectFit: 'cover' }}
          />
        )}
      </div>
      <div className="flex flex-col items-start p-[19px]">
        <p className="m-0 text-[17px] font-normal leading-6 text-[#111827] [font-family:'Inter',sans-serif]">{name}</p>
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
      </div>
    </div>
  );
}
