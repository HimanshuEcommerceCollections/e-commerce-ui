import type { Metadata } from "next";
import { DayloraCheckout } from "@/components/daylora/shop/DayloraCheckout";

export const metadata: Metadata = { title: "Checkout · Daylora", robots: { index: false } };

export default function CheckoutPage() {
  return <DayloraCheckout />;
}
