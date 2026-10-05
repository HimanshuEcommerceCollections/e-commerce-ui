import type { Metadata } from "next";
import { DayloraInfoPage } from "@/components/daylora/shop/DayloraInfoPage";

export const metadata: Metadata = { title: "Terms of use · Daylora" };

export default function TermsPage() {
  return (
    <DayloraInfoPage
      eyebrow="Legal"
      title="Terms of use"
      intro="The terms that apply when you shop or sell on Daylora."
      draft
      sections={[{ id: "marketplace", title: "Seller terms and marketplace policies", body: <p>Terms for sellers will be published here.</p> }]}
    />
  );
}
