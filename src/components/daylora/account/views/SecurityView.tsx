"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import profileService from "@/services/account/profile.service";
import sessionsService from "@/services/account/sessions.service";
import twoFactorService from "@/services/account/twoFactor.service";
import { useAuthStore } from "@/store/useAuthStore";
import { useStoreConfig } from "@/hooks/useStoreConfig";
import { getApiErrorMessage } from "@/lib/apiError";
import type { UserProfile } from "@/types/api/auth.types";
import type { AccountSession, TwoFactorStartResponse } from "@/types/api/account.types";
import { Field, PasswordInput } from "../SignIn";
import { PW_RULE_MESSAGE, fmtLong, fmtShort, passwordOk, useAccountToast } from "../customerShared";
import { DayloraIcon } from "../../DayloraIcons";
import { ErrorAlert, Switch, ViewHead, statusOf, useGoLink } from "./settingsShared";

/** Login & security: password, 2-step verification and sessions (design 08 #security, contract C8–C9). */
export default function SecurityView() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionsKey, setSessionsKey] = useState(0);

  useEffect(() => {
    profileService
      .getProfile()
      .then((r) => setProfile(r.data.data ?? null))
      .catch((e) => setError(getApiErrorMessage(e, "We couldn't load your sign-in details.")));
  }, []);

  return (
    <>
      <ViewHead title="Login & security" sub="Keep your account safe." />
      {error ? (
        <ErrorAlert>{error}</ErrorAlert>
      ) : !profile ? (
        <div className="skel" style={{ height: 360 }} aria-hidden="true" />
      ) : (
        <>
          <SignInDetails
            profile={profile}
            onChanged={(p) => {
              setProfile(p);
              setSessionsKey((k) => k + 1);
            }}
          />
          <TwoStep profile={profile} onChanged={setProfile} />
          <Sessions key={sessionsKey} />
        </>
      )}
    </>
  );
}

/* ---- Sign-in details + change password ---- */

