import { Suspense } from "react";
import type { Metadata } from "next";
import { DayloraConfirmation } from "@/components/daylora/shop/DayloraConfirmation";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };

export default function OrderConfirmationPage({ params }: { params: { orderNumber: string } }) {
  return (
    <Suspense fallback={null}>
      <DayloraConfirmation orderNumber={decodeURIComponent(params.orderNumber)} />
    </Suspense>
  );
}
