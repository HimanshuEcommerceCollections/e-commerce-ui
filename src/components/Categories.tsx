import SectionHeader from "@/components/shared/SectionHeader";
import CategoryCard from "@/components/shared/CategoryCard";

const cats = [
  { name: "Women's",    count: "1,240 items", iconBg: "#FDF2F8", iconColor: "#BE185D", icon: "👗" },
  { name: "Men's",      count: "980 items",   iconBg: "#EFF6FF", iconColor: "#1E40AF", icon: "👔" },
  { name: "Electronics",count: "2,100 items", iconBg: "#F0FDF4", iconColor: "#166534", icon: "💻" },
  { name: "Home",       count: "760 items",   iconBg: "#FFFBEB", iconColor: "#92400E", icon: "🏠" },
  { name: "Beauty",     count: "540 items",   iconBg: "#FFF1F2", iconColor: "#BE123C", icon: "💄" },
  { name: "Sports",     count: "430 items",   iconBg: "#F0FDF4", iconColor: "#065F46", icon: "⚽" },
  { name: "Footwear",   count: "320 items",   iconBg: "#EFF6FF", iconColor: "#1E3A8A", icon: "👟" },
  { name: "Toys",       count: "290 items",   iconBg: "#FDF4FF", iconColor: "#6B21A8", icon: "🧸" },
  { name: "Books",      count: "1,800 items", iconBg: "#FFFBEB", iconColor: "#78350F", icon: "📚" },
  { name: "Grocery",    count: "900 items",   iconBg: "#F0FDF4", iconColor: "#14532D", icon: "🛒" },
];

export default function Categories() {
  return (
    <section className="categories-section">
      <SectionHeader title="Shop by Category" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 16 }}>
        {cats.map((c) => (
          <CategoryCard key={c.name} {...c} />
        ))}
      </div>
    </section>
  );
}
