import { Suspense } from "react";
import type { Metadata } from "next";
import { ResetPassword } from "@/components/daylora/account/ResetPassword";

export const metadata: Metadata = { title: "Reset password", robots: { index: false } };

/** The emailed password-reset link (/reset-password?token=…). */
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main id="main" className="cx pg auth" />}>
      <ResetPassword />
    </Suspense>
  );
}
