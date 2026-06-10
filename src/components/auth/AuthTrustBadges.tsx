import { Lock, Truck, RotateCcw } from "lucide-react";

const LOGIN_BADGES = [
  {
    bold: "Secure Login",
    sub: "256-bit Encryption",
    icon: (
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
        <rect x="1.5" y="7.5" width="14" height="8" rx="1.5" stroke="#2874F0" strokeWidth="1.39"/>
        <path d="M4 7.5V5a4.5 4.5 0 0 1 9 0v2.5" stroke="#2874F0" strokeWidth="1.39"/>
      </svg>
    ),
  },
  {
    bold: "Protected",
    sub: "Checkout",
    icon: (
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
        <path d="M8.5 1.5L15 4.5V9c0 3.5-2.5 5.5-6.5 6.5C4.5 14.5 2 12.5 2 9V4.5L8.5 1.5Z" stroke="#2874F0" strokeWidth="1.39"/>
      </svg>
    ),
  },
  {
    bold: "Verified",
    sub: "Marketplace",
    icon: (
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
        <path d="M3 8.5L6.5 12L14 5" stroke="#2874F0" strokeWidth="1.39" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

const SIGNUP_BADGES = [
  { icon: Lock,       title: "Secure Signup",   subtitle: "256-bit Encryption" },
  { icon: Truck,      title: "Free Delivery",   subtitle: "On Orders $50+" },
  { icon: RotateCcw,  title: "Easy Returns",    subtitle: "30-Day Policy" },
];

export default function AuthTrustBadges({ variant }: { variant: "login" | "signup" }) {
  if (variant === "login") {
    return (
      <div className="login-bottom-badges">
        {LOGIN_BADGES.map(({ bold, sub, icon }) => (
          <div className="login-badge-col" key={bold}>
            <div className="login-badge-icon-circle">{icon}</div>
            <span className="login-badge-bold">{bold}</span>
            <span className="login-badge-sub">{sub}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="auth-trust">
      {SIGNUP_BADGES.map(({ icon: Icon, title, subtitle }) => (
        <div key={title} className="auth-trust-item">
          <Icon size={18} className="auth-trust-icon" />
          <span className="auth-trust-title">{title}</span>
          <span className="auth-trust-sub">{subtitle}</span>
        </div>
      ))}
    </div>
  );
}
