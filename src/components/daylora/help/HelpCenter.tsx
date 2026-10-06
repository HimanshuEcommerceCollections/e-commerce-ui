"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { DayloraIcon } from "../DayloraIcons";
import { useStoreConfigState } from "@/hooks/useStoreConfig";
import type { StoreConfig } from "@/services/public/store.service";
import { useAuthStore } from "@/store/useAuthStore";
import supportService from "@/services/public/support.service";
import { getApiErrorMessage } from "@/lib/apiError";
import { HELP_TOPICS, helpTopicTitle, type HelpTopic } from "./helpTopics";

/* =====================================================================
   Help center (design 10): /help?t=home|shipping|returns|faq|contact|privacy|terms
   Shipping fees, the free-shipping threshold, delivery times and the return
   window come from GET /api/store/config, so this page never contradicts checkout.
   ===================================================================== */

const ACCOUNT_ORDERS = "/account#orders";

/* ---------------------------------------------------------------- policy */

interface Policy {
  /** "$35", or null when standard shipping is never free. */
  threshold: string | null;
  options: { name: string; delivery: string; fee: string; freeOver: boolean }[];
  returnDays: number;
}

function money(n: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function toPolicy(c: StoreConfig): Policy {
  const threshold = c.freeShippingThreshold != null ? money(c.freeShippingThreshold, c.currency) : null;
  return {
    threshold,
    returnDays: c.returnWindowDays,
    options: c.shippingOptions.map((o) => ({
      name: o.label.replace(/\s+shipping$/i, ""),
      delivery: o.estimatedDelivery,
      fee: o.fee > 0 ? money(o.fee, c.currency) : "Free",
      // CONTRACT §3: only Standard becomes free at the threshold.
      freeOver: o.method === "STANDARD" && threshold != null,
    })),
  };
}

/** A policy value, or a placeholder while the store config loads. */
function Val({ p, children }: { p: Policy | null; children: (p: Policy) => ReactNode }) {
  return p ? <>{children(p)}</> : <span className="skel-txt" aria-label="Loading" />;
}

/* ---------------------------------------------------------------- FAQs */

type Part = string | { t: string; href: string };
interface Faq {
  id: string;
  q: string;
  a: Part[];
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

const faq = (q: string, ...a: Part[]): Faq => ({ id: slug(q), q, a });
const plain = (a: Part[]) => a.map((x) => (typeof x === "string" ? x : x.t)).join("");

function faqGroups(p: Policy | null): [string, Faq[]][] {
  const window = p ? `within ${p.returnDays} days of delivery` : "within the return window";
  return [
    [
      "Orders & payment",
      [
        faq(
          "What payment methods do you accept?",
          "Visa, Mastercard, American Express, Discover, Apple Pay and Google Pay, through our secure payment provider. We never see or store your card number.",
        ),
        faq(
          "Can I change or cancel my order?",
          "You can cancel an order from ",
          { t: "Your orders", href: ACCOUNT_ORDERS },
          " until it ships. After that you can return it once it arrives.",
        ),
        faq(
          "Why was I charged sales tax?",
          "We collect sales tax where the law requires it. Tax is worked out for each item and shown before you place your order.",
        ),
      ],
    ],
    [
      "Shipping & delivery",
      [
        faq(
          "When will my order ship?",
          "Orders placed by 2 PM ET on a business day usually ship the same day. Your confirmation email shows the estimated delivery date.",
        ),
        faq(
          "How do I track my package?",
          "We email a tracking link when your order ships. You can also ",
          { t: "track an order", href: "/track" },
          " with your order number, or see it in ",
          { t: "Your orders", href: ACCOUNT_ORDERS },
          ".",
        ),
        faq(
          "My package says delivered but I can't find it.",
          "Check around your door, with neighbors and your mailbox. If it hasn't turned up within 2 days, ",
          { t: "contact us", href: "/help?t=contact" },
          " and we'll send a replacement or refund.",
        ),
        faq("Do you ship outside the US?", "Not yet. We ship to all 50 states and Washington, DC."),
      ],
    ],
    [
      "Returns & refunds",
      [
        faq(
          "How do I return something?",
          "Go to ",
          { t: "Your orders", href: ACCOUNT_ORDERS },
          `, choose Return items, and pick drop-off or pickup. Returns are free ${window}.`,
        ),
        faq(
          "When will I get my refund?",
          "Within 5–7 business days after we receive your return, to your original payment method.",
        ),
        faq(
          "What can't be returned?",
          "Opened grocery and personal care items, and anything marked Final sale. Damaged or wrong items can always be returned.",
        ),
      ],
    ],
    [
      "Your account",
      [
        faq(
          "Do I need an account to order?",
          "No. You can check out as a guest and create an account afterwards with just a password.",
        ),
        faq(
          "I forgot my password.",
          "Use Forgot password on the ",
          { t: "sign-in page", href: "/login" },
          ". We'll email you a link that works for 1 hour.",
        ),
        faq(
          "How do I delete my account?",
          { t: "Contact us", href: "/help?t=contact" },
          " and choose Account as the topic. We'll confirm by email and delete your data within 30 days.",
        ),
      ],
    ],
  ];
}

const words = (v: string) =>
  v
    .toLowerCase()
    .split(/\s+/)
    .filter((x) => x.length > 1);
const matches = (f: Faq, w: string[]) => {
  const hay = `${f.q} ${plain(f.a)}`.toLowerCase();
  return w.every((k) => hay.includes(k));
};

function Highlight({ text, w }: { text: string; w: string[] }) {
  if (!w.length) return <>{text}</>;
  const re = new RegExp(`(${w.map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "ig");
  return (
    <>
      {text.split(re).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : <Fragment key={i}>{part}</Fragment>))}
    </>
  );
}

function Answer({ a }: { a: Part[] }) {
  return (
    <>
      {a.map((x, i) => (typeof x === "string" ? <Fragment key={i}>{x}</Fragment> : <Link key={i} href={x.href}>{x.t}</Link>))}
    </>
  );
}

function FaqItem({ f, w = [], open }: { f: Faq; w?: string[]; open?: boolean }) {
  return (
    <details className="faq" id={f.id} open={open}>
      <summary>
        <span>
          <Highlight text={f.q} w={w} />
        </span>
        <DayloraIcon name="chev" />
      </summary>
      <div className="a">
        <Answer a={f.a} />
      </div>
    </details>
  );
}

/* ---------------------------------------------------------------- pages */

function HomePage({ p }: { p: Policy | null }) {
  const [q, setQ] = useState("");
  const groups = faqGroups(p);
  const all = groups.flatMap(([g, qs]) => qs.map((f) => ({ g, f })));
  const w = words(q);
  const results = w.length ? all.filter((x) => matches(x.f, w)).slice(0, 5) : [];
  const byId = Object.fromEntries(all.map((x) => [x.f.id, x.f]));
  const popular = ["how-do-i-track-my-package", "how-do-i-return-something", "can-i-change-or-cancel-my-order", "when-will-my-order-ship"]
    .map((id) => byId[id])
    .filter(Boolean);
  const topics: [string, string, string, ReactNode][] = [
    ["/track", "truck", "Track an order", "See where it is"],
    ["/help?t=shipping", "truck", "Shipping", "Rates and delivery times"],
    ["/help?t=returns", "return", "Returns", <Val key="r" p={p}>{(x) => `Free for ${x.returnDays} days`}</Val>],
    ["/help?t=faq", "search", "FAQs", "Quick answers"],
    ["/help?t=contact", "headset", "Contact us", "Send us a message"],
  ];
  return (
    <>
      <section className="help-hero" aria-labelledby="hh">
        <h1 id="hh">How can we help?</h1>
        <p>Search our help articles or pick a topic.</p>
        <label className="hsearch">
          <DayloraIcon name="search" />
          <span className="sr-only">Search help</span>
          <input
            type="search"
            placeholder="e.g. return, tracking, sales tax"
            autoComplete="off"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <div className="results" aria-live="polite">
          {w.length > 0 &&
            (results.length ? (
              results.map(({ g, f }) => (
                <Link key={f.id} href={`/help?t=faq#${f.id}`}>
                  <b>
                    <Highlight text={f.q} w={w} />
                  </b>
                  <small>{g}</small>
                </Link>
              ))
            ) : (
              <p>
                No articles match “{q}”. <Link href="/help?t=contact">Contact us</Link> and we&apos;ll help.
              </p>
            ))}
        </div>
      </section>
      <div className="topics">
        {topics.map(([href, icon, title, sub]) => (
          <Link key={title} className="topic" href={href}>
            <DayloraIcon name={icon} />
            <b>{title}</b>
            <span>{sub}</span>
          </Link>
        ))}
      </div>
      <div className="faq-g" style={{ marginTop: 24 }}>
        <h2>Popular questions</h2>
        {popular.map((f) => (
          <FaqItem key={f.id} f={f} />
        ))}
      </div>
    </>
  );
}

