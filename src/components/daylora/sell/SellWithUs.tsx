"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { DayloraIcon } from "../DayloraIcons";
import { BRAND_NAME } from "../dayloraData";
import { useDepartments } from "../shop/departments";
import supportService from "@/services/public/support.service";
import { getApiErrorMessage } from "@/lib/apiError";

/* =====================================================================
   Sell with us (design 11): seller interest form. The marketplace itself is
   Phase 2, so this only collects applications (POST /api/seller-applications).
   ===================================================================== */

const STATES = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","District of Columbia","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"]; // prettier-ignore

const LOOKS = ["Quality products", "Reliable stock", "Clear listings", "On-time shipping", "Fair pricing", "Helpful service"];

type Key = "name" | "cat" | "products" | "street" | "city" | "state" | "zip" | "email" | "phone" | "consent";

interface Values {
  name: string;
  cats: string[];
  products: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  email: string;
  phone: string;
  consent: boolean;
}

const EMPTY: Values = { name: "", cats: [], products: "", street: "", city: "", state: "", zip: "", email: "", phone: "", consent: false };

/** [field, summary label, rule, element id to focus] in form order. */
const RULES: [Key, string, (v: Values) => boolean, string][] = [
  ["name", "Full name", (v) => v.name.trim().length >= 2, "name"],
  ["cat", "Category", (v) => v.cats.length > 0, "catBtn"],
  ["products", "Products", (v) => v.products.trim().length >= 3, "products"],
  ["street", "Street address", (v) => v.street.trim().length >= 3, "street"],
  ["city", "City", (v) => v.city.trim().length >= 2, "city"],
  ["state", "State", (v) => !!v.state, "state"],
  ["zip", "ZIP code", (v) => /^\d{5}$/.test(v.zip), "zip"],
  ["email", "Email", (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim()), "email"],
  ["phone", "Contact number", (v) => v.phone.replace(/\D/g, "").length === 10, "phone"],
  ["consent", "Consent", (v) => v.consent, "consent"],
];

const MESSAGES: Record<Key, string> = {
  name: "Enter your full name",
  cat: "Choose at least one category",
  products: "Tell us which products you want to sell",
  street: "Enter your street address",
  city: "Enter your city",
  state: "Select a state",
  zip: "Enter a 5-digit ZIP",
  email: "Enter a valid email, like name@example.com",
  phone: "Enter a 10-digit US phone number",
  consent: "Please agree so we can contact you",
};

/** API field → form field, for server-side validation messages. */
const API_FIELDS: Record<string, Key> = {
  fullName: "name",
  categories: "cat",
  products: "products",
  street: "street",
  city: "city",
  state: "state",
  postalCode: "zip",
  email: "email",
  phone: "phone",
  consent: "consent",
};

const formatPhone = (raw: string) => {
  const d = raw.replace(/\D/g, "").replace(/^1/, "").slice(0, 10);
  if (d.length > 6) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length > 3) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return d.length ? `(${d}` : "";
};

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

