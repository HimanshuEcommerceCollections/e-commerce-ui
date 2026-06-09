import type { Metadata } from "next";
import AuthPromoPanel from "@/components/auth/AuthPromoPanel";
import AuthTrustBadges from "@/components/auth/AuthTrustBadges";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Login — ShopHub",
  description: "Sign in to your ShopHub account to track orders and manage purchases.",
};

export default function LoginPage() {
  return (
    <div className="auth-card">
      <AuthPromoPanel variant="login" />
      <div className="auth-col">
        <LoginForm />
        <div className="auth-trust-wrap">
          <AuthTrustBadges variant="login" />
        </div>
      </div>
    </div>
  );
}
