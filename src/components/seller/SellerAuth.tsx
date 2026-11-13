"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import authService from "@/services/auth.service";
import onboardingService from "@/services/supplier/onboarding.service";
import type { MyApplication, SupplierStage } from "@/types/api/supplier.types";
import { useAuthStore } from "@/store/useAuthStore";
import { isTwoFactorChallenge, type AuthResponse, type TwoFactorChallenge } from "@/types/api/auth.types";
import { Brand } from "./SellerShell";
import { FieldError, Ico, errorText, statusOf } from "./ui";

/** Where new suppliers apply; a full application flow lives there. */
export const APPLY_URL = "/sell/apply";

const emailOk = (v: string) => /^\S+@\S+\.\S+$/.test(v);

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="sp-auth">
      <aside className="sp-auth-side" aria-label="About the Seller Portal">
        <div>
          <Brand href="/merchant/login" />
        </div>
        <div>
          <h2>Sell through Ecommerce Collections, without the back-and-forth.</h2>
          <ul>
            <li>
              <span className="sp-ic">
                <Ico name="upload" />
              </span>
              <span>Add products one by one or upload your whole catalogue in one file</span>
            </li>
            <li>
              <span className="sp-ic">
                <Ico name="check" />
              </span>
              <span>See problems row by row before you submit, not days later by email</span>
            </li>
            <li>
              <span className="sp-ic">
                <Ico name="clock" />
              </span>
              <span>Every product reviewed by our catalog team within 2 business days</span>
            </li>
          </ul>
        </div>
        <small>Seller accounts are approved separately from shopper accounts.</small>
        <span className="sp-deco" aria-hidden="true" />
      </aside>
      <section className="sp-auth-main">
        <div className="sp-mbrand">
          <Brand href="/merchant/login" />
        </div>
        <div className="sp-auth-box">{children}</div>
      </section>
    </div>
  );
}

function PasswordField({ id, value, onChange, invalid, inputRef }: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  const [show, setShow] = useState(false);
  return (
    <span className="sp-pw">
      <input
        ref={inputRef}
        className="sp-inp"
        id={id}
        type={show ? "text" : "password"}
        autoComplete="current-password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${id}-e` : undefined}
      />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"}>
        {show ? "Hide" : "Show"}
      </button>
    </span>
  );
}

type Step = { name: "login" } | { name: "code"; challenge: TwoFactorChallenge } | { name: "forgot" } | { name: "sent"; email: string };

/**
 * Seller sign-in: the store's login, with its 2-step verification code and
 * password reset. `onSignedIn` decides where an account goes next (approved
 * sellers into the portal, anyone else to the "not approved yet" screen).
 */
export function SellerSignIn({ onSignedIn }: { onSignedIn: (auth: AuthResponse) => void }) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const [step, setStep] = useState<Step>({ name: "login" });
  const [email, setEmail] = useState("");
  const [keep, setKeep] = useState(true);

  const done = (auth: AuthResponse) => {
    setAuth(auth);
    onSignedIn(auth);
  };

  if (step.name === "code") {
    return <CodeStep challenge={step.challenge} rememberMe={keep} onDone={done} onBack={() => setStep({ name: "login" })} />;
  }
  if (step.name === "forgot") {
    return <ForgotStep email={email} onBack={() => setStep({ name: "login" })} onSent={(em) => setStep({ name: "sent", email: em })} />;
  }
  if (step.name === "sent") {
    return (
      <>
        <span className="sp-big-ic sp-ok">
          <Ico name="mail" />
        </span>
        <div>
          <h1>Check your email</h1>
          <p className="sp-sub">
            If <b>{step.email}</b> has an account, you&apos;ll get a link to reset your password in the next few minutes. The
            link works for 1 hour. After resetting, come back here to sign in.
          </p>
        </div>
        <button type="button" className="sp-btn sp-btn-pri sp-btn-block" onClick={() => setStep({ name: "login" })}>
          Back to sign in
        </button>
        <p className="sp-auth-foot">
          No email? Check spam, or{" "}
          <button type="button" className="sp-lnk" onClick={() => setStep({ name: "forgot" })}>
            try another email
          </button>
        </p>
      </>
    );
  }
  return (
    <LoginStep
      email={email}
      setEmail={setEmail}
      keep={keep}
      setKeep={setKeep}
      onChallenge={(challenge) => setStep({ name: "code", challenge })}
      onForgot={() => setStep({ name: "forgot" })}
      onDone={done}
    />
  );
}