function ErrMsg({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p className="err" id={id}>
      <DayloraIcon name="alert" />
      {children}
    </p>
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
  const [v, setV] = useState<Values>(EMPTY);
  const [invalid, setInvalid] = useState<Partial<Record<Key, string | true>>>({});
  const [touched, setTouched] = useState<Partial<Record<Key, boolean>>>({});
  const [summary, setSummary] = useState<Key[]>([]);
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [done, setDone] = useState<{ values: Values; reference: string } | null>(null);
  const ddRef = useRef<HTMLDivElement>(null);
  const ddBtn = useRef<HTMLButtonElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const rule = (k: Key) => RULES.find((r) => r[0] === k)!;
  const check = (k: Key, values: Values) => {
    const ok = rule(k)[2](values);
    setInvalid((s) => ({ ...s, [k]: ok ? undefined : true }));
    return ok;
  };

  const update = <F extends keyof Values>(field: F, value: Values[F], key: Key) => {
    const next = { ...v, [field]: value };
    setV(next);
    setTouched((t) => ({ ...t, [key]: true }));
    if (invalid[key]) check(key, next); // re-check live once a field is flagged
  };

  /** Validate a field when the user leaves it, once they've typed in it. */
  const blur = (key: Key) => (e: React.FocusEvent<HTMLElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    if (invalid[key] || touched[key]) check(key, v);
  };

  // Close the category menu on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ddRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    ddRef.current?.querySelector<HTMLInputElement>("input")?.focus();
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (!done) return;
    successRef.current?.focus({ preventScroll: true });
    cardRef.current?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
  }, [done]);

  const toggleCat = (name: string) => {
    const cats = v.cats.includes(name) ? v.cats.filter((c) => c !== name) : [...v.cats, name];
    update("cats", cats, "cat");
  };

  const focusField = (id: string) => {
    const el = document.getElementById(id);
    el?.focus({ preventScroll: true });
    el?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "center" });
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setApiError(null);
    const bad = RULES.filter((r) => !r[2](v)).map((r) => r[0]);
    setInvalid(Object.fromEntries(bad.map((k) => [k, true])));
    setSummary(bad);
    if (bad.length) {
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setSending(true);
    try {
      const res = await supportService.applyToSell({
        fullName: v.name.trim(),
        email: v.email.trim(),
        phone: v.phone,
        categories: v.cats,
        products: v.products.trim(),
        street: v.street.trim(),
        city: v.city.trim(),
        state: v.state,
        postalCode: v.zip,
        consent: true,
      });
      setDone({ values: v, reference: res.data.data?.reference ?? "" });
    } catch (err) {
      const data = (err as { response?: { data?: { data?: Record<string, unknown> } } })?.response?.data?.data;
      const fieldErrs: Partial<Record<Key, string>> = {};
      if (data && typeof data === "object")
        for (const [k, msg] of Object.entries(data)) if (API_FIELDS[k] && typeof msg === "string") fieldErrs[API_FIELDS[k]] = msg;
      const keys = RULES.map((r) => r[0]).filter((k) => fieldErrs[k]);
      if (keys.length) {
        setInvalid(fieldErrs);
        setSummary(keys);
        requestAnimationFrame(() => summaryRef.current?.focus());
      } else {
        setApiError(getApiErrorMessage(err, "We couldn't send your application. Please try again."));
      }
    } finally {
      setSending(false);
    }
  }

  const fieldCls = (k: Key) => `field${invalid[k] ? " invalid" : ""}`;
  const msg = (k: Key) => (typeof invalid[k] === "string" ? (invalid[k] as string) : MESSAGES[k]);
  const catLabel = !v.cats.length ? "Select categories" : v.cats.length > 2 ? `${v.cats.length} categories selected` : v.cats.join(", ");

  return (
    <main id="main" className="sell-page">
      <section className="sell-hero">
        <div className="daylora-container">
          <div className="sell-grid">
            <div className="sell-intro">
              <span className="t-eyebrow">Sell on {BRAND_NAME}</span>
              <h1 className="t-display">Grow your business with {BRAND_NAME}</h1>
              <p>
                We&apos;re inviting a first group of sellers across all our departments. Tell us about your business and our
                seller team will get in touch.
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
              <div className="form-card" ref={cardRef}>
                {done ? (
                  <div className="success" role="status" aria-live="polite" tabIndex={-1} ref={successRef}>
                    <span className="success-ic">
                      <DayloraIcon name="check" />
                    </span>
                    <h2>Thanks, {done.values.name.trim().split(/\s+/)[0]}!</h2>
                    <p>
                      We&apos;ve received your application. Our seller team will review it and email you at{" "}
                      <b>{done.values.email.trim()}</b>.
                    </p>
                    <dl className="recap">
                      {done.reference && (
                        <>
                          <dt>Reference</dt>
                          <dd>{done.reference}</dd>
                        </>
                      )}
                      <dt>Categories</dt>
                      <dd>{done.values.cats.join(", ")}</dd>
                      <dt>Products</dt>
                      <dd>{done.values.products.trim()}</dd>
                      <dt>Address</dt>
                      <dd>
                        {done.values.street.trim()}, {done.values.city.trim()}, {done.values.state} {done.values.zip}
                      </dd>
                      <dt>Phone</dt>
                      <dd>{done.values.phone}</dd>
                    </dl>
                    <Link href="/" className="btn btn-secondary">
                      Back to shopping
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="form-head">
                      <h2>Apply to sell</h2>
                      <p className="sub">Takes about 2 minutes. All fields are required.</p>
                    </div>
                    <form className="form" noValidate onSubmit={submit} aria-label="Apply to sell">
                      {summary.length > 0 && (
                        <div className="summary" role="alert" tabIndex={-1} ref={summaryRef}>
                          <DayloraIcon name="alert" />
                          <div>
                            <b>Please fix the following:</b>
                            <ul>
                              {summary.map((k) => {
                                const [, label, , id] = rule(k);
                                return (
                                  <li key={k}>
                                    <a
                                      href={`#${id}`}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        focusField(id);
                                      }}
                                    >
                                      {label}
                                    </a>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        </div>
                      )}

                      <div className={fieldCls("name")} onBlur={blur("name")}>
                        <label htmlFor="name">Full name</label>
                        <input
                          className="input"
                          id="name"
                          autoComplete="name"
                          placeholder="Jane Smith"
                          maxLength={200}
                          value={v.name}
                          onChange={(e) => update("name", e.target.value, "name")}
                          aria-invalid={!!invalid.name}
                          aria-describedby="e-name"
                        />
                        <ErrMsg id="e-name">{msg("name")}</ErrMsg>
                      </div>

                      <div className={fieldCls("cat")} onBlur={blur("cat")}>
                        <label id="catLabel" htmlFor="catBtn">
                          Category you sell <span className="opt-tag">(choose all that apply)</span>
                        </label>
                        <div
                          className={`dd${open ? " open" : ""}`}
                          ref={ddRef}
                          onKeyDown={(e) => {
                            if (e.key === "Escape" && open) {
                              setOpen(false);
                              ddBtn.current?.focus();
                            }
                          }}
                        >
                          <button
                            type="button"
                            className={`input dd-btn${v.cats.length ? " has-val" : ""}`}
                            id="catBtn"
                            ref={ddBtn}
                            aria-expanded={open}
                            aria-controls="catList"
                            aria-describedby="e-cat"
                            onClick={() => setOpen((o) => !o)}
                          >
                            <span className="dd-val">{catLabel}</span>
                            <DayloraIcon name="chev" className="icon dd-chev" />
                          </button>
                          <div className="dd-menu" id="catList" role="group" aria-labelledby="catLabel">
                            {depts.map((d) => (
                              <label className="dd-opt" key={d.slug}>
                                <input
                                  type="checkbox"
                                  name="category"
                                  value={d.name}
                                  checked={v.cats.includes(d.name)}
                                  onChange={() => toggleCat(d.name)}
                                />
                                <DayloraIcon name={d.icon} />
                                {d.name}
                              </label>
                            ))}
                          </div>
                        </div>
                        <ErrMsg id="e-cat">{msg("cat")}</ErrMsg>
                      </div>

                      <div className={fieldCls("products")} onBlur={blur("products")}>
                        <label htmlFor="products">Products you want to sell</label>
                        <textarea
                          className="input"
                          id="products"
                          placeholder="e.g. Men's cotton t-shirts, denim jackets, around 40 styles"
                          maxLength={2000}
                          value={v.products}
                          onChange={(e) => update("products", e.target.value, "products")}
                          aria-invalid={!!invalid.products}
                          aria-describedby="h-products e-products"
                        />
                        <p className="hint" id="h-products">
                          Tell us what you make or stock, and roughly how many products.
                        </p>
                        <ErrMsg id="e-products">{msg("products")}</ErrMsg>
                      </div>

                      <div className={fieldCls("street")} onBlur={blur("street")}>
                        <label htmlFor="street">Street address</label>
                        <input
                          className="input"
                          id="street"
                          autoComplete="address-line1"
                          placeholder="123 Main St, Suite 4"
                          maxLength={255}
                          value={v.street}
                          onChange={(e) => update("street", e.target.value, "street")}
                          aria-invalid={!!invalid.street}
                          aria-describedby="e-street"
                        />
                        <ErrMsg id="e-street">{msg("street")}</ErrMsg>
                      </div>

                      <div className={fieldCls("city")} onBlur={blur("city")}>
                        <label htmlFor="city">City</label>
                        <input
                          className="input"
                          id="city"
                          autoComplete="address-level2"
                          maxLength={100}
                          value={v.city}
                          onChange={(e) => update("city", e.target.value, "city")}
                          aria-invalid={!!invalid.city}
                          aria-describedby="e-city"
                        />
                        <ErrMsg id="e-city">{msg("city")}</ErrMsg>
                      </div>

                      <div className="row2">
                        <div className={fieldCls("state")} onBlur={blur("state")}>
                          <label htmlFor="state">State</label>
                          <select
                            className="input"
                            id="state"
                            autoComplete="address-level1"
                            value={v.state}
                            onChange={(e) => update("state", e.target.value, "state")}
                            aria-invalid={!!invalid.state}
                            aria-describedby="e-state"
                          >
                            <option value="">Select a state</option>
                            {STATES.map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                          <ErrMsg id="e-state">{msg("state")}</ErrMsg>
                        </div>
                        <div className={fieldCls("zip")} onBlur={blur("zip")}>
                          <label htmlFor="zip">ZIP code</label>
                          <input
                            className="input"
                            id="zip"
                            inputMode="numeric"
                            autoComplete="postal-code"
                            maxLength={5}
                            value={v.zip}
                            onChange={(e) => update("zip", e.target.value.replace(/\D/g, "").slice(0, 5), "zip")}
                            aria-invalid={!!invalid.zip}
                            aria-describedby="e-zip"
                          />
                          <ErrMsg id="e-zip">{msg("zip")}</ErrMsg>
                        </div>
                      </div>

                      <div className="row2">
                        <div className={fieldCls("email")} onBlur={blur("email")}>
                          <label htmlFor="email">Email</label>
                          <input
                            className="input"
                            id="email"
                            type="email"
                            autoComplete="email"
                            placeholder="jane@yourbusiness.com"
                            maxLength={255}
                            value={v.email}
                            onChange={(e) => update("email", e.target.value, "email")}
                            aria-invalid={!!invalid.email}
                            aria-describedby="e-email"
                          />
                          <ErrMsg id="e-email">{msg("email")}</ErrMsg>
                        </div>
                        <div className={fieldCls("phone")} onBlur={blur("phone")}>
                          <label htmlFor="phone">Contact number</label>
                          <input
                            className="input"
                            id="phone"
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel-national"
                            placeholder="(555) 123-4567"
                            value={v.phone}
                            onChange={(e) => update("phone", formatPhone(e.target.value), "phone")}
                            aria-invalid={!!invalid.phone}
                            aria-describedby="e-phone"
                          />
                          <ErrMsg id="e-phone">{msg("phone")}</ErrMsg>
                        </div>
                      </div>

                      <div className={fieldCls("consent")}>
                        <label className="consent">
                          <input
                            type="checkbox"
                            id="consent"
                            checked={v.consent}
                            onChange={(e) => update("consent", e.target.checked, "consent")}
                            aria-invalid={!!invalid.consent}
                            aria-describedby="e-consent"
                          />
                          <span>
                            I agree that {BRAND_NAME} can contact me about selling, and I&apos;ve read the{" "}
                            <Link href="/help?t=privacy">Privacy policy</Link>.
                          </span>
                        </label>
                        <ErrMsg id="e-consent">{msg("consent")}</ErrMsg>
                      </div>

                      {apiError && (
                        <div className="summary" role="alert">
                          <DayloraIcon name="alert" />
                          <div>{apiError}</div>
                        </div>
                      )}

                      <button type="submit" className="btn btn-primary btn-submit" disabled={sending}>
                        {sending ? "Submitting…" : "Submit application"}
                      </button>
                      <p className="fine">We&apos;ll only use these details to review your application.</p>
                    </form>
                  </>
                )}
              </div>
            </div>

            <div className="sell-steps">
              <Reveal labelledBy="flowH">
                <h2 id="flowH">How it works</h2>
                <ol className="flow">
                  {[
                    ["Apply", "2-minute form"],
                    ["We review", "We reply by email"],
                    ["Start selling", "We help you list"],
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
