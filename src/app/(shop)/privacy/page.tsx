import { redirect } from "next/navigation";

/** The privacy policy lives in the help center. */
export default function PrivacyPage() {
  redirect("/help?t=privacy");
}
