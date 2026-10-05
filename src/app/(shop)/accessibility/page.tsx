import type { Metadata } from "next";
import { DayloraInfoPage } from "@/components/daylora/shop/DayloraInfoPage";

export const metadata: Metadata = { title: "Accessibility · Daylora" };

export default function AccessibilityPage() {
  return (
    <DayloraInfoPage
      eyebrow="Legal"
      title="Accessibility"
      intro="We design Daylora to work for everyone, on every device."
      draft
    />
  );
}
