"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DayloraIcon } from "../DayloraIcons";
import authService from "@/services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { getApiErrorMessage } from "@/lib/apiError";
import { Field, PasswordInput, PasswordRules } from "./SignIn";
import { PW_RULE_MESSAGE, passwordOk } from "./customerShared";

/** The emailed reset link: /reset-password?token=… → new password, signed in, account page. */
export function ResetPassword() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const setAuth = useAuthStore((s) => s.setAuth);
  const mergeAfterLogin = useCartStore((s) => s.mergeAfterLogin);

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [errs, setErrs] = useState<{ pw?: string; pw2?: string }>({});
  const [formErr, setFormErr] = useState<string | null>(null);
  const [expired, setExpired] = useState(!token);
  const [busy, setBusy] = useState(false);
  const pwRef = useRef<HTMLInputElement>(null);
  const pw2Ref = useRef<HTMLInputElement>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormErr(null);
    const next = {
      pw: passwordOk(pw) ? "" : PW_RULE_MESSAGE,
      pw2: !pw2 ? "Enter the new password again." : pw2 !== pw ? "The passwords don't match." : "",
    };
    setErrs(next);
    if (next.pw) return pwRef.current?.focus();
    if (next.pw2) return pw2Ref.current?.focus();
    setBusy(true);
    try {
      const res = await authService.confirmPasswordReset({ token, newPassword: pw });
      const auth = res.data.data!;
      setAuth(auth);
      if (auth.role === "ROLE_CUSTOMER") await mergeAfterLogin().catch(() => undefined);
      router.replace(auth.role === "ROLE_ADMIN" || auth.role === "ROLE_CATALOG" ? "/admin" : "/account");
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const msg = getApiErrorMessage(err, "We couldn't reset your password. Try again.");
      if (status === 400 && /invalid|expired/i.test(msg)) setExpired(true);
      else setFormErr(msg);
      setBusy(false);
    }
  }

  return (
    <main id="main" className="cx pg auth">
      <div className="daylora-container auth-grid">
        <section className="card auth-card" aria-labelledby="rpH">
          {expired ? (
            <div className="auth-form">
              <h1 id="rpH" className="auth-h1">
                This reset link has expired
              </h1>
              <p className="lede">
                Reset links work once and expire after 1 hour. Request a new one and use the latest email we send.
              </p>
              <Link href="/login?mode=reset" className="btn btn-primary btn-block">
                Send a new link
              </Link>
              <Link href="/login" className="link sm back">
                <DayloraIcon name="arrow" className="icon flip" />
                Back to sign in
              </Link>
            </div>
          ) : (
            <form className="auth-form" noValidate onSubmit={submit}>
              <h1 id="rpH" className="auth-h1">
                Set a new password
              </h1>
              <p className="lede">Choose a new password for your account. You&apos;ll be signed in straight away.</p>
              {formErr && (
                <div className="alert err" role="alert">
                  <DayloraIcon name="alert" />
                  <span>{formErr}</span>
                </div>
              )}
              <Field id="rpPw" label="New password" error={errs.pw} hint={<PasswordRules id="rpRules" value={pw} />}>
                <PasswordInput
                  id="rpPw"
                  inputRef={pwRef}
                  value={pw}
                  onChange={setPw}
                  autoComplete="new-password"
                  invalid={!!errs.pw}
                  describedBy="rpRules"
                />
              </Field>
              <Field id="rpPw2" label="Confirm new password" error={errs.pw2}>
                <PasswordInput id="rpPw2" inputRef={pw2Ref} value={pw2} onChange={setPw2} autoComplete="new-password" invalid={!!errs.pw2} />
              </Field>
              <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
                {busy ? "Saving…" : "Save and sign in"}
              </button>
            </form>
          )}
        </section>
        <aside className="auth-side" aria-label="Keeping your account safe">
          <h2>Keeping your account safe</h2>
          <ul>
            <li>
              <DayloraIcon name="shield" />
              <span>
                <b>Other devices are signed out</b>Once you set a new password, old sessions stop working.
              </span>
            </li>
            <li>
              <DayloraIcon name="clock" />
              <span>
                <b>Links expire in 1 hour</b>Didn&apos;t ask for this? Ignore the email and nothing changes.
              </span>
            </li>
          </ul>
          <Link href="/help?t=contact" className="link light">
            Need help? Contact us <DayloraIcon name="arrow" />
          </Link>
        </aside>
      </div>
    </main>
  );
}
