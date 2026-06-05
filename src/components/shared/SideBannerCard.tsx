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
    <div className="side-banner-card" style={{ background: gradient }}>
      <p className="side-banner-title">{title}</p>
      <p className="side-banner-subtitle">{subtitle}</p>
      <button className="side-banner-btn">{btnLabel}</button>
      <div className="side-banner-img" style={{ background: imgGradient }} />
    </div>
  );
}
