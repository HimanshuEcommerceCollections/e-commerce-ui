import TrustItem from "@/components/shared/TrustItem";

const items = [
  { icon: "🔒", label: "Secure Checkout" },
  { icon: "🚚", label: "Free on $35+" },
  { icon: "↩️", label: "Easy Returns" },
  { icon: "🇺🇸", label: "Ships from US" },
];

export default function TrustBar() {
  return (
    <div className="trust-bar">
      {items.map((item) => (
        <TrustItem key={item.label} icon={<span>{item.icon}</span>} label={item.label} />
      ))}
    </div>
  );
}
