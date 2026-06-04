interface CategoryCardProps {
  name: string;
  count: string;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
}

export default function CategoryCard({ name, count, iconBg, iconColor, icon }: CategoryCardProps) {
  return (
    <div className="category-card">
      <div className="category-icon-circle" style={{ backgroundColor: iconBg }}>
        <span style={{ color: iconColor, fontSize: 20 }}>{icon}</span>
      </div>
      <span className="category-name">{name}</span>
      <span className="category-count">{count}</span>
    </div>
  );
}
