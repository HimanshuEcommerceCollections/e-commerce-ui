import { redirect } from "next/navigation";

/** Old link: order history lives in the account area now. */
export default function OrdersPage() {
  redirect("/account#orders");
}
