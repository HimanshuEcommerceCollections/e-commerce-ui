import type { Metadata } from "next";
import { DayloraOrders } from "@/components/daylora/shop/DayloraOrders";

export const metadata: Metadata = { title: "Your orders · Daylora", robots: { index: false } };

/** Order history and tracking (FR-ST-12). */
export default function OrdersPage() {
  return <DayloraOrders />;
}
