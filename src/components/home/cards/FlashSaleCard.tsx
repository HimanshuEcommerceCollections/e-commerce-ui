import Image from 'next/image';
import AddToCartButton from '@/components/shared/AddToCartButton';
import SafeImage from '@/components/shared/SafeImage';

interface FlashSaleCardProps {
  name: string;
  price: string;
  originalPrice: string;
  discount: string;
  rating: string;
  reviews: string;
  stockLeft: number;
  stockPercent: number;
  imageSrc: string;
}

export default function FlashSaleCard({
  name, price, originalPrice, discount,
  rating, reviews, stockLeft, stockPercent, imageSrc,
}: FlashSaleCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-[19.22px] border border-[#E5E7EB] bg-white shadow-[0px_4.81px_19.22px_rgba(0,0,0,0.06)]">

      {/* Image */}
      <div className="relative isolate w-full h-[278.72px] shrink-0">
        <SafeImage src={imageSrc} alt={name} fill style={{ objectFit: 'cover' }} />
        <span className="absolute top-[14.42px] right-[14.42px] z-[2] rounded-full bg-[#F97316] py-[4.57px] px-[14.42px] [font-family:'Inter',sans-serif] font-semibold text-[16.82px] leading-6 text-white">{discount}</span>
        <button className="absolute top-[14.42px] left-[14.42px] z-[2] flex h-[38.44px] w-[38.44px] cursor-pointer items-center justify-center rounded-full border-none bg-white" aria-label="Add to wishlist">
          <Image src="/flashsale/wishlist.png" width={19} height={19} alt="wishlist" />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-[19.22px]">

        <span className="[font-family:'Inter',sans-serif] font-normal text-[16.82px] leading-6 text-[#111827]">{name}</span>

        <div className="flex flex-row items-baseline gap-2 pt-[9.61px]">
          <span className="[font-family:'Inter',sans-serif] font-bold text-[24.03px] leading-[34px] text-[#0F172A]">{price}</span>
          <span className="[font-family:'Inter',sans-serif] font-normal text-[16.82px] leading-6 line-through text-[#6B7280]">{originalPrice}</span>
        </div>

        <div className="flex flex-row items-center gap-[9.61px] pt-[9.61px]">
          <div className="flex flex-row items-center gap-[4.81px]">
            <Image src="/flashsale/star.png" width={19} height={19} alt="star" />
            <span className="[font-family:'Inter',sans-serif] font-semibold text-[16.82px] leading-6 text-[#111827]">{rating}</span>
          </div>
          <span className="[font-family:'Inter',sans-serif] font-normal text-[14.42px] leading-[19px] text-[#6B7280]">({reviews})</span>
        </div>

        <div className="py-[14.42px]">
          <div className="flex flex-row items-center justify-between pb-[4.81px]">
            <span className="[font-family:'Inter',sans-serif] font-normal text-[14.42px] leading-[19px] text-[#6B7280]">Only {stockLeft} left</span>
            <span className="[font-family:'Inter',sans-serif] font-semibold text-[14.42px] leading-[19px] text-[#F97316]">{stockPercent}%</span>
          </div>
          <div className="w-full h-[9.61px] overflow-hidden rounded-full bg-[#F8FAFC]">
            <div
              className="h-full rounded-full bg-[#F97316]"
              style={{ width: `${stockPercent}%` }}
            />
          </div>
        </div>

        <AddToCartButton />

      </div>
    </div>
  );
}
