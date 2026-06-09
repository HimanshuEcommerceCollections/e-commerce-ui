import { Lock, ShieldCheck, BadgeCheck, Truck, RotateCcw } from "lucide-react";

const BADGES = {
  login: [
    { icon: Lock, title: "Secure Login", subtitle: "256-bit Encryption" },
    { icon: ShieldCheck, title: "Protected", subtitle: "Checkout" },
    { icon: BadgeCheck, title: "Verified", subtitle: "Marketplace" },
  ],
  signup: [
    { icon: Lock, title: "Secure Signup", subtitle: "256-bit Encryption" },
    { icon: Truck, title: "Free Delivery", subtitle: "On Orders $50+" },
    { icon: RotateCcw, title: "Easy Returns", subtitle: "30-Day Policy" },
  ],
};

/** Reassurance row shown beneath the auth card. */
export default function AuthTrustBadges({
  variant,
}: {
  variant: "login" | "signup";
}) {
  return (
    <div className="auth-trust">
      {BADGES[variant].map(({ icon: Icon, title, subtitle }) => (
        <div key={title} className="auth-trust-item">
          <Icon size={18} className="auth-trust-icon" />
          <span className="auth-trust-title">{title}</span>
          <span className="auth-trust-sub">{subtitle}</span>
        </div>
      ))}
    </div>
  );
}
