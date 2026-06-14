interface CategoryCardProps {
  name: string;
  count: string;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
}

export default function CategoryCard({ name, count, iconBg, iconColor, icon }: CategoryCardProps) {
  return (
    <div className="flex flex-col items-center bg-white rounded-xl cursor-pointer hover:shadow-md transition-shadow py-5 border-[0.5px] border-[var(--color-slate-border)] shadow-[0_2px_6px_rgba(0,0,0,0.05)] min-w-[113px]">
      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: iconBg }}>
        <span style={{ color: iconColor, fontSize: 20 }}>{icon}</span>
      </div>
      <span className="text-[11px] font-semibold text-center text-[var(--color-navy)]">{name}</span>
      <span className="text-[10px] text-center text-[var(--color-blue-primary)]">{count}</span>
    </div>
  );
}
