import { redirect } from "next/navigation";

/** The storefront funnel (FR-IN-05) is part of Reports (design 12). */
export default function AdminAnalyticsRedirect() {
  redirect("/admin/reports");
}
