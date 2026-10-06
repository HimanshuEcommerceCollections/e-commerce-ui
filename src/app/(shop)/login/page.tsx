import { Suspense } from "react";
import type { Metadata } from "next";
import { SignIn } from "@/components/daylora/account/SignIn";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in or create an Ecommerce Collections account to track orders, start returns and check out faster.",
  robots: { index: false },
};

/** Sign in, create account and forgot password (design 07). ?mode=create|reset, ?next=checkout|cart|track|/path */
export default function LoginPage() {
  return (
    <Suspense fallback={<main id="main" className="cx pg auth" />}>
      <SignIn />
    </Suspense>
  );
}
