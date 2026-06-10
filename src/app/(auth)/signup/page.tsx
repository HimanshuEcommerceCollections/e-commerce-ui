import type { Metadata } from "next";
import SignupClient from "@/components/auth/SignupClient";

export const metadata: Metadata = {
  title: "Create Account — ShopHub",
  description: "Join ShopHub to unlock member deals, free shipping, and easy returns.",
};

export default function SignupPage() {
  return <SignupClient />;
}
