import type { Metadata } from "next";
import { SellerApplication } from "@/components/daylora/sell/SellerApplication";
import { BRAND_NAME } from "@/components/daylora/dayloraData";

export const metadata: Metadata = {
  title: "Seller application",
  description: `Apply to sell on ${BRAND_NAME}: create your account, tell us about your business and upload your documents.`,
  robots: { index: false },
};

/** The supplier application: account, five-step form (saved as a draft), review status and documents. */
export default function SellApplyPage() {
  return <SellerApplication />;
}
