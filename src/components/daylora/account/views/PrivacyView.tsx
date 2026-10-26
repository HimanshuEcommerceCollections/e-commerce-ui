"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { DayloraIcon } from "../../DayloraIcons";
import privacyService from "@/services/account/privacy.service";
import profileService from "@/services/account/profile.service";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { getApiErrorMessage } from "@/lib/apiError";
import type { UserProfile } from "@/types/api/auth.types";
import type { DataExportRequest } from "@/types/api/account.types";
import { Field, PasswordInput } from "../SignIn";
import { money, useAccountToast } from "../customerShared";
import { ErrorAlert, ViewHead, fieldErrors, statusOf } from "./settingsShared";

/** A request still being prepared, or ready and not yet expired, counts as requested. */
const isOpen = (r: DataExportRequest | null) =>
  !!r && r.status !== "FAILED" && r.status !== "EXPIRED" && (!r.expiresAt || new Date(r.expiresAt) > new Date());

/** Privacy & data: choices, data download and account deletion (design 08 #privacy, contract C13). */
export default function PrivacyView() {
  const toast = useAccountToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [exportReq, setExportReq] = useState<DataExportRequest | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [deletedEmail, setDeletedEmail] = useState<string | null>(null);

  useEffect(() => {
    profileService
      .getProfile()
      .then((r) => setProfile(r.data.data ?? null))
      .catch(() => undefined);
    privacyService
      .latestExport()
      .then((r) => setExportReq(r.data.data ?? null))
      .catch(() => undefined);
  }, []);

  async function requestData() {
    setRequesting(true);
    try {
      const r = await privacyService.requestExport();
      setExportReq(r.data.data ?? { id: "", status: "PENDING", createdAt: new Date().toISOString() });
      toast({ title: "Request received", body: `We'll email ${profile?.email ?? "you"} within 48 hours.` });
    } catch (e) {
      toast({ title: "Couldn't request your data", body: getApiErrorMessage(e, "Try again.") });
    } finally {
      setRequesting(false);
    }
  }

  if (deletedEmail !== null) return <Deleted email={deletedEmail} />;

  const credit = profile?.storeCreditBalance ?? 0;
  const requested = isOpen(exportReq);

  return (
    <>
      <ViewHead title="Privacy & data" sub="See and control the data we keep about you." />
      <section className="card">
        <Link className="linkrow" href="/privacy#dns">
          <span>
            Your privacy choices<small>Opt out of the sale or sharing of your information.</small>
          </span>
          <DayloraIcon name="chev" />
        </Link>
        <Link className="linkrow" href="/privacy#cookies">
          <span>
            Cookie settings<small>Turn analytics and ad cookies on or off.</small>
          </span>
          <DayloraIcon name="chev" />
        </Link>
        <Link className="linkrow" href="/privacy">
          <span>
            Privacy policy<small>What we collect and why.</small>
          </span>
          <DayloraIcon name="chev" />
        </Link>
      </section>
      <section className="card" aria-labelledby="dlH">
        <h2 id="dlH">Download your data</h2>
        <p className="note-sm" style={{ fontSize: 14, lineHeight: "22px", marginBottom: 16 }}>
          Get a copy of your orders, addresses, reviews and account details. We&apos;ll email a download link to{" "}
          {profile?.email ?? "your email"} within 48 hours.
        </p>
        <button type="button" className="btn btn-secondary" onClick={requestData} disabled={requested || requesting}>
          {requested ? "Requested" : requesting ? "Requesting…" : "Request my data"}
        </button>
      </section>
      <section className="card danger-zone" aria-labelledby="delH">
        <h2 id="delH">Delete account</h2>
        <p className="note-sm" style={{ fontSize: 14, lineHeight: "22px" }}>
          This closes your account and erases your saved addresses, payment methods, saved items and reviews. Order records we
          must keep for tax purposes are kept but no longer linked to you.{" "}
          {credit > 0 && <b>Your {money(credit)} store credit will be lost.</b>}
        </p>
        <DeleteAccount onDeleted={setDeletedEmail} />
      </section>
    </>
  );
}