function LoginStep({
  email,
  setEmail,
  keep,
  setKeep,
  onChallenge,
  onForgot,
  onDone,
}: {
  email: string;
  setEmail: (v: string) => void;
  keep: boolean;
  setKeep: (v: boolean) => void;
  onChallenge: (c: TwoFactorChallenge) => void;
  onForgot: () => void;
  onDone: (a: AuthResponse) => void;
}) {
  const [pw, setPw] = useState("");
  const [errs, setErrs] = useState<{ email?: string; pw?: string }>({});
  const [formErr, setFormErr] = useState<string | null>(null);
  const [fails, setFails] = useState(0);
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const pwRef = useRef<HTMLInputElement>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormErr(null);
    const em = email.trim().toLowerCase();
    const next = {
      email: !em ? "Enter your business email" : !emailOk(em) ? "Enter your business email, like name@company.com" : undefined,
      pw: pw ? undefined : "Enter your password",
    };
    setErrs(next);
    if (next.email) return emailRef.current?.focus();
    if (next.pw) return pwRef.current?.focus();
    setBusy(true);
    try {
      const result = (await authService.login({ email: em, password: pw, rememberMe: keep })).data.data!;
      if (isTwoFactorChallenge(result)) {
        onChallenge(result);
        return;
      }
      onDone(result);
    } catch (err) {
      const status = statusOf(err);
      setFails((n) => n + 1);
      setFormErr(
        status === 401 || status === 400 || status === 404
          ? "That email and password don't match. Check them and try again."
          : status === 429
            ? "Too many attempts. Wait a minute and try again."
            : errorText(err, "We couldn't sign you in. Try again.")
      );
      setPw("");
      pwRef.current?.focus();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div>
        <h1>Sign in to the Seller Portal</h1>
        <p className="sp-sub">Manage your products for Ecommerce Collections.</p>
      </div>
      {formErr ? (
        <div className="sp-alert sp-alert-bad" role="alert">
          <Ico name="alert" />
          <span>
            {formErr}
            {fails >= 3 ? (
              <>
                {" "}
                <button type="button" className="sp-lnk" style={{ color: "inherit", textDecoration: "underline" }} onClick={onForgot}>
                  Reset your password
                </button>
              </>
            ) : null}
          </span>
        </div>
      ) : null}
      <form className="sp-form" noValidate onSubmit={submit}>
        <label className="sp-field" htmlFor="sp-em">
          <span className="sp-lab">Business email</span>
          <input
            ref={emailRef}
            className="sp-inp"
            id="sp-em"
            type="email"
            autoComplete="username"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errs.email || undefined}
            aria-describedby={errs.email ? "sp-em-e" : undefined}
          />
          <FieldError id="sp-em-e">{errs.email}</FieldError>
        </label>
        <div className="sp-field">
          <span className="sp-lab">
            <label htmlFor="sp-pw">Password</label>
            <button type="button" className="sp-lnk" onClick={onForgot}>
              Forgot password?
            </button>
          </span>
          <PasswordField id="sp-pw" value={pw} onChange={setPw} invalid={!!errs.pw} inputRef={pwRef} />
          <FieldError id="sp-pw-e">{errs.pw}</FieldError>
        </div>
        <label className="sp-check">
          <input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} /> Keep me signed in on this device
        </label>
        <button className="sp-btn sp-btn-pri sp-btn-block" disabled={busy}>
          {busy ? (
            <>
              <span className="sp-spin" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>
      <p className="sp-auth-foot">
        New supplier? <Link href={APPLY_URL}>Apply to sell with us</Link>
      </p>
    </>
  );
}

function CodeStep({
  challenge,
  rememberMe,
  onDone,
  onBack,
}: {
  challenge: TwoFactorChallenge;
  rememberMe: boolean;
  onDone: (a: AuthResponse) => void;
  onBack: () => void;
}) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setErr("Enter all 6 digits.");
      return ref.current?.focus();
    }
    setErr("");
    setBusy(true);
    try {
      onDone((await authService.verifyLogin({ challengeId: challenge.challengeId, code, rememberMe })).data.data!);
    } catch (e2) {
      setErr(
        statusOf(e2) === 429
          ? "Too many attempts. Wait a minute and try again."
          : errorText(e2, "That code isn't right. Check the latest message and try again.")
      );
      ref.current?.focus();
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className="sp-back" onClick={onBack}>
        <Ico name="left" />
        Back
      </button>
      <span className="sp-big-ic sp-info">
        <Ico name="shield" />
      </span>
      <div>
        <h1>Enter your verification code</h1>
        <p className="sp-sub">
          We sent a 6-digit code to {challenge.phoneMasked ? <b>{challenge.phoneMasked}</b> : "your mobile number"}. It expires in
          10 minutes.
        </p>
      </div>
      <form className="sp-form" noValidate onSubmit={submit}>
        <label className="sp-field" htmlFor="sp-code">
          <span className="sp-lab">6-digit code</span>
          <input
            ref={ref}
            id="sp-code"
            className="sp-inp sp-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            aria-invalid={!!err || undefined}
            aria-describedby={err ? "sp-code-e" : undefined}
          />
          <FieldError id="sp-code-e">{err}</FieldError>
        </label>
        <button className="sp-btn sp-btn-pri sp-btn-block" disabled={busy}>
          {busy ? "Checking…" : "Verify and sign in"}
        </button>
      </form>
      <p className="sp-auth-foot">Didn&apos;t get it? Go back and sign in again to get a new code.</p>
    </>
  );
}

