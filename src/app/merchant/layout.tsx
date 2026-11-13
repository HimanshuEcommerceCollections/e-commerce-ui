import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SellerGate } from "@/components/seller/SellerGate";
import "../seller-portal.css";

export const metadata: Metadata = {
  title: { default: "Seller Portal", template: "%s · Seller Portal" },
  robots: { index: false, follow: false },
};

/** The seller portal: its own shell, outside the storefront's header and footer. */
export default function MerchantLayout({ children }: { children: ReactNode }) {
  return (
    <div className="sp">
      <SellerGate>{children}</SellerGate>
    </div>
  );
}
