import { Suspense } from "react";
import type { Metadata } from "next";
import { DayloraCatalog } from "@/components/daylora/shop/DayloraCatalog";

/** Department names for the page title (the frozen taxonomy, CONTRACT §2). */
const DEPTS: Record<string, string> = {
  clothing: "Clothing",
  electronics: "Electronics",
  "home-kitchen": "Home & Kitchen",
  grocery: "Grocery",
  beauty: "Beauty & Personal Care",
  "books-stationery": "Books & Stationery",
  "toys-kids": "Toys & Kids",
  "sports-fitness": "Sports & Fitness",
  lifestyle: "Lifestyle",
};

type Props = { searchParams: Record<string, string | string[] | undefined> };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function generateMetadata({ searchParams }: Props): Metadata {
  const q = one(searchParams.q).trim();
  const dept = DEPTS[one(searchParams.dept).toLowerCase()];
  const title = q
    ? `Results for “${q.slice(0, 80)}”`
    : dept
      ? dept
      : one(searchParams.deals) === "1"
        ? "Today's deals"
        : one(searchParams.new) === "1"
          ? "New arrivals"
          : "All products";
  return {
    title,
    description: dept
      ? `Shop ${dept.toLowerCase()} at Ecommerce Collections: filter by type, size, colour, price and brand.`
      : "Browse, filter and sort everyday essentials across every Ecommerce Collections department.",
    // Search result pages shouldn't be indexed.
    robots: q ? { index: false, follow: true } : undefined,
  };
}

export default function CatalogPage() {
  // useSearchParams needs a Suspense boundary.
  return (
    <Suspense fallback={<main id="main" className="plp" />}>
      <DayloraCatalog />
    </Suspense>
  );
}
