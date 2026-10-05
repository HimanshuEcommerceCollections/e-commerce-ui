import type { Metadata } from "next";
import { DayloraInfoPage } from "@/components/daylora/shop/DayloraInfoPage";

export const metadata: Metadata = { title: "Privacy policy · Daylora" };

export default function PrivacyPage() {
  return (
    <DayloraInfoPage
      eyebrow="Legal"
      title="Privacy policy"
      intro="How we collect, use and protect your personal information."
      draft
      sections={[
        {
          id: "dns",
          title: "Do not sell or share my personal information",
          body: <p>How to opt out will be explained here.</p>,
        },
      ]}
    />
  );
}
