"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import addressService from "@/services/address.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type { AddressResponse } from "@/types/api/address.types";
import { Field } from "../SignIn";
import { useAccountToast } from "../customerShared";
import { ErrorAlert, ViewHead, fieldErrors } from "./settingsShared";

/** The 50 states + DC, as the backend accepts them (contract B4). */
export const STATES_US = ["AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"]; // prettier-ignore
export const ZIP_RE = /^\d{5}(-\d{4})?$/;

/** Saved addresses: list, add, edit, default and remove (design 08 #addresses). */
export default function AddressesView() {
  const toast = useAccountToast();
  const [list, setList] = useState<AddressResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** null: no form; "new": add; otherwise the address being edited. */
  const [editing, setEditing] = useState<AddressResponse | "new" | null>(null);
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
      if (editing !== "new" && editing?.id === a.id) setEditing(null);
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
      <ViewHead title="Addresses" sub="Used to fill in checkout for you." />
      {error ? (
        <ErrorAlert>{error}</ErrorAlert>
      ) : !list ? (
        <div className="skel" style={{ height: 200 }} aria-hidden="true" />
      ) : (
        <div className="addr-grid">
          {sorted.map((a) => (
            <div className="card addr-card" key={a.id}>
              {(a.isDefault || a.label) && (
                <div className="help-row" style={{ gap: 6 }}>
                  {a.isDefault && <span className="pill ok">Default</span>}
                  {a.label && <span className="pill grey">{a.label}</span>}
                </div>
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
                <button type="button" onClick={() => setEditing(a)} aria-label={`Edit address ${a.addressLine1}`}>
                  Edit
                </button>
                {!a.isDefault && (
                  <button type="button" onClick={() => makeDefault(a)} disabled={busyId === a.id}>
                    Set as default
                  </button>
                )}
                {sorted.length > 1 && (
                  <button
                    type="button"
                    className="del"
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
          <button type="button" className="addr-new" onClick={() => setEditing("new")}>
            + Add a new address
          </button>
        </div>
      )}
      {editing && list && (
        <AddressForm
          key={editing === "new" ? "new" : editing.id}
          address={editing === "new" ? null : editing}
          first={list.length === 0}
          onCancel={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
            toast({ title: "Address saved" });
          }}
        />
      )}
    </>
  );
}

const FIELD_IDS = { name: "aName", l1: "aL1", city: "aCity", state: "aState", zip: "aZip", phone: "aPhone" } as const;
type FKey = keyof typeof FIELD_IDS;
/** Backend field → form field. */
const API_FIELD: Record<string, FKey> = {
  recipientName: "name",
  addressLine1: "l1",
  city: "city",
  state: "state",
  postalCode: "zip",
  phone: "phone",
};

function AddressForm({
  address,
  first,
  onCancel,
  onSaved,
}: {
  address: AddressResponse | null;
  first: boolean;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [v, setV] = useState({
    name: address?.recipientName ?? "",
    label: address?.label ?? "",
    l1: address?.addressLine1 ?? "",
    l2: address?.addressLine2 ?? "",
    city: address?.city ?? "",
    state: address && STATES_US.includes(address.state.toUpperCase()) ? address.state.toUpperCase() : "",
    zip: address?.postalCode ?? "",
    phone: address?.phone ?? "",
    def: address ? address.isDefault : first,
  });
  const [errs, setErrs] = useState<Partial<Record<FKey, string>>>({});
  const [formErr, setFormErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const set = (k: keyof typeof v) => (val: string | boolean) => setV((s) => ({ ...s, [k]: val }));
  const focus = (k: FKey) => formRef.current?.querySelector<HTMLElement>(`#${FIELD_IDS[k]}`)?.focus();

  useEffect(() => {
    formRef.current?.scrollIntoView({ block: "nearest" });
    formRef.current?.querySelector<HTMLInputElement>("#aName")?.focus();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormErr(null);
    const t = (s: string) => s.trim();
    const next: Partial<Record<FKey, string>> = {
      name: t(v.name) ? "" : "Enter a name.",
      l1: /\d/.test(v.l1) ? "" : "Enter a street address with a number.",
      city: t(v.city) ? "" : "Enter a city.",
      state: STATES_US.includes(v.state) ? "" : "Choose a state.",
      zip: ZIP_RE.test(t(v.zip)) ? "" : "Enter a 5-digit ZIP.",
      phone: !t(v.phone) || /^\+?[0-9 ()-]{6,20}$/.test(t(v.phone)) ? "" : "Enter a phone number using digits only.",
    };
    setErrs(next);
    const bad = (Object.keys(FIELD_IDS) as FKey[]).find((k) => next[k]);
    if (bad) return focus(bad);
    setBusy(true);
    const body = {
      label: t(v.label) || undefined,
      recipientName: t(v.name),
      phone: t(v.phone) || undefined,
      addressLine1: t(v.l1),
      addressLine2: t(v.l2) || undefined,
      city: t(v.city),
      state: v.state,
      postalCode: t(v.zip),
      country: "US",
      isDefault: v.def,
    };
    try {
      if (address) await addressService.update(address.id, body);
      else await addressService.create(body);
      onSaved();
    } catch (err) {
      const fe = fieldErrors(err);
      const mapped = Object.fromEntries(
        Object.entries(fe)
          .filter(([k]) => API_FIELD[k])
          .map(([k, m]) => [API_FIELD[k], m])
      ) as Partial<Record<FKey, string>>;
      const firstBad = (Object.keys(FIELD_IDS) as FKey[]).find((k) => mapped[k]);
      if (firstBad) {
        setErrs(mapped);
        focus(firstBad);
      } else setFormErr(getApiErrorMessage(err, "We couldn't save this address. Try again."));
      setBusy(false);
    }
  }

  const input = (k: "name" | "label" | "l1" | "l2" | "city" | "zip" | "phone", id: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => {
    const err = k === "label" || k === "l2" ? undefined : errs[k];
    return (
      <input
        id={id}
        value={v[k]}
        onChange={(e) => set(k)(e.target.value)}
        aria-invalid={!!err || undefined}
        aria-describedby={err ? `${id}-e` : undefined}
        {...extra}
      />
    );
  };

  return (
    <form ref={formRef} className="card form-stack" noValidate onSubmit={submit} aria-labelledby="naH">
      <h2 id="naH">{address ? "Edit address" : "New address"}</h2>
      {formErr && <ErrorAlert>{formErr}</ErrorAlert>}
      <div className="row2">
        <Field id="aName" label="Full name" error={errs.name}>
          {input("name", "aName", { autoComplete: "name" })}
        </Field>
        <div className="field">
          <label htmlFor="aLabel">
            Label <span className="opt">(optional)</span>
          </label>
          {input("label", "aLabel", { placeholder: "Home, Work, Mom's", maxLength: 50 })}
        </div>
      </div>
      <Field id="aL1" label="Street address" error={errs.l1}>
        {input("l1", "aL1", { autoComplete: "address-line1" })}
      </Field>
      <div className="field">
        <label htmlFor="aL2">
          Apt, suite, unit <span className="opt">(optional)</span>
        </label>
        {input("l2", "aL2", { autoComplete: "address-line2" })}
      </div>
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
      {!first && !address?.isDefault && (
        <label className="check">
          <input type="checkbox" checked={v.def} onChange={(e) => set("def")(e.target.checked)} />
          <span>Make this my default address</span>
        </label>
      )}
      <div className="help-row">
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
