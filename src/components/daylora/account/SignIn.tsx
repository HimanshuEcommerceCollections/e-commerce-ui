"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DayloraIcon } from "../DayloraIcons";
import authService from "@/services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { getApiErrorMessage } from "@/lib/apiError";
import type { AuthResponse } from "@/types/api/auth.types";
import { PW_RULES, PW_RULE_MESSAGE, emailOk, passwordOk } from "./customerShared";

type Pane = "in" | "up" | "reset";

const TITLES: Record<Pane, string> = { in: "Sign in", up: "Create account", reset: "Reset password" };
const NEXT: Record<string, string> = { checkout: "/checkout", cart: "/cart", track: "/track", account: "/account" };

/** Where to go after signing in: `?next=checkout|cart|track|/a/path`, else the account page. */
export function nextHref(next: string | null, auth: AuthResponse): string {
  if (auth.role === "ROLE_ADMIN" || auth.role === "ROLE_CATALOG") return "/admin";
  if (!next) return "/account";
  if (NEXT[next]) return NEXT[next];
  // Same-site paths only (never "//other.site").
  if (next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")) return next;
  return "/account";
}

/** Sign in, create account and forgot password on one card (design 07). */
export function SignIn() {
  const router = useRouter();
  const qs = useSearchParams();
  const next = qs.get("next");
  const setAuth = useAuthStore((s) => s.setAuth);
  const mergeAfterLogin = useCartStore((s) => s.mergeAfterLogin);

  const [pane, setPane] = useState<Pane>(qs.get("mode") === "create" ? "up" : qs.get("mode") === "reset" ? "reset" : "in");
  const tabIn = useRef<HTMLButtonElement>(null);
  const tabUp = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.title = `${TITLES[pane]} | Ecommerce Collections`;
  }, [pane]);

  const isCheckout = next === "checkout" || next === "/checkout";

  async function finish(auth: AuthResponse) {
    setAuth(auth);
    if (auth.role === "ROLE_CUSTOMER") await mergeAfterLogin().catch(() => undefined);
    router.replace(nextHref(next, auth));
  }

  const onTabsKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const toUp = e.key === "End" ? true : e.key === "Home" ? false : pane !== "up";
    setPane(toUp ? "up" : "in");
    (toUp ? tabUp : tabIn).current?.focus();
  };

  return (
    <main id="main" className="cx pg auth">
      <div className="daylora-container auth-grid">
        <section className="card auth-card" aria-labelledby="authH">
          <h1 id="authH" className="sr-only">
            Sign in or create an account
          </h1>
          <div className="auth-tabs" role="tablist" aria-label="Account" onKeyDown={onTabsKey}>
            <button
              ref={tabIn}
              type="button"
              role="tab"
              id="tabIn"
              aria-controls="pIn"
              aria-selected={pane !== "up"}
              tabIndex={pane === "up" ? -1 : 0}
              onClick={() => setPane("in")}
            >
              Sign in
            </button>
            <button
              ref={tabUp}
              type="button"
              role="tab"
              id="tabUp"
              aria-controls="pUp"
              aria-selected={pane === "up"}
              tabIndex={pane === "up" ? 0 : -1}
              onClick={() => setPane("up")}
            >
              Create account
            </button>
          </div>

          {pane === "in" && <SignInForm onDone={finish} onForgot={() => setPane("reset")} />}
          {pane === "reset" && <ResetRequestForm onBack={() => setPane("in")} />}
          {pane === "up" && <CreateAccountForm onDone={finish} />}

          {isCheckout && (
            <div className="guest">
              <span>or</span>
              <Link href="/checkout" className="btn btn-secondary btn-block">
                Continue as guest
              </Link>
              <p>You can create an account after you order.</p>
            </div>
          )}
        </section>
        <AuthSide />
      </div>
    </main>
  );
}

function AuthSide() {
  return (
    <aside className="auth-side" aria-label="Why create an account">
      <h2>Your account, in one place</h2>
      <ul>
        <li>
          <DayloraIcon name="truck" />
          <span>
            <b>Track every order</b>See where your package is, any time.
          </span>
        </li>
        <li>
          <DayloraIcon name="return" />
          <span>
            <b>Easy returns</b>Start a return in two taps, free for 30 days.
          </span>
        </li>
        <li>
          <DayloraIcon name="shield" />
          <span>
            <b>Faster checkout</b>Your address is saved. Card details never are.
          </span>
        </li>
      </ul>
      <Link href="/track" className="link light">
        Track an order without an account <DayloraIcon name="arrow" />
      </Link>
    </aside>
  );
}

/* ---------------------------------------------------------------------------
   Small field helpers
   --------------------------------------------------------------------------- */

