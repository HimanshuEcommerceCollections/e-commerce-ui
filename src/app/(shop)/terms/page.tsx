import { redirect } from "next/navigation";

/** The terms of use live in the help center. */
export default function TermsPage() {
  redirect("/help?t=terms");
}
