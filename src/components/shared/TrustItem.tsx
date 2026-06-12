interface TrustItemProps {
  icon: React.ReactNode;
  label: string;
  variant?: "dark" | "footer";
}

export default function TrustItem({ icon, label, variant = "dark" }: TrustItemProps) {
  const cls =
    variant === "footer"
      ? "footer-trust-item"
      : "flex flex-col items-center gap-[12px] w-[180px]";
  const labelCls = variant === "footer" ? "text-[12px] font-medium" : "trust-item-label";
  const labelColor = variant === "footer" ? "rgba(255,255,255,0.65)" : undefined;

  return (
    <div className={cls}>
      <div className="trust-item-icon">{icon}</div>
      <span
        className={labelCls}
        style={labelColor ? { color: labelColor } : undefined}
      >
        {label}
      </span>
    </div>
  );
}
