import type { Metadata } from "next";
import { DayloraInfoPage } from "@/components/daylora/shop/DayloraInfoPage";

export const metadata: Metadata = { title: "About us · Ecommerce Collections" };

export default function AboutPage() {
  return (
    <DayloraInfoPage
      eyebrow="Company"
      title="About Ecommerce Collections"
      intro="One store for everyday needs: clothing, electronics, home, grocery, beauty and more."
      draft
      sections={[
        { id: "careers", title: "Careers", body: <p>Open roles will be listed here.</p> },
        { id: "press", title: "Press", body: <p>Press releases and media resources will be listed here.</p> },
      ]}
    />
  );
}
