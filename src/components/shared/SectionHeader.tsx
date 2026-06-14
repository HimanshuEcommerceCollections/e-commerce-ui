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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div
              className="w-[22px] h-[22px] rounded-full"
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
          <h2 className="text-[20px] font-bold text-[var(--color-navy)] tracking-[-0.3px]">{title}</h2>
          {extra}
        </div>
        <span className="text-[13px] font-medium cursor-pointer hover:underline text-[var(--color-blue-primary)]">{viewAllLabel}</span>
      </div>
      <div className="w-full h-px mb-4 bg-[var(--color-slate-border)]" />
    </>
  );
}
