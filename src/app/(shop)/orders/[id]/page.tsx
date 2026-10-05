import { Suspense } from "react";
import type { Metadata } from "next";
import { DayloraOrderDetail } from "@/components/daylora/shop/DayloraOrderDetail";

export const metadata: Metadata = { title: "Order · Daylora", robots: { index: false } };

/** Order confirmation (FR-ST-11) and tracking (FR-ST-12). */
export default function OrderPage({ params }: { params: { id: string } }) {
  // useSearchParams (the ?placed=1 confirmation banner) needs a Suspense boundary.
  return (
    <Suspense fallback={<main id="main" className="acct" />}>
      <DayloraOrderDetail id={params.id} />
    </Suspense>
  );
}
