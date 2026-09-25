import React from "react";
import Link from "next/link";
import { BRAND_NAME, CATEGORIES } from "./dayloraData";

export function DayloraFooter() {
  const topCategories = CATEGORIES.slice(0, 5);

  return (
    <footer data-note="FR-ST-01 · Footer">
      <div className="daylora-container">
        <div className="foot-grid">
          <div className="foot-brand">
            <Link href="/" className="logo">
              <span className="logo-mark">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 3h12l3 6-9 12L3 9l3-6z" />
                </svg>
              </span>
              <span>{BRAND_NAME}</span>
            </Link>
            <p>
              One store for everyday needs: clothing, electronics, home,
              grocery, beauty and more.
            </p>
          </div>

          <div className="foot-col">
            <h2>Shop</h2>
            <ul id="footShop">
              {topCategories.map((c) => (
                <li key={c.shortName}>
                  <Link href={c.href}>{c.shortName}</Link>
                </li>
              ))}
              <li>
                <Link href="/catalog">All departments</Link>
              </li>
            </ul>
          </div>

          <div className="foot-col">
            <h2>Help</h2>
            <ul>
              <li>
                <Link href="/catalog">Track an order</Link>
              </li>
              <li>
                <Link href="/catalog">Shipping</Link>
              </li>
              <li>
                <Link href="/catalog">Returns &amp; refunds</Link>
              </li>
              <li>
                <Link href="/catalog">Contact us</Link>
              </li>
              <li>
                <Link href="/catalog">FAQs</Link>
              </li>
            </ul>
          </div>

          <div className="foot-col">
            <h2>Account</h2>
            <ul>
              <li>
                <Link href="/login">Sign in</Link>
              </li>
              <li>
                <Link href="/signup">Create account</Link>
              </li>
              <li>
                <Link href="/orders">Order history</Link>
              </li>
            </ul>
          </div>

          <div className="foot-col">
            <h2>Company</h2>
            <ul>
              <li>
                <Link href="/catalog">About us</Link>
              </li>
              <li>
                <Link href="/seller/register">Sell on {BRAND_NAME}</Link>
              </li>
              <li>
                <Link href="/catalog">Careers</Link>
              </li>
              <li>
                <Link href="/catalog">Press</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="foot-bottom">
          <div>
            <p>© 2026 {BRAND_NAME}. All rights reserved.</p>
            <div className="legal" style={{ marginTop: 8 }}>
              <Link href="/privacy">Privacy policy</Link>
              <Link href="/terms">Terms of use</Link>
              <Link href="/accessibility">Accessibility</Link>
              <Link href="/privacy#dns">
                Do not sell or share my personal information
              </Link>
            </div>
          </div>
          <div className="pay" aria-label="Accepted payment methods">
            <span>Visa</span>
            <span>Mastercard</span>
            <span>Amex</span>
            <span>Discover</span>
            <span>PayPal</span>
            <span>Apple Pay</span>
            <span>Google Pay</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
