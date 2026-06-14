import Image from 'next/image';

export default function HeroLeft() {
  return (
    <div className="relative isolate w-[849px] h-[855px] shrink-0 overflow-hidden rounded-[28.83px] max-lg:w-full max-md:h-[520px]">
      <Image
        src="/heropics/summer-sale.png"
        alt="Summer Sale"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 z-[1] flex flex-col items-start justify-center px-[76.89px] py-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.6)_0%,rgba(0,0,0,0.4)_50%,rgba(0,0,0,0)_100%)] max-md:px-6">
        <div className="box-border flex w-[695px] flex-col items-start p-[57.67px] rounded-[28.83px] border border-white bg-[rgba(255,255,255,0.38)] shadow-[0px_9.61px_38.44px_rgba(0,0,0,0.08)] max-lg:w-full max-md:p-6">
          <span className="[font-family:'Inter',sans-serif] not-italic font-semibold text-[16.82px] leading-6 tracking-[0.84px] text-[#F97316]">SUMMER SAVINGS EVENT</span>
          <h1 className="pt-[19.22px] [font-family:'Inter',sans-serif] not-italic font-bold text-[72.08px] leading-[90px] text-white max-md:text-[40px] max-md:leading-[48px]">Up To 70% Off</h1>
          <p className="pt-[28.83px] [font-family:'Inter',sans-serif] not-italic font-normal text-[24.03px] leading-[34px] text-[rgba(255,255,255,0.9)] max-md:text-[18px] max-md:leading-[26px]">Thousands of products on sale. Limited time only.</p>
          <div className="flex w-full flex-row items-start gap-[19.22px] pt-[38.44px] max-md:flex-wrap">
            <button className="flex w-[174px] h-[69px] cursor-pointer items-center justify-center rounded-full border-none bg-[#2563EB] [font-family:'Inter',sans-serif] font-semibold text-[19.22px] leading-[29px] text-white whitespace-nowrap max-md:h-[56px]">Shop Deals</button>
            <button className="flex w-[240px] h-[69px] cursor-pointer items-center justify-center rounded-full border border-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.2)] [font-family:'Inter',sans-serif] font-semibold text-[19.22px] leading-[29px] text-white whitespace-nowrap max-md:h-[56px]">Browse Categories</button>
          </div>
        </div>
      </div>
    </div>
  );
}
