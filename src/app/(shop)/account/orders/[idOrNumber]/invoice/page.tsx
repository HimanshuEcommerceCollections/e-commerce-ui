import type { Metadata } from "next";
import { Account } from "@/components/daylora/account/Account";

type Props = { params: { idOrNumber: string } };

export function generateMetadata({ params }: Props): Metadata {
  return { title: `Invoice ${decodeURIComponent(params.idOrNumber)}`, robots: { index: false } };
}

/** Printable invoice for one order (design: your-account, invoice). */
export default function AccountInvoicePage({ params }: Props) {
  return <Account orderRef={decodeURIComponent(params.idOrNumber)} invoice />;
}
