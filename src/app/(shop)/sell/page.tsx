import type { Metadata } from "next";
import { SellWithUs } from "@/components/daylora/sell/SellWithUs";
import { BRAND_NAME } from "@/components/daylora/dayloraData";

export const metadata: Metadata = {
  title: `Sell on ${BRAND_NAME}`,
  description: `Apply to sell on ${BRAND_NAME}. Create your account, tell us about your business and start selling once you are approved.`,
};

export default function SellPage() {
  return <SellWithUs />;
}
