import { redirect } from "next/navigation";

/** Seller self-signup is replaced by the "Sell with us" application form. */
export default function SellerSignupPage() {
  redirect("/sell");
}
