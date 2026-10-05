import type { ReactNode } from "react";
import Link from "next/link";
import { DayloraIcon } from "../DayloraIcons";

export interface InfoSection {
  id?: string;
  title: string;
  body: ReactNode;
}

/** Simple content page (help, policies, company) in the storefront shell. */
export function DayloraInfoPage({
  eyebrow,
  title,
  intro,
  sections = [],
  draft = false,
}: {
  eyebrow: string;
  title: string;
  intro: ReactNode;
  sections?: InfoSection[];
  /** Page copy isn't written yet: shows a notice instead of placeholder text. */
  draft?: boolean;
}) {
  return (
    <main id="main" className="info">
      <div className="daylora-container">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <DayloraIcon name="chev" />
          <span aria-current="page">{title}</span>
        </nav>
        <header className="info-head">
          <span className="t-eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{intro}</p>
        </header>
        {draft && (
          <div className="info-draft" role="note">
            <DayloraIcon name="alert" />
            <p>We&apos;re still writing this page. It will be ready before launch.</p>
          </div>
        )}
        {sections.map((s) => (
          <section key={s.title} id={s.id} className="info-sec">
            <h2>{s.title}</h2>
            <div>{s.body}</div>
          </section>
        ))}
        <p className="info-back">
          <Link href="/catalog" className="link">
            Continue shopping <DayloraIcon name="arrow" />
          </Link>
        </p>
      </div>
    </main>
  );
}

/** Shipping and returns terms, as shown on the PDP design. */
export const SHIPPING_TERMS: [string, string][] = [
  ["Standard", "Free on orders $35+ · 3–5 business days"],
  ["Express", "$9.99 · 1–2 business days"],
];
export const RETURN_TERMS: [string, string][] = [
  ["Returns", "Free within 30 days. Items must be unused and in their original packaging."],
  ["Refunds", "To your original payment method, 5–7 business days after we receive the return."],
];

export function TermsTable({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="specs">
      {rows.map(([k, v]) => (
        <span key={k} style={{ display: "contents" }}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </span>
      ))}
    </dl>
  );
}
