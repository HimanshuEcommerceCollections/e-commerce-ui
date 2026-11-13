import { redirect } from "next/navigation";

/** The old /seller pages (profile, signup) are replaced by the Seller Portal at /merchant. */
export default function SellerRedirect() {
  redirect("/merchant");
}
