import type { Metadata } from "next";
import { DayloraHomePage } from "@/components/daylora/DayloraHomePage";

export const metadata: Metadata = {
  title: "Ecommerce Collections — Everything you need, every day",
  description:
    "Over 1,000 everyday essentials — clothing, electronics, home, grocery, beauty and more — at prices that make sense. Free shipping on orders $35+ and free 30-day returns.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return <DayloraHomePage />;
}
