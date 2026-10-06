import type { Metadata } from "next";
import { HelpCenter } from "@/components/daylora/help/HelpCenter";
import { helpTopicTitle, isHelpTopic, type HelpTopic } from "@/components/daylora/help/helpTopics";

type Props = { searchParams: { t?: string | string[] } };

const DESCRIPTIONS: Record<HelpTopic, string> = {
  home: "Help center: shipping, returns, FAQs and how to contact us.",
  shipping: "Shipping options, delivery times and tracking for orders across the US.",
  returns: "How to return an item and when you'll get your refund.",
  faq: "Answers to the questions we hear most about orders, delivery, returns and your account.",
  contact: "Send us a message about an order, a product or a return.",
  privacy: "How we collect, use and protect your personal information.",
  terms: "The terms that apply when you shop with us.",
};

const topicOf = (t: Props["searchParams"]["t"]): HelpTopic => {
  const v = Array.isArray(t) ? t[0] : t;
  return isHelpTopic(v) ? v : "home";
};

export function generateMetadata({ searchParams }: Props): Metadata {
  const topic = topicOf(searchParams.t);
  return { title: helpTopicTitle(topic), description: DESCRIPTIONS[topic] };
}

export default function HelpPage({ searchParams }: Props) {
  return <HelpCenter topic={topicOf(searchParams.t)} />;
}
