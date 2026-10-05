import type { Metadata } from "next";
import { DayloraCart } from "@/components/daylora/shop/DayloraCart";

export const metadata: Metadata = { title: "Your cart · Daylora", robots: { index: false } };

export default function CartPage() {
  return <DayloraCart />;
}
