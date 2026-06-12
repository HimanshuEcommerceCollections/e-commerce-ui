import Image from 'next/image';

interface CategoryCardProps {
  name: string;
  items: string;
  imageSrc: string;
}

export default function CategoryCard({ name, items, imageSrc }: CategoryCardProps) {
  return (
    <div className="flex cursor-pointer flex-col items-start">
      <div className="relative w-full h-[190.62px] shrink-0 overflow-hidden rounded-[19.22px] border border-[#E5E7EB]">
        <Image
          src={imageSrc}
          alt={name}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex w-full flex-col items-center pt-[14.42px]">
        <span className="w-full [font-family:'Inter',sans-serif] not-italic font-semibold text-[16.82px] leading-6 text-center text-[#111827]">{name}</span>
        <span className="w-full pt-[4.81px] [font-family:'Inter',sans-serif] not-italic font-normal text-[14.42px] leading-[19px] text-center text-[#6B7280]">{items}</span>
      </div>
    </div>
  );
}