export function Field({
  id,
  label,
  error,
  hint,
  children,
  labelRow,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  labelRow?: React.ReactNode;
}) {
  return (
    <div className={`field${error ? " bad" : ""}`}>
      {labelRow ? (
        <div className="lbl-row">
          <label htmlFor={id}>{label}</label>
          {labelRow}
        </div>
      ) : (
        <label htmlFor={id}>{label}</label>
      )}
      {children}
      {hint}
      <p className="err" id={`${id}-e`}>
        {error}
      </p>
    </div>
  );
}

/** Password input with the design's Show/Hide toggle. */
export function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  invalid,
  describedBy,
  inputRef,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  invalid?: boolean;
  describedBy?: string;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="pw">
      <input
        ref={inputRef}
        id={id}
        type={shown ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid || undefined}
        aria-describedby={[describedBy, invalid ? `${id}-e` : null].filter(Boolean).join(" ") || undefined}
      />
      <button
        type="button"
        className="pw-t"
        aria-label={shown ? "Hide password" : "Show password"}
        aria-pressed={shown}
        onClick={() => setShown((s) => !s)}
      >
        {shown ? "Hide" : "Show"}
      </button>
    </div>
  );
}

export function PasswordRules({ id, value }: { id: string; value: string }) {
  return (
    <ul className="rules" id={id} aria-live="polite">
      {PW_RULES.map((r) => {
        const ok = r.test(value);
        return (
          <li key={r.key} className={ok ? "ok" : undefined}>
            {r.label}
            <span className="sr-only">{ok ? " (done)" : ""}</span>
          </li>
        );
      })}
    </ul>
  );
}

const emailError = (v: string) => (!v ? "Enter your email address." : !emailOk(v) ? "Enter an email like name@example.com." : "");

/* ---------------------------------------------------------------------------
   Sign in
   --------------------------------------------------------------------------- */

function SignInForm({ onDone, onForgot }: { onDone: (a: AuthResponse) => Promise<void>; onForgot: () => void }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [errs, setErrs] = useState<{ email?: string; pw?: string }>({});
  const [formErr, setFormErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const pwRef = useRef<HTMLInputElement>(null);

  // Hand the typed email over to the reset pane.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("ec-signin-email");
      if (saved) setEmail(saved);
    } catch {
      /* storage unavailable */
    }
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormErr(null);
    const em = email.trim();
    const next = { email: emailError(em), pw: pw ? "" : "Enter your password." };
    setErrs(next);
    if (next.email) return emailRef.current?.focus();
    if (next.pw) return pwRef.current?.focus();
    setBusy(true);
    try {
      const res = await authService.login({ email: em, password: pw });
      await onDone(res.data.data!);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setFormErr(
        status === 401 || status === 400 || status === 404
          ? "That email and password don't match. Check them and try again, or reset your password."
          : status === 429
            ? "Too many attempts. Wait a minute and try again."
            : getApiErrorMessage(err, "We couldn't sign you in. Try again.")
      );
      pwRef.current?.focus();
      setBusy(false);
    }
  }

  const forgot = () => {
    try {
      sessionStorage.setItem("ec-signin-email", email.trim());
    } catch {
      /* storage unavailable */
    }
    onForgot();
  };

  return (
    <form className="auth-form" id="pIn" role="tabpanel" aria-labelledby="tabIn" noValidate onSubmit={submit}>
      <p className="lede">Welcome back. Sign in to see your orders and check out faster.</p>
      {formErr && (
        <div className="alert err" role="alert">
          <DayloraIcon name="alert" />
          <span>{formErr}</span>
        </div>
      )}
      <Field id="inEmail" label="Email" error={errs.email}>
        <input
          ref={emailRef}
          id="inEmail"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!errs.email || undefined}
          aria-describedby={errs.email ? "inEmail-e" : undefined}
        />
      </Field>
      <Field
        id="inPw"
        label="Password"
        error={errs.pw}
        labelRow={
          <button type="button" className="link sm" onClick={forgot}>
            Forgot password?
          </button>
        }
      >
        <PasswordInput id="inPw" inputRef={pwRef} value={pw} onChange={setPw} autoComplete="current-password" invalid={!!errs.pw} />
      </Field>
      <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

/* ---------------------------------------------------------------------------
   Forgot password: always the same neutral confirmation (no account enumeration)
   --------------------------------------------------------------------------- */

function ResetRequestForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      setEmail(sessionStorage.getItem("ec-signin-email") ?? "");
    } catch {
      /* storage unavailable */
    }
    ref.current?.focus();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const em = email.trim();
    const m = emailError(em);
    setErr(m);
    if (m) return ref.current?.focus();
    setBusy(true);
    // The answer is the same whatever happens, so the page never reveals whether an account exists.
    await authService.requestPasswordReset(em).catch(() => undefined);
    setBusy(false);
    setSentTo(em);
  }

  return (
    <form className="auth-form" id="pReset" noValidate onSubmit={submit} aria-labelledby="rsH">
      <button type="button" className="link sm back" onClick={onBack}>
        <DayloraIcon name="arrow" className="icon flip" />
        Back to sign in
      </button>
      <h2 id="rsH">Reset your password</h2>
      <p className="lede">Enter the email you use for your account. We&apos;ll send you a link to set a new password.</p>
      <Field id="rsEmail" label="Email" error={err}>
        <input
          ref={ref}
          id="rsEmail"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!err || undefined}
          aria-describedby={err ? "rsEmail-e" : undefined}
        />
      </Field>
      <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
        {busy ? "Sending…" : "Send reset link"}
      </button>
      <div className="alert ok" role="status" hidden={!sentTo}>
        <DayloraIcon name="check" />
        <span>
          If <b>{sentTo}</b> has an account, we&apos;ve sent a reset link. It expires in 1 hour. Check your spam folder if it
          doesn&apos;t arrive.
        </span>
      </div>
    </form>
  );
}

/* ---------------------------------------------------------------------------
   Create account
   --------------------------------------------------------------------------- */

function CreateAccountForm({ onDone }: { onDone: (a: AuthResponse) => Promise<void> }) {
  const [v, setV] = useState({ first: "", last: "", email: "", pw: "", optIn: false });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [formErr, setFormErr] = useState<React.ReactNode>(null);
  const [busy, setBusy] = useState(false);
  const refs = {
    first: useRef<HTMLInputElement>(null),
    last: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    pw: useRef<HTMLInputElement>(null),
  };
  const set = (k: keyof typeof v) => (val: string | boolean) => setV((s) => ({ ...s, [k]: val }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormErr(null);
    const first = v.first.trim();
    const last = v.last.trim();
    const em = v.email.trim();
    const next: Record<string, string> = {
      first: first ? "" : "Enter your first name.",
      last: last ? "" : "Enter your last name.",
      email: emailError(em),
      pw: passwordOk(v.pw) ? "" : PW_RULE_MESSAGE,
    };
    setErrs(next);
    const bad = (["first", "last", "email", "pw"] as const).find((k) => next[k]);
    if (bad) return refs[bad].current?.focus();
    setBusy(true);
    try {
      const res = await authService.register({
        email: em,
        password: v.pw,
        fullName: `${first} ${last}`,
        marketingOptIn: v.optIn,
      });
      await onDone(res.data.data!);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setErrs((s) => ({ ...s, email: "There's already an account with this email. Sign in instead, or reset your password." }));
        refs.email.current?.focus();
      } else {
        setFormErr(getApiErrorMessage(err, "We couldn't create your account. Try again."));
      }
      setBusy(false);
    }
  }

  const input = (k: "first" | "last" | "email", id: string, extra: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      ref={refs[k]}
      id={id}
      value={v[k]}
      onChange={(e) => set(k)(e.target.value)}
      aria-invalid={!!errs[k] || undefined}
      aria-describedby={errs[k] ? `${id}-e` : undefined}
      {...extra}
    />
  );

  return (
    <form className="auth-form" id="pUp" role="tabpanel" aria-labelledby="tabUp" noValidate onSubmit={submit}>
      <p className="lede">Create an account in under a minute. Track orders and save your address for next time.</p>
      {formErr && (
        <div className="alert err" role="alert">
          <DayloraIcon name="alert" />
          <span>{formErr}</span>
        </div>
      )}
      <div className="row2">
        <Field id="upFirst" label="First name" error={errs.first}>
          {input("first", "upFirst", { autoComplete: "given-name" })}
        </Field>
        <Field id="upLast" label="Last name" error={errs.last}>
          {input("last", "upLast", { autoComplete: "family-name" })}
        </Field>
      </div>
      <Field id="upEmail" label="Email" error={errs.email}>
        {input("email", "upEmail", { type: "email", autoComplete: "email", inputMode: "email" })}
      </Field>
      <Field id="upPw" label="Create a password" error={errs.pw} hint={<PasswordRules id="pwRules" value={v.pw} />}>
        <PasswordInput
          id="upPw"
          inputRef={refs.pw}
          value={v.pw}
          onChange={set("pw")}
          autoComplete="new-password"
          invalid={!!errs.pw}
          describedBy="pwRules"
        />
      </Field>
      <label className="check">
        <input type="checkbox" checked={v.optIn} onChange={(e) => set("optIn")(e.target.checked)} />
        <span>Email me deals and new arrivals. You can unsubscribe anytime.</span>
      </label>
      <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
        {busy ? "Creating account…" : "Create account"}
      </button>
      <p className="terms">
        By creating an account, you agree to our <Link href="/help?t=terms">Terms of use</Link> and{" "}
        <Link href="/help?t=privacy">Privacy policy</Link>.
      </p>
    </form>
  );
}
