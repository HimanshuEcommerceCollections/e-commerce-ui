import { Suspense } from "react";
import type { Metadata } from "next";
import { DayloraCheckout } from "@/components/daylora/shop/DayloraCheckout";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <DayloraCheckout />
    </Suspense>
  );
}
