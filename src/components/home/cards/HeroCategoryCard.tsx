import Image from 'next/image';

interface HeroCategoryCardProps {
  label: string;
  imageSrc: string;
}

export default function HeroCategoryCard({ label, imageSrc }: HeroCategoryCardProps) {
  return (
    <div className="relative isolate h-48 w-full shrink-0 overflow-hidden rounded-[19px]">
      <Image
        src={imageSrc}
        alt={label}
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 z-[1] flex flex-row items-end p-[28.83px] bg-[linear-gradient(0deg,rgba(0,0,0,0.7)_0%,rgba(0,0,0,0.3)_50%,rgba(0,0,0,0)_100%)]">
        <span className="[font-family:'Inter',sans-serif] not-italic font-semibold text-[19.22px] leading-[29px] text-white">{label}</span>
      </div>
    </div>
  );
}
