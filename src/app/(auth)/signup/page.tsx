import type { Metadata } from "next";
import AuthPromoPanel from "@/components/auth/AuthPromoPanel";
import AuthTrustBadges from "@/components/auth/AuthTrustBadges";
import SignupForm from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Create Account — ShopHub",
  description: "Join ShopHub to unlock member deals, free shipping, and easy returns.",
};

export default function SignupPage() {
  return (
    <div className="auth-card">
      {/* Form left, promo right (mirrors the login layout) */}
      <div className="auth-col">
        <SignupForm />
        <div className="auth-trust-wrap">
          <AuthTrustBadges variant="signup" />
        </div>
      </div>
      <AuthPromoPanel variant="signup" />
    </div>
  );
}
