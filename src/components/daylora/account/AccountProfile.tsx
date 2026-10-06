"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { DayloraIcon } from "../DayloraIcons";
import addressService from "@/services/address.service";
import accountService from "@/services/account.service";
import { useAuthStore } from "@/store/useAuthStore";
import { getApiErrorMessage } from "@/lib/apiError";
import type { AddressResponse } from "@/types/api/address.types";
import type { UserProfile } from "@/types/api/auth.types";
import { Field, PasswordInput } from "./SignIn";
import { PW_RULE_MESSAGE, emailOk, passwordOk, splitName, type ToastMsg } from "./customerShared";

type ToastFn = (t: ToastMsg) => void;

const STATES_US = ["AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"]; // prettier-ignore

const statusOf = (e: unknown) => (e as { response?: { status?: number } })?.response?.status;

/* ===========================================================================
   Addresses
   =========================================================================== */

export function AddressesView({ toast }: { toast: ToastFn }) {
  const [list, setList] = useState<AddressResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () =>
    addressService
      .getAll()
      .then((r) => setList(r.data.data ?? []))
      .catch((e) => setError(getApiErrorMessage(e, "We couldn't load your addresses.")));

  useEffect(() => {
    load();
  }, []);

  async function makeDefault(a: AddressResponse) {
    setBusyId(a.id);
    try {
      await addressService.setDefault(a.id);
      await load();
      toast({ title: "Default address updated" });
    } catch (e) {
      toast({ title: "Couldn't update the address", body: getApiErrorMessage(e, "Try again.") });
    } finally {
      setBusyId(null);
    }
  }

  async function remove(a: AddressResponse) {
    setBusyId(a.id);
    try {
      await addressService.delete(a.id);
      await load();
      toast({ title: "Address removed" });
    } catch (e) {
      toast({ title: "Couldn't remove the address", body: getApiErrorMessage(e, "Try again.") });
    } finally {
      setBusyId(null);
    }
  }

  // Default first, as the design lists it.
  const sorted = (list ?? []).slice().sort((a, b) => Number(b.isDefault) - Number(a.isDefault));

  return (
    <>
      <div className="sub-h">
        <h1>Addresses</h1>
        <p>Used to fill in checkout for you.</p>
      </div>
      {error ? (
        <div className="alert err" role="alert">
          <DayloraIcon name="alert" />
          <span>{error}</span>
        </div>
      ) : !list ? (
        <div className="skel" style={{ height: 200 }} aria-hidden="true" />
      ) : (
        <div className="addr-grid">
          {sorted.map((a) => (
            <div className="card addr-card" key={a.id}>
              {a.isDefault && (
                <span className="pill ok" style={{ alignSelf: "flex-start" }}>
                  Default
                </span>
              )}
              <address className="addr">
                <b>{a.recipientName}</b>
                <br />
                {a.addressLine1}
                {a.addressLine2 && (
                  <>
                    <br />
                    {a.addressLine2}
                  </>
                )}
                <br />
                {a.city}, {a.state} {a.postalCode}
                {a.phone && (
                  <>
                    <br />
                    {a.phone}
                  </>
                )}
              </address>
              <div className="acts">
                {!a.isDefault && (
                  <button type="button" onClick={() => makeDefault(a)} disabled={busyId === a.id}>
                    Set as default
                  </button>
                )}
                {sorted.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(a)}
                    disabled={busyId === a.id}
                    aria-label={`Remove address ${a.addressLine1}`}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
          {!adding && (
            <button type="button" className="addr-new" onClick={() => setAdding(true)}>
              + Add a new address
            </button>
          )}
        </div>
      )}
      {adding && list && (
        <AddressForm
          first={list.length === 0}
          onCancel={() => setAdding(false)}
          onSaved={async () => {
            setAdding(false);
            await load();
            toast({ title: "Address saved" });
          }}
        />
      )}
    </>
  );
}

function AddressForm({ first, onCancel, onSaved }: { first: boolean; onCancel: () => void; onSaved: () => void }) {
  const [v, setV] = useState({ name: "", l1: "", l2: "", city: "", state: "", zip: "", phone: "", def: first });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [formErr, setFormErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const set = (k: keyof typeof v) => (val: string | boolean) => setV((s) => ({ ...s, [k]: val }));

  useEffect(() => {
    formRef.current?.querySelector<HTMLInputElement>("#aName")?.focus();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormErr(null);
    const t = (s: string) => s.trim();
    const next: Record<string, string> = {
      name: t(v.name) ? "" : "Enter a name.",
      l1: /\d/.test(v.l1) ? "" : "Enter a street address with a number.",
      city: t(v.city) ? "" : "Enter a city.",
      state: v.state ? "" : "Choose a state.",
      zip: /^\d{5}(-\d{4})?$/.test(t(v.zip)) ? "" : "Enter a 5-digit ZIP.",
      phone: !t(v.phone) || /^\+?[0-9 ()-]{6,20}$/.test(t(v.phone)) ? "" : "Enter a phone number using digits only.",
    };
    setErrs(next);
    const bad = ["name", "l1", "city", "state", "zip", "phone"].find((k) => next[k]);
    if (bad) {
      const id = { name: "aName", l1: "aL1", city: "aCity", state: "aState", zip: "aZip", phone: "aPhone" }[bad];
      formRef.current?.querySelector<HTMLElement>(`#${id}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      await addressService.create({
        label: first ? "Home" : "Other",
        recipientName: t(v.name),
        phone: t(v.phone) || undefined,
        addressLine1: t(v.l1),
        addressLine2: t(v.l2) || undefined,
        city: t(v.city),
        state: v.state,
        postalCode: t(v.zip),
        country: "US",
        isDefault: v.def,
      });
      onSaved();
    } catch (err) {
      setFormErr(getApiErrorMessage(err, "We couldn't save this address. Try again."));
      setBusy(false);
    }
  }

  const input = (k: "name" | "l1" | "l2" | "city" | "zip" | "phone", id: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input
      id={id}
      value={v[k]}
      onChange={(e) => set(k)(e.target.value)}
      aria-invalid={!!errs[k] || undefined}
      aria-describedby={errs[k] ? `${id}-e` : undefined}
      {...extra}
    />
  );

  return (
    <form ref={formRef} className="card form-stack" noValidate onSubmit={submit} aria-labelledby="naH">
      <h2 id="naH">New address</h2>
      {formErr && (
        <div className="alert err" role="alert">
          <DayloraIcon name="alert" />
          <span>{formErr}</span>
        </div>
      )}
      <Field id="aName" label="Full name" error={errs.name}>
        {input("name", "aName", { autoComplete: "name" })}
      </Field>
      <Field id="aL1" label="Street address" error={errs.l1}>
        {input("l1", "aL1", { autoComplete: "address-line1" })}
      </Field>
      <Field id="aL2" label="Apt, suite, unit (optional)">
        {input("l2", "aL2", { autoComplete: "address-line2" })}
      </Field>
      <div className="row2">
        <Field id="aCity" label="City" error={errs.city}>
          {input("city", "aCity", { autoComplete: "address-level2" })}
        </Field>
        <div className="row2" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <Field id="aState" label="State" error={errs.state}>
            <select
              id="aState"
              autoComplete="address-level1"
              value={v.state}
              onChange={(e) => set("state")(e.target.value)}
              aria-invalid={!!errs.state || undefined}
              aria-describedby={errs.state ? "aState-e" : undefined}
            >
              <option value="">State</option>
              {STATES_US.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field id="aZip" label="ZIP code" error={errs.zip}>
            {input("zip", "aZip", { inputMode: "numeric", maxLength: 10, autoComplete: "postal-code" })}
          </Field>
        </div>
      </div>
      <div className={`field${errs.phone ? " bad" : ""}`}>
        <label htmlFor="aPhone">
          Phone <span className="opt">(for delivery questions)</span>
        </label>
        {input("phone", "aPhone", { type: "tel", autoComplete: "tel-national" })}
        <p className="err" id="aPhone-e">
          {errs.phone}
        </p>
      </div>
      {!first && (
        <label className="check">
          <input type="checkbox" checked={v.def} onChange={(e) => set("def")(e.target.checked)} />
          <span>Make this my default address</span>
        </label>
      )}
      <div className="form-btns">
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save address"}
        </button>
        <button className="btn btn-secondary" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ===========================================================================
   Account details + change password
   =========================================================================== */

export function DetailsView({ toast }: { toast: ToastFn }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    accountService
      .getProfile()
      .then((r) => setProfile(r.data.data ?? null))
      .catch((e) => setError(getApiErrorMessage(e, "We couldn't load your details.")));
  }, []);

  return (
    <>
      <div className="sub-h">
        <h1>Account details</h1>
      </div>
      {error ? (
        <div className="alert err" role="alert">
          <DayloraIcon name="alert" />
          <span>{error}</span>
        </div>
      ) : !profile ? (
        <div className="skel" style={{ height: 360 }} aria-hidden="true" />
      ) : (
        <>
          <ProfileForm profile={profile} onSaved={setProfile} toast={toast} />
          <PasswordForm toast={toast} />
        </>
      )}
    </>
  );
}

function ProfileForm({ profile, onSaved, toast }: { profile: UserProfile; onSaved: (p: UserProfile) => void; toast: ToastFn }) {
  const [f0, l0] = splitName(profile.fullName);
  const [v, setV] = useState({ first: f0, last: l0, email: profile.email, optIn: profile.marketingOptIn, current: "" });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const setAuth = useAuthStore((s) => s.setAuth);
  const user = useAuthStore((s) => s.user);
  const emailChanged = v.email.trim().toLowerCase() !== profile.email.toLowerCase();

  async function submit(e: FormEvent) {
    e.preventDefault();
    const first = v.first.trim();
    const email = v.email.trim();
    const next: Record<string, string> = {
      first: first ? "" : "Enter your first name.",
      email: emailOk(email) ? "" : "Enter an email like name@example.com.",
      current: emailChanged && !v.current ? "Enter your current password to change your email." : "",
    };
    setErrs(next);
    const bad = (["first", "email", "current"] as const).find((k) => next[k]);
    if (bad) {
      formRef.current?.querySelector<HTMLElement>(`#${{ first: "dFirst", email: "dEmail", current: "dCur" }[bad]}`)?.focus();
      return;
    }
    const fullName = `${first} ${v.last.trim()}`.trim();
    setBusy(true);
    try {
      const r = await accountService.updateProfile({
        fullName,
        marketingOptIn: v.optIn,
        ...(emailChanged ? { email, currentPassword: v.current } : {}),
      });
      const res = r.data.data!;
      onSaved(res.profile);
      if (res.auth) setAuth(res.auth);
      else if (user) setAuth({ ...user, fullName: res.profile.fullName, email: res.profile.email });
      setV((s) => ({ ...s, current: "" }));
      toast({ title: "Details saved" });
    } catch (err) {
      const msg = getApiErrorMessage(err, "We couldn't save your details. Try again.");
      if (/current password/i.test(msg)) setErrs({ current: msg });
      else if (statusOf(err) === 409 || /already/i.test(msg)) setErrs({ email: "There's already an account with this email." });
      else toast({ title: "Couldn't save your details", body: msg });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} className="card form-stack" noValidate onSubmit={submit} aria-labelledby="piH">
      <h2 id="piH">Personal info</h2>
      <div className="row2">
        <Field id="dFirst" label="First name" error={errs.first}>
          <input
            id="dFirst"
            autoComplete="given-name"
            value={v.first}
            onChange={(e) => setV((s) => ({ ...s, first: e.target.value }))}
            aria-invalid={!!errs.first || undefined}
            aria-describedby={errs.first ? "dFirst-e" : undefined}
          />
        </Field>
        <Field id="dLast" label="Last name">
          <input id="dLast" autoComplete="family-name" value={v.last} onChange={(e) => setV((s) => ({ ...s, last: e.target.value }))} />
        </Field>
      </div>
      <Field id="dEmail" label="Email" error={errs.email}>
        <input
          id="dEmail"
          type="email"
          autoComplete="email"
          value={v.email}
          onChange={(e) => setV((s) => ({ ...s, email: e.target.value }))}
          aria-invalid={!!errs.email || undefined}
          aria-describedby={errs.email ? "dEmail-e" : undefined}
        />
      </Field>
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
            onChange={(val) => setV((s) => ({ ...s, current: val }))}
            autoComplete="current-password"
            invalid={!!errs.current}
          />
        </Field>
      )}
      <div>
        <div className="switch-row">
          <span id="optL">
            Deals and new arrivals<small>About 2 emails a week</small>
          </span>
          <input
            type="checkbox"
            role="switch"
            aria-labelledby="optL"
            checked={v.optIn}
            onChange={(e) => setV((s) => ({ ...s, optIn: e.target.checked }))}
          />
        </div>
        <div className="switch-row">
          <span id="updL">
            Order and delivery updates<small>Always on, so you know where your package is</small>
          </span>
          <input type="checkbox" role="switch" aria-labelledby="updL" checked disabled readOnly />
        </div>
      </div>
      <div>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save details"}
        </button>
      </div>
    </form>
  );
}

function PasswordForm({ toast }: { toast: ToastFn }) {
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");
  const [errs, setErrs] = useState<{ cur?: string; pw?: string }>({});
  const [busy, setBusy] = useState(false);
  const curRef = useRef<HTMLInputElement>(null);
  const pwRef = useRef<HTMLInputElement>(null);
  const setAuth = useAuthStore((s) => s.setAuth);

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
      const r = await accountService.changePassword({ currentPassword: cur, newPassword: pw });
      setAuth(r.data.data!); // a fresh token; older ones are now rejected
      setCur("");
      setPw("");
      toast({ title: "Password changed", body: "Other devices have been signed out." });
    } catch (err) {
      const msg = getApiErrorMessage(err, "We couldn't change your password. Try again.");
      if (/current password/i.test(msg)) {
        setErrs({ cur: msg });
        curRef.current?.focus();
      } else setErrs({ pw: msg });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card form-stack" noValidate onSubmit={submit} aria-labelledby="cpH">
      <h2 id="cpH">Change password</h2>
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
      <div>
        <button className="btn btn-secondary" type="submit" disabled={busy}>
          {busy ? "Changing…" : "Change password"}
        </button>
      </div>
    </form>
  );
}
