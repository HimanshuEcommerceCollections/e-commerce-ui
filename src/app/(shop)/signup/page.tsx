import { redirect } from "next/navigation";

/** Kept for old links: account creation lives on the sign-in page. */
export default function SignupPage({ searchParams }: { searchParams: { next?: string } }) {
  const next = searchParams.next ? `&next=${encodeURIComponent(searchParams.next)}` : "";
  redirect(`/login?mode=create${next}`);
}
