import { redirect } from "next/navigation";

type Props = { params: { topic: string } };

/** Old /help/<topic> links: same pages, now at /help?t=<topic>. */
const ALIASES: Record<string, string> = { faqs: "faq" };

export default function HelpTopicRedirect({ params }: Props) {
  const t = ALIASES[params.topic] ?? params.topic;
  redirect(t === "home" ? "/help" : `/help?t=${encodeURIComponent(t)}`);
}
