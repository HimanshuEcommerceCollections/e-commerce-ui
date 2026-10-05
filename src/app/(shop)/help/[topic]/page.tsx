import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  DayloraInfoPage,
  RETURN_TERMS,
  SHIPPING_TERMS,
  TermsTable,
  type InfoSection,
} from "@/components/daylora/shop/DayloraInfoPage";

interface Topic {
  title: string;
  intro: string;
  sections?: InfoSection[];
  draft?: boolean;
}

const TOPICS: Record<string, Topic> = {
  shipping: {
    title: "Shipping",
    intro: "Delivery options and times for orders across the US.",
    sections: [
      { title: "Delivery options", body: <TermsTable rows={SHIPPING_TERMS} /> },
      {
        title: "Returns",
        body: (
          <p>
            Changed your mind? See <Link href="/help/returns">returns &amp; refunds</Link>.
          </p>
        ),
      },
    ],
  },
  returns: {
    title: "Returns & refunds",
    intro: "Free 30-day returns on everything we sell.",
    sections: [{ title: "How returns work", body: <TermsTable rows={RETURN_TERMS} /> }],
  },
  contact: {
    title: "Contact us",
    intro: "Questions about an order, a product or a return? We're here to help.",
    draft: true,
  },
  faqs: {
    title: "FAQs",
    intro: "Answers to the questions we hear most.",
    sections: [
      { title: "How much is shipping?", body: <TermsTable rows={SHIPPING_TERMS} /> },
      { title: "Can I return something?", body: <TermsTable rows={RETURN_TERMS} /> },
      { title: "Is checkout secure?", body: <p>Yes. Card payments go straight to our payment provider. We never store your card details.</p> },
    ],
  },
};

type Props = { params: { topic: string } };

export function generateStaticParams() {
  return Object.keys(TOPICS).map((topic) => ({ topic }));
}

export function generateMetadata({ params }: Props): Metadata {
  const t = TOPICS[params.topic];
  return t ? { title: `${t.title} · Daylora`, description: t.intro } : {};
}

export default function HelpPage({ params }: Props) {
  const t = TOPICS[params.topic];
  if (!t) notFound();
  return <DayloraInfoPage eyebrow="Help" title={t.title} intro={t.intro} sections={t.sections} draft={t.draft} />;
}
