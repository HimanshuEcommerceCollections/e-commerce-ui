interface SideBannerCardProps {
  title: string;
  subtitle: string;
  btnLabel: string;
  gradient: string;
  imgGradient: string;
}

export default function SideBannerCard({
  title,
  subtitle,
  btnLabel,
  gradient,
  imgGradient,
}: SideBannerCardProps) {
  return (
    <div className="relative w-full h-[100px] rounded-xl overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.1)]" style={{ background: gradient }}>
      <p className="absolute left-[14px] top-[18px] text-white text-[16px] font-bold">{title}</p>
      <p className="absolute left-[14px] top-[42px] text-[12px] text-[rgba(255,255,255,0.62)]">{subtitle}</p>
      <button className="absolute left-[14px] bottom-[10px] flex items-center px-3 h-7 rounded-[14px] text-white text-[11px] font-semibold border bg-[rgba(255,255,255,0.16)] border-[rgba(255,255,255,0.2)]">{btnLabel}</button>
      <div className="absolute right-0 top-0 w-[108px] h-full rounded-[10px]" style={{ background: imgGradient }} />
    </div>
  );
}