function DeleteAccount({ onDeleted }: { onDeleted: (email: string) => void }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [pw, setPw] = useState("");
  const [errs, setErrs] = useState<{ confirm?: string; password?: string }>({});
  const [formErr, setFormErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const typeRef = useRef<HTMLInputElement>(null);
  const pwRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) typeRef.current?.focus();
  }, [open]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormErr(null);
    const next = {
      confirm: typed.trim() === "DELETE" ? "" : "Type DELETE in capital letters.",
      password: pw ? "" : "Enter your password.",
    };
    setErrs(next);
    if (next.confirm) return typeRef.current?.focus();
    if (next.password) return pwRef.current?.focus();
    setBusy(true);
    try {
      const r = await privacyService.deleteAccount(pw);
      onDeleted(r.data.data?.email ?? "");
    } catch (err) {
      const fe = fieldErrors(err);
      const msg = getApiErrorMessage(err, "We couldn't delete your account. Try again.");
      if (fe.confirm) {
        setErrs({ confirm: fe.confirm });
        typeRef.current?.focus();
      } else if (fe.password || /password/i.test(msg)) {
        setErrs({ password: fe.password ?? msg });
        pwRef.current?.focus();
      } else setFormErr(statusOf(err) === 409 ? msg || "You have orders or returns in progress." : msg);
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div style={{ marginTop: 16 }}>
        <button type="button" className="btn btn-danger" onClick={() => setOpen(true)}>
          Delete my account
        </button>
      </div>
    );
  }

  return (
    <form className="form-stack" noValidate onSubmit={submit} style={{ marginTop: 16 }}>
      {formErr && <ErrorAlert>{formErr}</ErrorAlert>}
      <div style={{ maxWidth: 320 }} className="form-stack">
        <Field id="delType" label="Type DELETE to confirm" error={errs.confirm}>
          <input
            ref={typeRef}
            id="delType"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            aria-invalid={!!errs.confirm || undefined}
            aria-describedby={errs.confirm ? "delType-e" : undefined}
          />
        </Field>
        <Field id="delPw" label="Password" error={errs.password}>
          <PasswordInput id="delPw" inputRef={pwRef} value={pw} onChange={setPw} autoComplete="current-password" invalid={!!errs.password} />
        </Field>
      </div>
      <div className="help-row">
        <button className="btn btn-danger" type="submit" disabled={busy}>
          {busy ? "Deleting…" : "Permanently delete account"}
        </button>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={() => {
            setOpen(false);
            setTyped("");
            setPw("");
            setErrs({});
            setFormErr(null);
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/**
 * The server has already ended every session. The token is dropped now so no
 * further calls use it; the stored sign-in is cleared when the shopper leaves
 * (clearing it here would swap this message for the signed-out gate).
 */
function Deleted({ email }: { email: string }) {
  useEffect(() => {
    localStorage.removeItem("accessToken");
    document.body.classList.add("acct-deleted");
    const clear = () => {
      useAuthStore.getState().clearAuth();
      useCartStore.getState().reset();
    };
    window.addEventListener("pagehide", clear);
    return () => {
      window.removeEventListener("pagehide", clear);
      document.body.classList.remove("acct-deleted");
      clear();
    };
  }, []);

  return (
    <div className="card empty">
      <span className="gate-ic" aria-hidden="true">
        <DayloraIcon name="check" />
      </span>
      <h2 style={{ margin: 0 }}>Your account is being deleted</h2>
      <p>
        We&apos;ve emailed {email || "you"} to confirm. Everything will be erased within 30 days. You&apos;ve been signed out.
      </p>
      <a className="btn btn-primary" href="/">
        Go to homepage
      </a>
    </div>
  );
}