function ShippingPage({ p, failed }: { p: Policy | null; failed: boolean }) {
  return (
    <>
      <h1>Shipping</h1>
      <p className="lead">
        {p?.threshold && <>Free standard shipping on orders of {p.threshold} or more. </>}
        Every order gets tracking.
      </p>
      {failed ? (
        <ConfigError />
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Option</th>
                <th>Delivery</th>
                {p && !p.threshold ? (
                  <th>Price</th>
                ) : (
                  <>
                    <th>
                      Under <Val p={p}>{(x) => x.threshold}</Val>
                    </th>
                    <th>
                      <Val p={p}>{(x) => x.threshold}</Val> and over
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {p
                ? p.options.map((o) => (
                    <tr key={o.name}>
                      <td>
                        <b>{o.name}</b>
                      </td>
                      <td>{o.delivery}</td>
                      <td>{o.fee}</td>
                      {p.threshold && (o.freeOver ? <td className="free">Free</td> : <td>{o.fee}</td>)}
                    </tr>
                  ))
                : [0, 1].map((i) => (
                    <tr key={i}>
                      {[0, 1, 2, 3].map((j) => (
                        <td key={j}>
                          <span className="skel-txt" aria-hidden="true" />
                        </td>
                      ))}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}
      <h2>When your order ships</h2>
      <p>
        Orders placed by 2 PM ET on a business day (Monday–Friday, excluding federal holidays) usually ship the same day.
        Delivery times start once your order ships.
      </p>
      <h2>Where we ship</h2>
      <ul>
        <li>All 50 states and Washington, DC</li>
        <li>P.O. boxes with Standard shipping only</li>
        <li>APO/FPO and international addresses aren&apos;t available yet</li>
      </ul>
      <h2>Tracking your order</h2>
      <p>
        We email you a tracking link as soon as your order ships. You can also <Link href="/track">track an order</Link> with
        your order number and ZIP code.
      </p>
      <div className="note">
        <DayloraIcon name="alert" />
        <span>Some orders arrive in more than one package. Each package gets its own tracking link.</span>
      </div>
    </>
  );
}

function ConfigError() {
  return (
    <div className="alert err" role="alert">
      <DayloraIcon name="alert" />
      <p>We couldn&apos;t load our current rates. The rates shown at checkout always apply. Please refresh to try again.</p>
    </div>
  );
}

function ReturnsPage({ p, failed }: { p: Policy | null; failed: boolean }) {
  return (
    <>
      <h1>Returns &amp; refunds</h1>
      <p className="lead">
        Free returns within <Val p={p}>{(x) => `${x.returnDays} days`}</Val> of delivery.
      </p>
      {failed && <ConfigError />}
      <ol className="steps-n">
        <li>
          <b>Start your return</b>In <Link href={ACCOUNT_ORDERS}>Your orders</Link>, choose the items and a reason.
        </li>
        <li>
          <b>Drop it off</b>Choose drop-off or a scheduled pickup. We&apos;ll email you the details.
        </li>
        <li>
          <b>Get your refund</b>Within 5–7 business days after we receive it.
        </li>
      </ol>
      <h2>What can be returned</h2>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Category</th>
              <th>Condition</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Clothing</td>
              <td>Unworn, unwashed, with tags attached</td>
            </tr>
            <tr>
              <td>Electronics, home, toys, sports</td>
              <td>In original condition and packaging, with all parts</td>
            </tr>
            <tr>
              <td>Grocery, beauty and personal care</td>
              <td>Unopened only, for hygiene and safety</td>
            </tr>
            <tr>
              <td>Books and stationery</td>
              <td>Unused and in resalable condition</td>
            </tr>
          </tbody>
        </table>
      </div>
      <h2>Can&apos;t be returned</h2>
      <ul>
        <li>Opened grocery, beauty and personal care items</li>
        <li>Items marked Final sale</li>
        <li>Gift cards</li>
      </ul>
      <h2>Damaged or wrong item?</h2>
      <p>
        Let us know within 7 days of delivery with a photo and we&apos;ll send a replacement or refund, including any shipping
        you paid. <Link href="/help?t=contact">Contact us</Link>.
      </p>
      <h2>Exchanges</h2>
      <p>
        To get a different size or color, return the item and place a new order. That&apos;s the fastest way to get the one you
        want.
      </p>
    </>
  );
}

function FaqPage({ p }: { p: Policy | null }) {
  const [q, setQ] = useState("");
  const [hash, setHash] = useState("");
  const groups = faqGroups(p);
  const w = words(q);
  const shown = w.length
    ? groups.map(([g, qs]) => [g, qs.filter((f) => matches(f, w))] as [string, Faq[]]).filter(([, qs]) => qs.length)
    : groups;

  // Deep links from help search (/help?t=faq#<question>) open and scroll to that question.
  useEffect(() => {
    const sync = () => setHash(decodeURIComponent(window.location.hash.slice(1)));
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el instanceof HTMLDetailsElement) {
      el.open = true;
      el.scrollIntoView({ block: "start" });
      el.querySelector("summary")?.focus({ preventScroll: true });
    }
  }, [hash]);

  return (
    <>
      <h1>FAQs</h1>
      <label className="hsearch boxed">
        <DayloraIcon name="search" />
        <span className="sr-only">Search FAQs</span>
        <input type="search" placeholder="Search questions" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      <div aria-live="polite">
        {shown.length ? (
          shown.map(([g, qs]) => (
            <div className="faq-g" key={g}>
              <h2>{g}</h2>
              {qs.map((f) => (
                <FaqItem key={`${f.id}-${w.length > 0}`} f={f} w={w} open={w.length > 0 || undefined} />
              ))}
            </div>
          ))
        ) : (
          <p>
            No questions match “{q}”. <Link href="/help?t=contact">Contact us</Link>.
          </p>
        )}
      </div>
    </>
  );
}

const CONTACT_TOPICS = [
  "Where is my order?",
  "Returns and refunds",
  "Damaged or wrong item",
  "Payment or billing",
  "Product question",
  "Account",
  "Something else",
];

type ContactField = "name" | "email" | "topic" | "message";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const CONTACT_RULES: Record<ContactField, (v: string) => boolean> = {
  name: (v) => !!v.trim(),
  email: (v) => EMAIL_RE.test(v.trim()),
  topic: (v) => !!v,
  message: (v) => v.trim().length >= 10,
};
const ORDER: ContactField[] = ["name", "email", "topic", "message"];

function ContactPage() {
  const user = useAuthStore((s) => s.user);
  const [v, setV] = useState({ name: "", email: "", topic: "", orderNumber: "", message: "" });
  const [bad, setBad] = useState<Partial<Record<ContactField, string | true>>>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<{ ticket: string; email: string } | null>(null);
  const refs = useRef<Partial<Record<ContactField, HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null>>>({});
  const okRef = useRef<HTMLDivElement>(null);
  const prefilled = useRef(false);

  // Signed-in customers: prefill name and email (after the auth store hydrates).
  useEffect(() => {
    if (user && !prefilled.current) {
      prefilled.current = true;
      setV((s) => ({ ...s, name: s.name || user.fullName || "", email: s.email || user.email || "" }));
    }
  }, [user]);

  useEffect(() => {
    if (sent) okRef.current?.focus();
  }, [sent]);

  const set = (k: keyof typeof v, value: string) => {
    setV((s) => ({ ...s, [k]: value }));
    if (k !== "orderNumber" && bad[k]) setBad((b) => ({ ...b, [k]: CONTACT_RULES[k](value) ? undefined : true }));
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const next: Partial<Record<ContactField, true>> = {};
    for (const k of ORDER) if (!CONTACT_RULES[k](v[k])) next[k] = true;
    setBad(next);
    const first = ORDER.find((k) => next[k]);
    if (first) {
      refs.current[first]?.focus();
      return;
    }
    setSending(true);
    try {
      const res = await supportService.sendMessage({
        name: v.name.trim(),
        email: v.email.trim(),
        topic: v.topic,
        orderNumber: v.orderNumber.trim().toUpperCase() || undefined,
        message: v.message.trim(),
      });
      setSent({ ticket: res.data.data?.ticketNumber ?? "", email: v.email.trim() });
    } catch (err) {
      // 400s carry per-field messages; show them on the matching fields.
      const data = (err as { response?: { data?: { data?: Record<string, string> } } })?.response?.data?.data;
      const fieldErrs: Partial<Record<ContactField, string>> = {};
      if (data && typeof data === "object") for (const k of ORDER) if (typeof data[k] === "string") fieldErrs[k] = data[k];
      if (Object.keys(fieldErrs).length) {
        setBad(fieldErrs);
        refs.current[ORDER.find((k) => fieldErrs[k])!]?.focus();
      } else {
        setError(getApiErrorMessage(err, "We couldn't send your message. Please try again."));
      }
    } finally {
      setSending(false);
    }
  }

  const errText = (k: ContactField, fallback: string) => (typeof bad[k] === "string" ? (bad[k] as string) : fallback);
  const fieldCls = (k: ContactField) => `field${bad[k] ? " bad" : ""}`;

  return (
    <>
      <h1>Contact us</h1>
      <p className="lead">We usually reply within 1 business day. For order questions, have your order number ready.</p>
      <div className="contact-grid">
        {sent ? (
          <div className="card cform">
            <div className="alert ok" role="status" tabIndex={-1} ref={okRef}>
              <DayloraIcon name="check" />
              <span>
                <b>Message sent.{sent.ticket && <> Your ticket number is {sent.ticket}.</>}</b>
                <br />
                We&apos;ll reply to {sent.email} within 1 business day.
              </span>
            </div>
            <Link href="/" className="btn btn-secondary">
              Continue shopping
            </Link>
          </div>
        ) : (
          <form className="card cform" noValidate onSubmit={submit} aria-label="Contact us">
            <div className="row2">
              <div className={fieldCls("name")}>
                <label htmlFor="cName">Name</label>
                <input
                  id="cName"
                  autoComplete="name"
                  maxLength={200}
                  value={v.name}
                  onChange={(e) => set("name", e.target.value)}
                  aria-invalid={!!bad.name}
                  aria-describedby="cName-err"
                  ref={(el) => {
                    refs.current.name = el;
                  }}
                />
                <p className="err" id="cName-err">
                  {errText("name", "Enter your name.")}
                </p>
              </div>
              <div className={fieldCls("email")}>
                <label htmlFor="cEmail">Email</label>
                <input
                  id="cEmail"
                  type="email"
                  autoComplete="email"
                  maxLength={255}
                  value={v.email}
                  onChange={(e) => set("email", e.target.value)}
                  aria-invalid={!!bad.email}
                  aria-describedby="cEmail-err"
                  ref={(el) => {
                    refs.current.email = el;
                  }}
                />
                <p className="err" id="cEmail-err">
                  {errText("email", "Enter an email like name@example.com.")}
                </p>
              </div>
            </div>
            <div className="row2">
              <div className={fieldCls("topic")}>
                <label htmlFor="cTopic">Topic</label>
                <select
                  id="cTopic"
                  value={v.topic}
                  onChange={(e) => set("topic", e.target.value)}
                  aria-invalid={!!bad.topic}
                  aria-describedby="cTopic-err"
                  ref={(el) => {
                    refs.current.topic = el;
                  }}
                >
                  <option value="">Choose a topic</option>
                  {CONTACT_TOPICS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <p className="err" id="cTopic-err">
                  {errText("topic", "Choose a topic.")}
                </p>
              </div>
              <div className="field">
                <label htmlFor="cOrder">
                  Order number <span className="opt">(optional)</span>
                </label>
                <input
                  id="cOrder"
                  placeholder="EC-4821907"
                  autoCapitalize="characters"
                  maxLength={40}
                  value={v.orderNumber}
                  onChange={(e) => set("orderNumber", e.target.value)}
                />
              </div>
            </div>
            <div className={fieldCls("message")}>
              <label htmlFor="cMsg">How can we help?</label>
              <textarea
                id="cMsg"
                maxLength={1500}
                value={v.message}
                onChange={(e) => set("message", e.target.value)}
                aria-invalid={!!bad.message}
                aria-describedby="cCount cMsg-err"
                ref={(el) => {
                  refs.current.message = el;
                }}
              />
              <p className="hint" id="cCount">
                {v.message.length.toLocaleString("en-US")} / 1,500
              </p>
              <p className="err" id="cMsg-err">
                {errText("message", "Tell us a little about the problem (at least 10 characters).")}
              </p>
            </div>
            {error && (
              <div className="alert err" role="alert">
                <DayloraIcon name="alert" />
                <p>{error}</p>
              </div>
            )}
            <button className="btn btn-primary" type="submit" disabled={sending}>
              {sending ? "Sending…" : "Send message"}
            </button>
          </form>
        )}
        <div className="ways">
          <div className="way">
            <DayloraIcon name="headset" />
            <span>
              <b>Live chat</b>8 AM – 8 PM ET, 7 days a week
            </span>
          </div>
          <div className="way">
            <DayloraIcon name="truck" />
            <span>
              <b>Where&apos;s my order?</b>
              <Link href="/track">Track an order</Link> for the latest update
            </span>
          </div>
          <div className="way">
            <DayloraIcon name="return" />
            <span>
              <b>Need to return something?</b>Start it in <Link href={ACCOUNT_ORDERS}>Your orders</Link>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

const DRAFT_NOTE = "This is a summary. The full legal wording will be published before launch.";

function PrivacyPage() {
  return (
    <>
      <h1>Privacy policy</h1>
      <p className="draft">{DRAFT_NOTE}</p>
      <p className="lead">How we collect, use and protect your information when you shop with us.</p>
      <h2>What we collect</h2>
      <p>
        Your name, email, shipping address, phone number and order history. Card payments are handled by our payment
        provider; we never store full card numbers.
      </p>
      <h2>How we use it</h2>
      <ul>
        <li>To process and deliver your orders</li>
        <li>To send order and delivery updates</li>
        <li>To send marketing emails, only if you opt in</li>
      </ul>
      <section id="dns" style={{ display: "contents" }}>
        <h2 id="choices">Your privacy choices</h2>
        <p>
          California and other state residents can ask to see, correct or delete their data, and can opt out of the sale or
          sharing of personal information. <Link href="/help?t=contact">Contact us</Link> to make a request.
        </p>
      </section>
    </>
  );
}

function TermsPage() {
  return (
    <>
      <h1>Terms of use</h1>
      <p className="draft">{DRAFT_NOTE}</p>
      <h2>Orders and pricing</h2>
      <p>
        Prices are in US dollars. We confirm your order by email. If an item is priced incorrectly, we&apos;ll contact you
        before shipping.
      </p>
      <h2>Returns</h2>
      <p>
        See our <Link href="/help?t=returns">Returns &amp; refunds</Link> policy.
      </p>
      <h2>Your account</h2>
      <p>Keep your password private. You&apos;re responsible for orders placed from your account.</p>
    </>
  );
}

/* ---------------------------------------------------------------- shell */

export function HelpCenter({ topic }: { topic: HelpTopic }) {
  const { config, failed } = useStoreConfigState();
  const p = useMemo(() => (config ? toPolicy(config) : null), [config]);
  const home = topic === "home";

  let body: ReactNode;
  switch (topic) {
    case "shipping":
      body = <ShippingPage p={p} failed={failed} />;
      break;
    case "returns":
      body = <ReturnsPage p={p} failed={failed} />;
      break;
    case "faq":
      body = <FaqPage p={p} />;
      break;
    case "contact":
      body = <ContactPage />;
      break;
    case "privacy":
      body = <PrivacyPage />;
      break;
    case "terms":
      body = <TermsPage />;
      break;
    default:
      body = <HomePage p={p} />;
  }

  return (
    <main id="main" className="help">
      <div className="daylora-container">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <DayloraIcon name="chev" />
          {home ? (
            <span aria-current="page">Help</span>
          ) : (
            <>
              <Link href="/help">Help</Link>
              <DayloraIcon name="chev" />
              <span aria-current="page">{helpTopicTitle(topic)}</span>
            </>
          )}
        </nav>
        <div className={`help-grid${home ? "" : " side"}`}>
          <aside className="hnav-wrap" aria-label="Help topics">
            <nav className="hnav">
              {HELP_TOPICS.map(([k, t]) => (
                <Link key={k} href={k === "home" ? "/help" : `/help?t=${k}`} aria-current={k === topic ? "page" : undefined}>
                  {t}
                </Link>
              ))}
            </nav>
          </aside>
          <div className={`help-main${home ? " wide" : ""}`} key={topic}>
            {body}
          </div>
        </div>
      </div>
    </main>
  );
}