function SignInDetails({ profile, onChanged }: { profile: UserProfile; onChanged: (p: UserProfile) => void }) {
  const toast = useAccountToast();
  const goLink = useGoLink();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");
  const [out, setOut] = useState(true);
  const [errs, setErrs] = useState<{ cur?: string; pw?: string }>({});
  const [busy, setBusy] = useState(false);
  const curRef = useRef<HTMLInputElement>(null);
  const pwRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) curRef.current?.focus();
  }, [open]);

  const close = () => {
    setOpen(false);
    setCur("");
    setPw("");
    setErrs({});
    setOut(true);
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    const next = {
      cur: cur ? "" : "Enter your current password.",
      pw: passwordOk(pw) ? (pw === cur ? "Choose a new password that's different from your current one." : "") : PW_RULE_MESSAGE,
    };
    setErrs(next);
    if (next.cur) return curRef.current?.focus();
    if (next.pw) return pwRef.current?.focus();
    setBusy(true);
    try {
      const r = await profileService.changePassword({ currentPassword: cur, newPassword: pw, signOutOtherDevices: out });
      if (r.data.data?.accessToken) setAuth(r.data.data); // a fresh token for this device
      close();
      onChanged({ ...profile, passwordChangedAt: out ? new Date().toISOString() : profile.passwordChangedAt });
      toast({ title: "Password changed", body: out ? "Other devices have been signed out." : undefined });
    } catch (err) {
      const msg = getApiErrorMessage(err, "We couldn't change your password. Try again.");
      if (/current password/i.test(msg)) {
        setErrs({ cur: msg });
        curRef.current?.focus();
      } else {
        setErrs({ pw: msg });
        pwRef.current?.focus();
      }
    } finally {
      setBusy(false);
    }
  }

  const changed = profile.passwordChangedAt ?? profile.createdAt;

  return (
    <section className="card" aria-labelledby="sdH">
      <h2 id="sdH">Sign-in details</h2>
      <div className="row-set">
        <span>
          <b>Email</b>
          <small>{profile.email}</small>
        </span>
        <a className="btn btn-secondary btn-sm" {...goLink("profile")}>
          Change
        </a>
      </div>
      <div className="row-set">
        <span>
          <b>Password</b>
          <small>Last changed {fmtLong(changed)}</small>
        </span>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="pwForm">
          Change password
        </button>
      </div>
      {open && (
        <form className="form-stack" id="pwForm" noValidate onSubmit={submit} style={{ paddingTop: 16 }}>
          <Field id="pwCur" label="Current password" error={errs.cur}>
            <PasswordInput id="pwCur" inputRef={curRef} value={cur} onChange={setCur} autoComplete="current-password" invalid={!!errs.cur} />
          </Field>
          <Field
            id="pwNew"
            label="New password"
            error={errs.pw}
            hint={
              <p className="hint" id="pwNew-h">
                At least 8 characters with a letter and a number.
              </p>
            }
          >
            <PasswordInput
              id="pwNew"
              inputRef={pwRef}
              value={pw}
              onChange={setPw}
              autoComplete="new-password"
              invalid={!!errs.pw}
              describedBy="pwNew-h"
            />
          </Field>
          <label className="check">
            <input type="checkbox" checked={out} onChange={(e) => setOut(e.target.checked)} />
            <span>Sign out of other devices</span>
          </label>
          <div className="help-row">
            <button className="btn btn-primary btn-sm" type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save password"}
            </button>
            <button className="btn btn-secondary btn-sm" type="button" onClick={close}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

/* ---- 2-step verification ---- */

function TwoStep({ profile, onChanged }: { profile: UserProfile; onChanged: (p: UserProfile) => void }) {
  const toast = useAccountToast();
  const goLink = useGoLink();
  const config = useStoreConfig();
  const on = !!profile.twoFactorEnabled;
  const [challenge, setChallenge] = useState<TwoFactorStartResponse | null>(null);
  const [code, setCode] = useState("");
  const [codeErr, setCodeErr] = useState("");
  const [startErr, setStartErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (challenge) codeRef.current?.focus();
  }, [challenge]);

  async function toggle(next: boolean) {
    setStartErr(null);
    setBusy(true);
    try {
      if (next) {
        const r = await twoFactorService.start();
        setCode("");
        setCodeErr("");
        setChallenge(r.data.data!);
      } else {
        await twoFactorService.disable();
        setChallenge(null);
        onChanged({ ...profile, twoFactorEnabled: false });
        toast({ title: "2-step verification is off" });
      }
    } catch (err) {
      setStartErr(getApiErrorMessage(err, next ? "We couldn't send a code. Try again." : "We couldn't turn it off. Try again."));
    } finally {
      setBusy(false);
    }
  }

  async function confirm(e: FormEvent) {
    e.preventDefault();
    if (!challenge) return;
    if (!/^\d{6}$/.test(code)) {
      setCodeErr("Enter the 6-digit code.");
      return codeRef.current?.focus();
    }
    setBusy(true);
    try {
      const r = await twoFactorService.confirm(challenge.challengeId, code);
      setChallenge(null);
      onChanged(r.data.data ?? { ...profile, twoFactorEnabled: true, twoFactorPhone: challenge.phoneMasked });
      toast({ title: "2-step verification is on" });
    } catch (err) {
      setCodeErr(
        statusOf(err) === 429 ? "Too many attempts. Start again." : getApiErrorMessage(err, "That code didn't match. Try again.")
      );
      codeRef.current?.focus();
    } finally {
      setBusy(false);
    }
  }

  const noSms = config?.smsAvailable !== true;

  return (
    <section className="card" aria-labelledby="tfH">
      <h2 id="tfH">2-step verification</h2>
      <div className="row-set">
        <span>
          <b id="tfL">Text me a code when I sign in on a new device</b>
          <small>{on ? `On · codes go to ${profile.twoFactorPhone ?? "your mobile number"}` : "Adds a second step to protect your account."}</small>
        </span>
        <Switch checked={on || !!challenge} labelledBy="tfL" disabled={busy} onChange={(v) => (v ? toggle(true) : challenge && !on ? setChallenge(null) : toggle(false))} />
      </div>
      {noSms && (
        <p className="note-sm" style={{ marginTop: 4 }}>
          Text messages aren&apos;t connected in this store yet, so sign-in codes may not reach your phone. Contact support if you
          need help signing in.
        </p>
      )}
      {startErr && (
        <div style={{ paddingTop: 12 }}>
          <ErrorAlert>
            {startErr}
            {/mobile number/i.test(startErr) && (
              <>
                {" "}
                <a {...goLink("profile")}>Go to Profile</a>
              </>
            )}
          </ErrorAlert>
        </div>
      )}
      {challenge && (
        <form className="form-stack" noValidate onSubmit={confirm} style={{ paddingTop: 8 }}>
          <p className="note-sm" style={{ fontSize: 14 }}>
            We sent a 6-digit code to {challenge.phoneMasked}.
          </p>
          <div style={{ maxWidth: 220 }}>
            <Field id="tfaCode" label="Code" error={codeErr}>
              <input
                ref={codeRef}
                id="tfaCode"
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                aria-invalid={!!codeErr || undefined}
                aria-describedby={codeErr ? "tfaCode-e" : undefined}
              />
            </Field>
          </div>
          <div className="help-row">
            <button className="btn btn-primary btn-sm" type="submit" disabled={busy}>
              Turn on
            </button>
            <button className="btn btn-secondary btn-sm" type="button" onClick={() => setChallenge(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

/* ---- Where you're signed in ---- */

function Sessions() {
  const toast = useAccountToast();
  const [list, setList] = useState<AccountSession[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () =>
    sessionsService
      .list()
      .then((r) => setList(r.data.data ?? []))
      .catch((e) => setError(getApiErrorMessage(e, "We couldn't load where you're signed in.")));

  useEffect(() => {
    load();
  }, []);

  async function signOut(s: AccountSession) {
    setBusy(s.id);
    try {
      await sessionsService.revoke(s.id);
      await load();
      toast({ title: "Signed out", body: s.label });
    } catch (e) {
      toast({ title: "Couldn't sign out that device", body: getApiErrorMessage(e, "Try again.") });
    } finally {
      setBusy(null);
    }
  }

  async function signOutOthers() {
    setBusy("all");
    try {
      await sessionsService.revokeOthers();
      await load();
      toast({ title: "Signed out of all other devices" });
    } catch (e) {
      toast({ title: "Couldn't sign out other devices", body: getApiErrorMessage(e, "Try again.") });
    } finally {
      setBusy(null);
    }
  }

  // This device first, then most recently active.
  const sorted = (list ?? [])
    .slice()
    .sort((a, b) => Number(b.current) - Number(a.current) || +new Date(b.lastActiveAt) - +new Date(a.lastActiveAt));

  return (
    <section className="card" aria-labelledby="sesH">
      <h2 id="sesH">Where you&apos;re signed in</h2>
      {error ? (
        <ErrorAlert>{error}</ErrorAlert>
      ) : !list ? (
        <div className="skel" style={{ height: 120, marginTop: 12 }} aria-hidden="true" />
      ) : (
        <>
          {sorted.map((s) => (
            <div className="dev" key={s.id}>
              <span className="ib">
                <DayloraIcon name={/mobile|phone|tablet/i.test(s.deviceType) ? "phone" : "device"} />
              </span>
              <span>
                <b>{s.label}</b>
                <small>
                  {s.location && <>{s.location} · </>}
                  {s.current ? <span className="now">This device · active now</span> : `Last active ${fmtShort(s.lastActiveAt)}`}
                </small>
              </span>
              {!s.current && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => signOut(s)} disabled={busy === s.id} aria-label={`Sign out ${s.label}`}>
                  Sign out
                </button>
              )}
            </div>
          ))}
          {sorted.length > 1 && (
            <div style={{ paddingTop: 12 }}>
              <button type="button" className="link" style={{ minHeight: "auto" }} onClick={signOutOthers} disabled={busy === "all"}>
                Sign out of all other devices
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
