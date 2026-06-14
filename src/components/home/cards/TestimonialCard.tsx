import Image from 'next/image';

interface TestimonialCardProps {
  review: string;
  name: string;
}

export default function TestimonialCard({ review, name }: TestimonialCardProps) {
  return (
    <div className="flex flex-col items-start rounded-[19px] bg-[#F8FAFC] p-[29px]">
      <div className="mb-[14px] flex flex-row items-center gap-[10px]">
        {[...Array(5)].map((_, i) => (
          <Image
            key={i}
            src="/flashsale/star.png"
            alt="Star"
            width={19}
            height={19}
          />
        ))}
      </div>
      <p className="m-0 flex-1 text-[17px] font-normal leading-[27px] text-[#111827] [font-family:'Inter',sans-serif]">{review}</p>
      <div className="mt-[19px] flex w-full flex-row items-center justify-between">
        <span className="text-[17px] font-semibold leading-6 text-[#111827] [font-family:'Inter',sans-serif]">{name}</span>
        <div className="flex flex-row items-center gap-[5px]">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.5 7L5.5 10L11.5 4" stroke="#111827" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[14px] font-normal leading-[19px] text-[#111827] [font-family:'Inter',sans-serif]">Verified Purchase</span>
        </div>
      </div>
    </div>
  );
}
