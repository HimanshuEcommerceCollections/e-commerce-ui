"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { DayloraIcon } from "../DayloraIcons";
import { BRAND_NAME } from "../dayloraData";
import { useDepartments } from "../shop/departments";
import { useAuth } from "@/hooks/useAuth";
import "./sell-apply.css";

/* =====================================================================
   Sell with us (design 11): the marketing page. The application itself is
   the multi-step flow at /sell/apply (design: seller-portal-application).
   ===================================================================== */

const LOOKS = ["Quality products", "Reliable stock", "Clear listings", "On-time shipping", "Fair pricing", "Helpful service"];

/** The onboarding stages, as the application shows them. */
export const ONBOARDING_STEPS: Array<[string, string]> = [
  ["Create your account", "Your name, company and email"],
  ["Tell us about your business", "Company, products, shipping, product data"],
  ["Our review", "Scorecard check by our catalog manager"],
  ["Documents", "W-9, signed agreement, insurance certificate"],
  ["Start selling", "Product upload unlocks"],
];

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function UsersIcon() {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5" />
      <path d="M15.5 4.8a3.5 3.5 0 010 6.4M18 14.8c1.8.8 3 2.5 3.5 5.2" />
    </svg>
  );
}

/** A section that animates in once it scrolls into view. */
function Reveal({ labelledBy, children }: { labelledBy: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion() || !("IntersectionObserver" in window)) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <section ref={ref} className={`blk${shown ? " in" : ""}`} aria-labelledby={labelledBy}>
      {children}
    </section>
  );
}

const vars = (i: number) => ({ "--i": i }) as React.CSSProperties;

export function SellWithUs() {
  const depts = useDepartments();
  const { isAuthenticated } = useAuth();
  // The persisted session is only known in the browser.
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => setSignedIn(isAuthenticated), [isAuthenticated]);

  return (
    <main id="main" className="sell-page">
      <section className="sell-hero">
        <div className="daylora-container">
          <div className="sell-grid">
            <div className="sell-intro">
              <span className="t-eyebrow">Sell on {BRAND_NAME}</span>
              <h1 className="t-display">Grow your business with {BRAND_NAME}</h1>
              <p>
                We&apos;re inviting a first group of suppliers across all our departments. Apply online, and once
                you&apos;re approved you can upload your products straight from the Seller Portal.
              </p>
              <ul className="benefits" aria-label="Why sell with us">
                <li>
                  <UsersIcon />
                  Reach US shoppers
                </li>
                <li>
                  <DayloraIcon name="store" />
                  Help getting listed
                </li>
                <li>
                  <DayloraIcon name="shield" />
                  Secure payments
                </li>
              </ul>
            </div>

            <div className="sell-form-wrap">
              <div className="form-card sell-cta">
                <div className="form-head">
                  <h2>Apply to sell</h2>
                  <p className="sub">Takes about 10 minutes. You can save and come back any time.</p>
                </div>
                <ol className="steps-mini" aria-label="How applying works">
                  {ONBOARDING_STEPS.map(([t, d], i) => (
                    <li key={t}>
                      <span className="d">{i + 1}</span>
                      <span>
                        <b>{t}</b>
                        <span>{d}</span>
                      </span>
                    </li>
                  ))}
                </ol>
                <Link href="/sell/apply" className="btn btn-primary btn-submit">
                  {signedIn ? "Start or continue your application" : "Start your application"}
                  <DayloraIcon name="arrow" />
                </Link>
                <p className="fine">
                  {signedIn ? (
                    "Your progress is saved to your account."
                  ) : (
                    <>
                      Already started? <Link href="/login?next=%2Fsell%2Fapply">Sign in to continue</Link>.
                    </>
                  )}
                </p>
                <p className="fine">
                  Already selling with us? <Link href="/merchant/login">Sign in to the Seller Portal</Link>.
                </p>
              </div>
            </div>

            <div className="sell-steps">
              <Reveal labelledBy="flowH">
                <h2 id="flowH">How it works</h2>
                <ol className="flow">
                  {[
                    ["Apply", "10-minute application"],
                    ["We review", "Scorecard and documents"],
                    ["Start selling", "Upload your products"],
                  ].map(([t, s], i) => (
                    <li key={t} style={vars(i)}>
                      <span className="flow-n">{i + 1}</span>
                      <strong>{t}</strong>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              </Reveal>
              <Reveal labelledBy="deptH">
                <h2 id="deptH">Sell across {depts.length} departments</h2>
                <p className="blk-sub">From denim to cookware, and everything in between.</p>
                <ul className="depts">
                  {depts.map((d, i) => (
                    <li key={d.slug} style={vars(i)}>
                      <DayloraIcon name={d.icon} />
                      {d.name}
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal labelledBy="lookH">
                <h2 id="lookH">What we look for</h2>
                <ul className="looks">
                  {LOOKS.map((t, i) => (
                    <li key={t} style={vars(i)}>
                      <svg className="tick" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M6 12.5l4 4 8-8.5" />
                      </svg>
                      {t}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
