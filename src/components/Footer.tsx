import TrustItem from "@/components/shared/TrustItem";

const linkCols = [
  { heading: "Company", links: ["About us", "Careers", "Press", "Investors"] },
  { heading: "Shop",    links: ["Gift Cards", "Deals", "New Arrivals", "Gift Cards"] },
  { heading: "Help",    links: ["Help Center", "Track Order", "Returns", "Contact"] },
  { heading: "Sell",    links: ["Start Selling", "Seller Hub", "App", "Fulfillment"] },
];

const trustItems = [
  { icon: "🔒", label: "Secure Checkout" },
  { icon: "🚚", label: "Free on $35+" },
  { icon: "↩️", label: "Easy Returns" },
  { icon: "🇺🇸", label: "Ships from US" },
];

export default function Footer() {
  return (
    <footer className="footer-root">
      <div style={{ display: "flex", gap: 80 }}>
        {/* Brand */}
        <div style={{ minWidth: 220 }}>
          <span className="footer-logo">
            Nexus
            <span
              style={{
                width: 7,
                height: 7,
                background: "#2563EB",
                borderRadius: "50%",
                display: "inline-block",
                marginLeft: 3,
                verticalAlign: "middle",
              }}
            />
          </span>
          <p className="footer-tagline">Millions of products. Delivered fast.</p>
        </div>

        {/* Link columns */}
        {linkCols.map((col) => (
          <div key={col.heading}>
            <p className="footer-col-heading">{col.heading}</p>
            {col.links.map((link) => (
              <a key={link} className="footer-col-link">
                {link}
              </a>
            ))}
          </div>
        ))}
      </div>

      {/* Trust row */}
      <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
        {trustItems.map((item) => (
          <TrustItem
            key={item.label}
            icon={<span>{item.icon}</span>}
            label={item.label}
            variant="footer"
          />
        ))}
      </div>

      <div className="footer-divider" />

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span className="footer-copy">© 2024 Nexus, Inc. All rights reserved.</span>
        <span className="footer-copy">Visa · Mastercard · PayPal · Apple Pay · Google Pay</span>
      </div>
    </footer>
  );
}
