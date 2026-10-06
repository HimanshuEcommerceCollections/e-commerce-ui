import type { Metadata } from "next";
import { DayloraInfoPage } from "@/components/daylora/shop/DayloraInfoPage";

export const metadata: Metadata = { title: "Accessibility · Ecommerce Collections" };

export default function AccessibilityPage() {
  return (
    <DayloraInfoPage
      eyebrow="Legal"
      title="Accessibility"
      intro="We design Ecommerce Collections to work for everyone, on every device."
      draft
    />
  );
}
