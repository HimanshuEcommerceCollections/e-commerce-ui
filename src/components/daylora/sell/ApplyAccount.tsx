"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { DayloraIcon } from "../DayloraIcons";
import { useAuth } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/lib/apiError";

const RULES: Array<[string, string, (p: string) => boolean]> = [
  ["len", "At least 10 characters", (p) => p.length >= 10],
  ["case", "Upper and lower case letters", (p) => /[a-z]/.test(p) && /[A-Z]/.test(p)],
  ["num", "A number", (p) => /\d/.test(p)],
];

type Key = "name" | "company" | "email" | "pw" | "agree";

/**
 * "Apply to sell with us": create the account first. It is an ordinary
 * customer account; approval later turns it into a seller account.
 */
export function ApplyAccount({ onCreated }: { onCreated: (companyName: string) => Promise<void> }) {
  const { register } = useAuth();
  const [v, setV] = useState({ name: "", company: "", email: "", pw: "", agree: false });
  const [show, setShow] = useState(false);
  const [errs, setErrs] = useState<Partial<Record<Key, string>>>({});
  const [apiError, setApiError] = useState<{ text: string; exists?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const met = RULES.map(([, , ok]) => ok(v.pw));
  const n = met.filter(Boolean).length;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setApiError(null);
    const er: Partial<Record<Key, string>> = {};
    if (v.name.trim().length < 2) er.name = "Enter your full name";
    if (v.company.trim().length < 2) er.company = "Enter your company name";
    if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) er.email = "Enter a valid email address";
    if (n < RULES.length) er.pw = "Your password needs to meet all 3 rules";
    if (!v.agree) er.agree = "You need to agree to continue";
    setErrs(er);
    const first = (["name", "company", "email", "pw", "agree"] as Key[]).find((k) => er[k]);
    if (first) {
      document.getElementById(`acc-${first}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      await register({ email: v.email.trim().toLowerCase(), password: v.pw, fullName: v.name.trim() });
      await onCreated(v.company.trim());
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setApiError(
        status === 409
          ? { text: "This email already has an account. Sign in instead.", exists: true }
          : { text: getApiErrorMessage(err, "We couldn't create your account. Please try again.") },
      );
    } finally {
      setBusy(false);
    }
  }

  const field = (k: Key) => `field${errs[k] ? " invalid" : ""}`;
  const err = (k: Key) =>
    errs[k] ? (
      <p className="err" id={`acc-${k}-e`}>
        <DayloraIcon name="alert" />
        {errs[k]}
      </p>
    ) : null;
  const described = (k: Key) => (errs[k] ? `acc-${k}-e` : undefined);

  return (
    <div className="form-card ob-auth">
      <Link className="back" href="/sell">
        <DayloraIcon name="arrow" className="icon flip" />
        Back to Sell with us
      </Link>
      <div>
        <h1 tabIndex={-1}>Apply to sell with us</h1>
        <p className="sub">Create your account first. Next, you’ll tell us about your business and we’ll review your application.</p>
      </div>
      {Object.keys(errs).some((k) => errs[k as Key]) ? (
        <div className="alert bad" role="alert">
          <DayloraIcon name="alert" />
          <span>Please fix the highlighted fields.</span>
        </div>
      ) : null}
      {apiError ? (
        <div className="alert bad" role="alert">
          <DayloraIcon name="alert" />
          <span>
            {apiError.text}{" "}
            {apiError.exists ? <Link href="/login?next=%2Fsell%2Fapply">Sign in</Link> : null}
          </span>
        </div>
      ) : null}
      <form className="form" noValidate onSubmit={submit}>
        <div className={field("name")}>
          <label htmlFor="acc-name">Your full name</label>
          <input className="input" id="acc-name" autoComplete="name" value={v.name} aria-invalid={!!errs.name} aria-describedby={described("name")} onChange={(e) => setV({ ...v, name: e.target.value })} />
          {err("name")}
        </div>
        <div className={field("company")}>
          <label htmlFor="acc-company">Company name</label>
          <input className="input" id="acc-company" autoComplete="organization" value={v.company} aria-invalid={!!errs.company} aria-describedby={described("company")} onChange={(e) => setV({ ...v, company: e.target.value })} />
          {err("company")}
        </div>
        <div className={field("email")}>
          <label htmlFor="acc-email">Business email</label>
          <input className="input" id="acc-email" type="email" autoComplete="email" value={v.email} aria-invalid={!!errs.email} aria-describedby={`acc-email-h${errs.email ? " acc-email-e" : ""}`} onChange={(e) => setV({ ...v, email: e.target.value })} />
          <span className="hint" id="acc-email-h">Use your company email, not a personal one if you can.</span>
          {err("email")}
        </div>
        <div className={field("pw")}>
          <label htmlFor="acc-pw">Create password</label>
          <span className="pw">
            <input className="input" id="acc-pw" type={show ? "text" : "password"} autoComplete="new-password" value={v.pw} aria-invalid={!!errs.pw} aria-describedby="acc-rules" onChange={(e) => setV({ ...v, pw: e.target.value })} />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>
              {show ? "Hide" : "Show"}
            </button>
          </span>
          <div className="meter" aria-hidden="true">
            <i style={{ width: `${(n / RULES.length) * 100}%`, background: n < 2 ? "#B42318" : n < 3 ? "#B54708" : "#16794C" }} />
          </div>
          <ul className="rules" id="acc-rules">
            {RULES.map(([k, label], i) => (
              <li key={k} className={met[i] ? "met" : ""}>
                {label}
              </li>
            ))}
          </ul>
          {err("pw")}
        </div>
        <div className={field("agree")}>
          <label className="consent">
            <input type="checkbox" id="acc-agree" checked={v.agree} onChange={(e) => setV({ ...v, agree: e.target.checked })} />
            <span>
              I agree to the <Link href="/terms">Seller terms</Link> and <Link href="/privacy">Privacy policy</Link>
            </span>
          </label>
          {err("agree")}
        </div>
        <button className="btn btn-primary btn-submit" disabled={busy}>
          {busy ? "Creating your account…" : "Create account"}
        </button>
      </form>
      <p className="auth-foot">
        Already have an account? <Link href="/login?next=%2Fsell%2Fapply">Sign in</Link>
      </p>
    </div>
  );
}
