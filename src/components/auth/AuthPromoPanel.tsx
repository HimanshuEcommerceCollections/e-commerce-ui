import {
  Truck,
  ShieldCheck,
  Lock,
  Star,
  Tag,
  Clock,
} from "lucide-react";
import Logo from "@/components/shared/Logo";

const LOGIN_FEATURES = [
  "Free Shipping on Orders Over $50",
  "Easy 30-Day Returns",
  "Secure Encrypted Payments",
];

const SIGNUP_FEATURES = [
  { icon: Tag, label: "Exclusive member deals & early access to sales" },
  { icon: Truck, label: "Free shipping on orders over $50" },
  { icon: Clock, label: "Hassle-free 30-day returns, no questions asked" },
];

const CATEGORIES = [
  { label: "Electronics", left: 0,   top: 0,  width: 112 },
  { label: "Fashion",     left: 120, top: 0,  width: 97  },
  { label: "Home",        left: 225, top: 0,  width: 82  },
  { label: "Beauty",      left: 0,   top: 45, width: 90  },
  { label: "Sports",      left: 98,  top: 45, width: 88  },
  { label: "Books",       left: 194, top: 45, width: 82  },
];

const STATS = [
  { value: "5M+",  label: "Happy Customers" },
  { value: "50K+", label: "Products" },
  { value: "4.8★", label: "App Rating" },
];

const FOOTER_SIGNUP = [
  { icon: Lock,       label: "256-bit SSL Encryption" },
  { icon: ShieldCheck, label: "Buyer Protection" },
  { icon: Star,       label: "4.8/5 Rating", starred: true },
];

export default function AuthPromoPanel({ variant }: { variant: "login" | "signup" }) {

  /* ── LOGIN VARIANT ── */
  if (variant === "login") {
    return (
      <div className="login-left">
        <div className="login-left-radial" />

        {/* Navbar */}
        <div className="login-navbar">
          <div className="login-logo-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 4H5L7.5 14H16.5L18.5 7H7.5" stroke="#2874F0" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="8.5" cy="17" r="1" stroke="#2874F0" strokeWidth="1.67"/>
              <circle cx="15.5" cy="17" r="1" stroke="#2874F0" strokeWidth="1.67"/>
            </svg>
          </div>
          <span className="login-brand-name">ShopHub</span>
          <div className="login-trust-badge">
            <div className="login-trust-dot" />
            <span className="login-trust-badge-text">Trusted by 5M+ shoppers</span>
          </div>
        </div>

        {/* Main content */}
        <div className="login-left-content">
          <div className="login-sale-badge">
            <span className="login-sale-star">✦</span>
            <span className="login-sale-text">Summer Sale 2026</span>
          </div>

          <div className="login-headline-block">
            <span className="login-upto">Up to</span>
            <div className="login-percent">70% Off</div>
            <span className="login-everything">Everything</span>
          </div>

          <p className="login-subtext">Shop Electronics, Fashion, Home &amp; Beauty</p>

          <div className="login-features">
            {LOGIN_FEATURES.map((text, i) => (
              <div className="login-feature-row" key={i}>
                <div className="login-feature-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2.67 8L6 11.33L13.33 4" stroke="#FFFFFF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="login-feature-text">{text}</span>
              </div>
            ))}
          </div>

          <div className="login-pills-container">
            {CATEGORIES.map(({ label, left, top, width }, i) => (
              <div
                className="login-pill"
                key={i}
                style={{ left: `${left}px`, top: `${top}px`, width: `${width}px` }}
              >
                <span className="login-pill-text">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating product cards — direct child of login-left so right/top are panel-relative */}
        <div className="login-cards-wrapper">
          <div className="login-card-earbuds">
            <div className="login-card-earbuds-inner">
              <div className="login-product-img-placeholder" style={{ height: '128px' }} />
              <div className="login-discount-badge" style={{ top: '4.63px', left: '-0.1px' }}>
                <span className="login-discount-text">48% off</span>
              </div>
              <div className="login-product-name">Wireless Earbuds Pro</div>
              <div className="login-price-row">
                <span className="login-product-price">$49.99</span>
                <span className="login-product-original-price">$90.99</span>
              </div>
              <button className="login-add-to-cart">Add to Cart</button>
            </div>
          </div>
          <div className="login-card-smartwatch">
            <div className="login-card-smartwatch-inner">
              <div className="login-product-img-placeholder" style={{ height: '112px' }} />
              <div className="login-product-name">Smart Watch</div>
              <div style={{ padding: '8px 0 12px' }}>
                <span className="login-product-price">$129.99</span>
              </div>
              <button className="login-add-to-cart">Add to Cart</button>
            </div>
          </div>
        </div>

        {/* Trust bar */}
        <div className="login-trust-bar">
          <div className="login-trust-item" style={{ left: '46px' }}>
            <span className="login-trust-emoji">🔒</span>
            <span className="login-trust-label">256-bit SSL Encryption</span>
          </div>
          <div className="login-trust-item" style={{ left: '293px' }}>
            <span className="login-trust-emoji">🛡️</span>
            <span className="login-trust-label">Buyer Protection</span>
          </div>
          <div className="login-trust-item" style={{ left: '506px' }}>
            <span className="login-trust-emoji">⭐</span>
            <span className="login-trust-label">4.8/5 Rating</span>
          </div>
        </div>
      </div>
    );
  }

  /* ── SIGNUP VARIANT (unchanged) ── */
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden p-8 text-white lg:flex bg-[linear-gradient(to_bottom_right,#0D1B4B,#1A3A8F,#2874F0)]">
      <div className="flex items-center gap-3">
        <Logo size="md" tone="dark" />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90">
          <span className="h-2 w-2 shrink-0 rounded-full bg-[#22C55E]" />
          Trusted by 5M+ shoppers
        </span>
      </div>

      <div className="my-8">
        <span className="text-sm text-blue-200">New here?</span>
        <h2 className="mt-4 text-4xl font-extrabold leading-tight">Join ShopHub Today</h2>
        <p className="mt-3 text-sm text-blue-100">Your one-stop shop for everything you love.</p>

        <ul className="mt-6 space-y-3">
          {SIGNUP_FEATURES.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500">
                <Icon size={13} />
              </span>
              {label}
            </li>
          ))}
        </ul>

        <div className="mt-8 grid grid-cols-3 gap-3">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-xl bg-white/10 p-4 text-center backdrop-blur-sm">
              <p className="text-2xl font-extrabold">{s.value}</p>
              <p className="mt-1 text-[11px] text-blue-100">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/15 pt-4 text-xs text-blue-100">
        {FOOTER_SIGNUP.map(({ icon: Icon, label, starred }) => (
          <span key={label} className="flex items-center gap-1.5">
            <Icon size={13} className={starred ? "fill-amber-300 text-amber-300" : ""} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