function ForgotStep({ email, onBack, onSent }: { email: string; onBack: () => void; onSent: (email: string) => void }) {
  const [em, setEm] = useState(email);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const v = em.trim();
    if (!emailOk(v)) {
      setErr("Enter a valid email address");
      return ref.current?.focus();
    }
    setBusy(true);
    // The same answer whatever happens, so the page never reveals whether an account exists.
    await authService.requestPasswordReset(v).catch(() => undefined);
    setBusy(false);
    onSent(v);
  }

  return (
    <>
      <button type="button" className="sp-back" onClick={onBack}>
        <Ico name="left" />
        Back to sign in
      </button>
      <div>
        <h1>Reset your password</h1>
        <p className="sp-sub">Enter the email you use for the Seller Portal and we&apos;ll send you a reset link.</p>
      </div>
      <form className="sp-form" noValidate onSubmit={submit}>
        <label className="sp-field" htmlFor="sp-fe">
          <span className="sp-lab">Business email</span>
          <input
            ref={ref}
            className="sp-inp"
            id="sp-fe"
            type="email"
            autoComplete="email"
            value={em}
            onChange={(e) => setEm(e.target.value)}
            aria-invalid={!!err || undefined}
            aria-describedby={err ? "sp-fe-e" : undefined}
          />
          <FieldError id="sp-fe-e">{err}</FieldError>
        </label>
        <button className="sp-btn sp-btn-pri sp-btn-block" disabled={busy}>
          {busy ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </>
  );
}

/** A signed-in account without seller approval (an applicant, a shopper, or staff). */
/** Which of the five steps on the "not approved yet" screen an application stage is at. */
const STAGE_STEP: Record<SupplierStage, number> = {
  DRAFT: 1,
  AUTO_REJECTED: 1,
  APPLIED: 2,
  SCREENED: 2,
  SCORECARD: 2,
  DECLINED: 2,
  DOCUMENTS: 3,
  APPROVED: 4,
  SUSPENDED: 4,
};

export function NotApproved({ auth, onSignOut }: { auth: AuthResponse; onSignOut: () => void }) {
  const staff = auth.role === "ROLE_ADMIN" || auth.role === "ROLE_CATALOG";
  // The applicant's real progress (null: no application yet; undefined: loading).
  const [app, setApp] = useState<MyApplication | null | undefined>(undefined);
  useEffect(() => {
    if (staff) return;
    onboardingService
      .get()
      .then(({ data }) => setApp(data.data ?? null))
      .catch(() => setApp(null));
  }, [staff]);
  const now = app ? STAGE_STEP[app.stage] : 1;
  const closed = app && (app.stage === "DECLINED" || app.stage === "AUTO_REJECTED" || app.stage === "SUSPENDED") ? app : null;
  const steps: [string, string][] = [
    ["Account created", "You can sign in"],
    ["Application", "Company, products, shipping, product data"],
    ["Our review", "Checked by our catalog manager"],
    ["Documents", "W-9, signed agreement, insurance certificate"],
    ["Approved", "Product upload unlocks"],
  ];
  return (
    <AuthShell>
      <span className="sp-big-ic sp-info">
        <Ico name="doc" />
      </span>
      <div>
        <h1>
          {staff
            ? "This is a staff account"
            : closed?.stage === "SUSPENDED"
              ? "Your seller account is suspended"
              : closed
                ? "Your application wasn't approved"
                : "Your account isn't approved yet"}
        </h1>
        <p className="sp-sub">
          {staff ? (
            <>
              {auth.email} works in the admin panel, not the Seller Portal. <Link href="/admin">Go to the admin panel</Link>.
            </>
          ) : closed ? (
            <>
              {closed.stage === "SUSPENDED"
                ? `Reason: ${closed.suspensionReason ?? "see the email we sent"}. Reply to that email to work with us on reinstatement.`
                : closed.stage === "DECLINED"
                  ? `Reason: ${closed.declineReason ?? "see the email we sent"}.`
                  : `Some answers didn't meet our requirements${closed.failedChecks.length ? `: ${closed.failedChecks.join("; ")}` : ""}. You can change them and apply again.`}
            </>
          ) : (
            <>
              {auth.fullName || auth.email} can&apos;t add products until the seller application is approved and your documents
              are in. We&apos;ll email you when anything changes.
            </>
          )}
        </p>
      </div>
      {staff ? null : (
        <>
          <ol className="sp-steps-mini">
            {steps.map(([t, d], i) => (
              <li key={t} className={i < now ? "sp-done" : i === now && !closed ? "sp-now" : ""}>
                <span className="sp-d">{i < now ? "✓" : i + 1}</span>
                <span>
                  <b>{t}</b>
                  <span>{d}</span>
                </span>
              </li>
            ))}
          </ol>
          <Link className="sp-btn sp-btn-pri sp-btn-block" href={APPLY_URL}>
            {app?.stage === "DOCUMENTS" ? "Upload my documents" : app && app.stage !== "DRAFT" ? "View my application" : "Go to my application"}
          </Link>
        </>
      )}
      <button type="button" className="sp-btn sp-btn-ghost sp-btn-block" onClick={onSignOut}>
        Sign out
      </button>
    </AuthShell>
  );
}
