import type { Metadata } from "next";
import { Account } from "@/components/daylora/account/Account";

type Props = { params: { idOrNumber: string } };

export function generateMetadata({ params }: Props): Metadata {
  return { title: `Order ${decodeURIComponent(params.idOrNumber)}`, robots: { index: false } };
}

/** One order: tracking, items, totals, returns (design 08, FR-ST-12, FR-IN-04, FR-AD-07). */
export default function AccountOrderPage({ params }: Props) {
  return <Account orderRef={decodeURIComponent(params.idOrNumber)} />;
}
