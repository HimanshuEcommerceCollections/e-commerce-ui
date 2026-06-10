import type { Metadata } from "next";
import LoginClient from "@/components/auth/LoginClient";

export const metadata: Metadata = {
  title: "Login — ShopHub",
  description: "Sign in to your ShopHub account to track orders and manage purchases.",
};

export default function LoginPage() {
  return <LoginClient />;
}
