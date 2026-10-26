import type { Metadata } from "next";
import { Account } from "@/components/daylora/account/Account";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };

/** Your account (design: your-account, FR-ST-12): overview, shopping and settings sections by #hash. */
export default function AccountPage() {
  return <Account />;
}
