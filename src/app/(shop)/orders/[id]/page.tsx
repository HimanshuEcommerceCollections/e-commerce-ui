import { redirect } from "next/navigation";

/** Old link: one order lives in the account area now. */
export default function OrderPage({ params }: { params: { id: string } }) {
  redirect(`/account/orders/${encodeURIComponent(params.id)}`);
}
