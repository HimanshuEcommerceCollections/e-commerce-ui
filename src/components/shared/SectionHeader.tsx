interface SectionHeaderProps {
  icon?: React.ReactNode;
  iconBg?: string;
  title: string;
  viewAllLabel?: string;
  extra?: React.ReactNode;
}

export default function SectionHeader({
  icon,
  iconBg,
  title,
  viewAllLabel = "View all →",
  extra,
}: SectionHeaderProps) {
  return (
    <>
      <div className="section-header">
        <div className="section-header-left">
          {icon && (
            <div
              className="section-icon-dot"
              style={{
                backgroundColor: iconBg ?? "#F59E0B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {icon}
            </div>
          )}
          <h2 className="section-title">{title}</h2>
          {extra}
        </div>
        <span className="section-view-all">{viewAllLabel}</span>
      </div>
      <div className="section-divider" />
    </>
  );
}
