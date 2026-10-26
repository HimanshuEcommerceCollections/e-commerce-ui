"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import profileService from "@/services/account/profile.service";
import { useAuthStore } from "@/store/useAuthStore";
import { getApiErrorMessage } from "@/lib/apiError";
import type { UserProfile } from "@/types/api/auth.types";
import { Field, PasswordInput } from "../SignIn";
import { emailOk, splitName, useAccountToast } from "../customerShared";
import { ErrorAlert, ViewHead, birthdayIn, birthdayOk, fieldErrors, statusOf } from "./settingsShared";

const IDS = { first: "dFirst", email: "dEmail", current: "dCur", phone: "dPhone", bday: "dBday" } as const;
type Key = keyof typeof IDS;

/** Profile: name, email, mobile number and birthday (design 08 #profile, contract C7). */
export default function ProfileView() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    profileService
      .getProfile()
      .then((r) => setProfile(r.data.data ?? null))
      .catch((e) => setError(getApiErrorMessage(e, "We couldn't load your profile.")));
  }, []);

  return (
    <>
      <ViewHead title="Profile" sub="Your name and contact details." />
      {error ? (
        <ErrorAlert>{error}</ErrorAlert>
      ) : !profile ? (
        <div className="skel" style={{ height: 420 }} aria-hidden="true" />
      ) : (
        <ProfileForm profile={profile} onSaved={setProfile} />
      )}
    </>
  );
}

function ProfileForm({ profile, onSaved }: { profile: UserProfile; onSaved: (p: UserProfile) => void }) {
  const toast = useAccountToast();
  const [f0, l0] = splitName(profile.fullName);
  const [v, setV] = useState({
    first: f0,
    last: l0,
    email: profile.email,
    phone: profile.phoneNumber ?? "",
    bday: birthdayIn(profile.birthday),
    current: "",
  });
  const [errs, setErrs] = useState<Partial<Record<Key, string>>>({});
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const setAuth = useAuthStore((s) => s.setAuth);
  const user = useAuthStore((s) => s.user);
  const emailChanged = v.email.trim().toLowerCase() !== profile.email.toLowerCase();
  const set = (k: keyof typeof v) => (val: string) => setV((s) => ({ ...s, [k]: val }));

  const focus = (k: Key) => formRef.current?.querySelector<HTMLElement>(`#${IDS[k]}`)?.focus();

  // "0412" → "04/12" as they type.
  const onBday = (raw: string) => {
    const d = raw.replace(/\D/g, "").slice(0, 4);
    set("bday")(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    const first = v.first.trim();
    const email = v.email.trim();
    const phone = v.phone.trim();
    const bday = v.bday.trim();
    const next: Partial<Record<Key, string>> = {
      first: first ? "" : "Enter your first name.",
      email: emailOk(email) ? "" : "Enter an email like name@example.com.",
      current: emailChanged && !v.current ? "Enter your current password to change your email." : "",
      phone: !phone || /^[+]?[0-9 ()-]{7,20}$/.test(phone) ? "" : "Enter a phone number using digits only.",
      bday: !bday || birthdayOk(bday) ? "" : "Enter a valid date as MM/DD.",
    };
    setErrs(next);
    const bad = (Object.keys(IDS) as Key[]).find((k) => next[k]);
    if (bad) return focus(bad);
    setBusy(true);
    try {
      const r = await profileService.updateProfile({
        fullName: `${first} ${v.last.trim()}`.trim(),
        phoneNumber: phone || null,
        birthday: bday || null,
        ...(emailChanged ? { email, currentPassword: v.current } : {}),
      });
      const res = r.data.data!;
      onSaved(res.profile);
      if (res.auth) setAuth(res.auth);
      else if (user) setAuth({ ...user, fullName: res.profile.fullName, email: res.profile.email, phoneNumber: res.profile.phoneNumber });
      setV((s) => ({ ...s, current: "" }));
      toast({ title: "Profile saved" });
    } catch (err) {
      const msg = getApiErrorMessage(err, "We couldn't save your profile. Try again.");
      const fe = fieldErrors(err);
      if (fe.birthday) {
        setErrs({ bday: fe.birthday });
        focus("bday");
      } else if (fe.phoneNumber || /phone/i.test(msg)) {
        setErrs({ phone: fe.phoneNumber ?? msg });
        focus("phone");
      } else if (/current password/i.test(msg)) {
        setErrs({ current: msg });
        focus("current");
      } else if (statusOf(err) === 409 || /already/i.test(msg)) {
        setErrs({ email: "There's already an account with this email." });
        focus("email");
      } else toast({ title: "Couldn't save your profile", body: msg });
    } finally {
      setBusy(false);
    }
  }

  const input = (k: "first" | "last" | "email" | "phone", id: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => {
    const err = k === "last" ? undefined : errs[k];
    const hint = extra["aria-describedby"];
    return (
      <input
        id={id}
        value={v[k]}
        onChange={(e) => set(k)(e.target.value)}
        aria-invalid={!!err || undefined}
        {...extra}
        aria-describedby={[hint, err ? `${id}-e` : null].filter(Boolean).join(" ") || undefined}
      />
    );
  };

  return (
    <form ref={formRef} className="card form-stack" noValidate onSubmit={submit} aria-labelledby="piH">
      <h2 id="piH">Personal info</h2>
      <div className="row2">
        <Field id="dFirst" label="First name" error={errs.first}>
          {input("first", "dFirst", { autoComplete: "given-name" })}
        </Field>
        <Field id="dLast" label="Last name">
          {input("last", "dLast", { autoComplete: "family-name" })}
        </Field>
      </div>
      <div className="row2">
        <Field
          id="dEmail"
          label="Email"
          error={errs.email}
          hint={
            <p className="hint" id="dEmail-h">
              We send order updates here.
            </p>
          }
        >
          {input("email", "dEmail", { type: "email", autoComplete: "email", "aria-describedby": "dEmail-h" })}
        </Field>
        <div className={`field${errs.phone ? " bad" : ""}`}>
          <label htmlFor="dPhone">
            Mobile number <span className="opt">(optional)</span>
          </label>
          {input("phone", "dPhone", { type: "tel", autoComplete: "tel-national", "aria-describedby": "dPhone-h" })}
          <p className="hint" id="dPhone-h">
            For delivery texts and sign-in codes.
          </p>
          <p className="err" id="dPhone-e">
            {errs.phone}
          </p>
        </div>
      </div>
      {emailChanged && (
        <Field
          id="dCur"
          label="Current password"
          error={errs.current}
          hint={<p className="hint">We ask for it before changing the email you sign in with.</p>}
        >
          <PasswordInput
            id="dCur"
            value={v.current}
            onChange={set("current")}
            autoComplete="current-password"
            invalid={!!errs.current}
          />
        </Field>
      )}
      <div className="row2">
        <div className={`field${errs.bday ? " bad" : ""}`}>
          <label htmlFor="dBday">
            Birthday <span className="opt">(optional)</span>
          </label>
          <input
            id="dBday"
            placeholder="MM/DD"
            inputMode="numeric"
            maxLength={5}
            value={v.bday}
            onChange={(e) => onBday(e.target.value)}
            aria-invalid={!!errs.bday || undefined}
            aria-describedby={errs.bday ? "dBday-h dBday-e" : "dBday-h"}
          />
          <p className="hint" id="dBday-h">
            We&apos;ll send you a treat on your birthday.
          </p>
          <p className="err" id="dBday-e">
            {errs.bday}
          </p>
        </div>
        <div />
      </div>
      <div>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
