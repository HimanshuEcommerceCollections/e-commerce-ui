import type { Metadata } from "next";
import { Account } from "@/components/daylora/account/Account";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };

/** Orders, addresses and account details (design 08, FR-ST-12). #orders #addresses #details */
export default function AccountPage() {
  return <Account />;
}
