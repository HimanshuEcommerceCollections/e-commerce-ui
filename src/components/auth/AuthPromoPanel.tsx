import Image from "next/image";
import {
  Sparkles,
  Truck,
  RotateCcw,
  ShieldCheck,
  Lock,
  Star,
  Tag,
  Clock,
} from "lucide-react";
import Logo from "@/components/shared/Logo";

/* Static marketing content for the side panel of the auth screens.
   Shared shell (brand header + trust footer); the body differs per variant.
   Purely decorative — no live data. */

const LOGIN_FEATURES = [
  { icon: Truck, label: "Free Shipping on Orders Over $50" },
  { icon: RotateCcw, label: "Easy 30-Day Returns" },
  { icon: ShieldCheck, label: "Secure Encrypted Payments" },
];

const SIGNUP_FEATURES = [
  { icon: Tag, label: "Exclusive member deals & early access to sales" },
  { icon: Truck, label: "Free shipping on orders over $50" },
  { icon: Clock, label: "Hassle-free 30-day returns, no questions asked" },
];

const CATEGORIES = ["Electronics", "Fashion", "Home", "Beauty", "Sports", "Books"];

const PRODUCTS = [
  { name: "Wireless Earbuds Pro", price: "$49.99", original: "$90.99", badge: "48% off", image: "/products/wireless-earbuds.png", swatch: "from-rose-500 to-fuchsia-600" },
  { name: "Smart Watch", price: "$129.99", original: null, badge: null, image: "/products/smart-watch.png", swatch: "from-emerald-500 to-teal-600" },
];

const STATS = [
  { value: "5M+", label: "Happy Customers" },
  { value: "50K+", label: "Products" },
  { value: "4.8★", label: "App Rating" },
];

const FOOTER = {
  login: [
    { icon: Lock, label: "256-bit SSL Encryption" },
    { icon: ShieldCheck, label: "Buyer Protection" },
    { icon: Star, label: "4.8/5 Rating", starred: true },
  ],
  signup: [
    { icon: Lock, label: "256-bit Encrypted" },
    { icon: ShieldCheck, label: "Buyer Protection" },
    { icon: Star, label: "4.8/5 Rating", starred: true },
  ],
};

// Full literal class names so Tailwind doesn't tree-shake the gradient rules.
const PROMO_CLASS = {
  login: "auth-promo auth-promo--login",
  signup: "auth-promo auth-promo--signup",
};

export default function AuthPromoPanel({ variant }: { variant: "login" | "signup" }) {
  const features = variant === "login" ? LOGIN_FEATURES : SIGNUP_FEATURES;

  return (
    <div className={PROMO_CLASS[variant]}>
      {/* Floating product cards — login only; staggered cluster, top-right */}
      {variant === "login" && (
        <div className="auth-promo-products">
          {PRODUCTS.map((p, i) => (
            <div
              key={p.name}
              className={
                i === 0
                  ? "auth-promo-card auth-promo-card--main"
                  : "auth-promo-card auth-promo-card--alt"
              }
            >
              <div className={`auth-promo-card-img bg-gradient-to-br ${p.swatch}`}>
                <Image src={p.image} alt={p.name} fill sizes="220px" className="object-cover" />
                {p.badge && <span className="auth-promo-card-badge">{p.badge}</span>}
              </div>
              <p className="auth-promo-card-name">{p.name}</p>
              <p className="auth-promo-card-price">
                {p.price}
                {p.original && <span className="auth-promo-card-original">{p.original}</span>}
              </p>
              <button className="auth-promo-card-btn">Add to Cart</button>
            </div>
          ))}
        </div>
      )}

      {/* Header — shared */}
      <div className="auth-promo-header">
        <Logo size="md" tone="dark" />
        <span className="auth-promo-pill">
          <span className="auth-promo-dot" />
          Trusted by 5M+ shoppers
        </span>
      </div>

      {/* Body — per variant */}
      <div className="auth-promo-body">
        {variant === "login" ? (
          <span className="auth-promo-eyebrow">
            <Sparkles size={13} />
            Summer Sale 2026
          </span>
        ) : (
          <span className="auth-promo-eyebrow-text">New here?</span>
        )}

        {variant === "login" ? (
          <h2 className="auth-promo-title">
            Up to <span className="auth-promo-title-lg">70% Off</span>Everything
          </h2>
        ) : (
          <h2 className="auth-promo-title">Join ShopHub Today</h2>
        )}

        <p className="auth-promo-text">
          {variant === "login"
            ? "Shop Electronics, Fashion, Home & Beauty"
            : "Your one-stop shop for everything you love."}
        </p>

        <ul className="auth-promo-features">
          {features.map(({ icon: Icon, label }) => (
            <li key={label} className="auth-promo-feature">
              <span className="auth-promo-feature-icon">
                <Icon size={13} />
              </span>
              {label}
            </li>
          ))}
        </ul>

        {variant === "login" ? (
          <div className="auth-promo-tags">
            {CATEGORIES.map((c) => (
              <span key={c} className="auth-promo-tag">
                {c}
              </span>
            ))}
          </div>
        ) : (
          <div className="auth-stats">
            {STATS.map((s) => (
              <div key={s.label} className="auth-stat">
                <p className="auth-stat-value">{s.value}</p>
                <p className="auth-stat-label">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer — shared shell */}
      <div className="auth-promo-footer">
        {FOOTER[variant].map(({ icon: Icon, label, starred }) => (
          <span key={label} className="auth-promo-footer-item">
            <Icon size={13} className={starred ? "fill-amber-300 text-amber-300" : ""} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
