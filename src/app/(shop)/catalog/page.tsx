import { Suspense } from "react";
import type { Metadata } from "next";
import { DayloraCatalog } from "@/components/daylora/shop/DayloraCatalog";

export const metadata: Metadata = {
  title: "Shop all products · Daylora",
  description: "Browse, filter and sort everyday essentials across every Daylora department.",
};

export default function CatalogPage() {
  // useSearchParams needs a Suspense boundary for the static build.
  return (
    <Suspense fallback={<main id="main" className="plp" />}>
      <DayloraCatalog />
    </Suspense>
  );
}
