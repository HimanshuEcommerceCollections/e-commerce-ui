import React from "react";
import Link from "next/link";
import { BRAND_NAME } from "./dayloraData";
import { BrandMark } from "./BrandMark";
import { PAYMENT_ICONS } from "./paymentIcons";
import { FALLBACK_DEPARTMENTS, catalogHref } from "./shop/departments";

const HELP = [
  { t: "Track an order", href: "/track" },
  { t: "Shipping", href: "/help?t=shipping" },
  { t: "Returns & refunds", href: "/help?t=returns" },
  { t: "Contact us", href: "/help?t=contact" },
  { t: "FAQs", href: "/help?t=faq" },
];

const ACCOUNT = [
  { t: "Sign in", href: "/login" },
  { t: "Create account", href: "/login?mode=create" },
  { t: "Order history", href: "/account#orders" },
];

const COMPANY = [
  { t: "About us", href: "/about" },
  { t: `Sell on ${BRAND_NAME}`, href: "/sell" },
  { t: "Seller sign in", href: "/merchant/login" },
  { t: "Careers", href: "/about#careers" },
  { t: "Press", href: "/about#press" },
];


function Column({ title, links }: { title: string; links: { t: string; href: string }[] }) {
  return (
    <div className="foot-col">
      <h2>{title}</h2>
      <ul>
        {links.map((l) => (
          <li key={l.t}>
            <Link href={l.href}>{l.t}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DayloraFooter() {
  // The taxonomy is frozen (CONTRACT §2), so the footer needs no request.
  const shop = [
    ...FALLBACK_DEPARTMENTS.slice(0, 5).map((d) => ({ t: d.shortName, href: catalogHref({ dept: d.slug }) })),
    { t: "All departments", href: "/catalog" },
  ];

  return (
    <footer data-note="FR-ST-01 · Footer">
      <div className="daylora-container">
        <div className="foot-grid">
          <div className="foot-brand">
            <Link href="/" className="logo" aria-label={`${BRAND_NAME} home`}>
              <BrandMark full />
              <span className="logo-word">{BRAND_NAME}</span>
            </Link>
            <p>One store for everyday needs: clothing, electronics, home, grocery, beauty and more.</p>
          </div>
          <Column title="Shop" links={shop} />
          <Column title="Help" links={HELP} />
          <Column title="Account" links={ACCOUNT} />
          <Column title="Company" links={COMPANY} />
        </div>

        <div className="foot-bottom">
          <div>
            <p>
              © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
            </p>
            <div className="legal" style={{ marginTop: 8 }}>
              <Link href="/help?t=privacy">Privacy policy</Link>
              <Link href="/help?t=terms">Terms of use</Link>
              <Link href="/accessibility">Accessibility</Link>
              <Link href="/help?t=privacy#dns">Do not sell or share my personal information</Link>
            </div>
          </div>
          <div className="pay" role="list" aria-label="Accepted payment methods">
            {PAYMENT_ICONS.map((m) => (
              <span key={m.label} role="listitem">
                <svg className="pm" viewBox={m.viewBox} role="img" aria-label={m.label}>
                  <title>{m.label}</title>
                  <path d={m.d} />
                </svg>
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
