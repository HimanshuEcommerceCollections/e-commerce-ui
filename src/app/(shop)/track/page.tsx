import { Suspense } from "react";
import type { Metadata } from "next";
import { TrackOrder } from "@/components/daylora/account/TrackOrder";

export const metadata: Metadata = {
  title: "Track an order",
  description: "Track an Ecommerce Collections order with your order number and the email or ZIP code used at checkout.",
};

/** Guest order tracking (design 09, FR-ST-12, FR-IN-04). ?o=EC-1234567 prefills the order number. */
export default function TrackPage() {
  return (
    <Suspense fallback={<main id="main" className="cx pg trk" />}>
      <TrackOrder />
    </Suspense>
  );
}
