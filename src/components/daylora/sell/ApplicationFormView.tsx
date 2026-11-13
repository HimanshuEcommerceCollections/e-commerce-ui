"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { DayloraIcon } from "../DayloraIcons";
import onboardingService from "@/services/supplier/onboarding.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type { ApplicationForm, MyApplication } from "@/types/api/supplier.types";
import {
  BUSINESS_TYPES,
  CARRIERS,
  CATEGORIES,
  FEEDS,
  FEED_LABEL,
  FIELD_STEP,
  FORM_STEPS,
  HANDLING,
  OWN_BRAND,
  PRODUCT_COUNTS,
  STATES,
  YEARS,
  YES_NO,
  critFails,
  formatEin,
  stepErrors,
  type FormErrors,
} from "./applicationRules";

type Save = "idle" | "saving" | "saved" | "error";

/** The five-step application, saved as a server-side draft while it's filled in. */
export function ApplicationFormView({
  app,
  onChange,
  onSubmitted,
}: {
  app: MyApplication | null;
  onChange: (a: MyApplication) => void;
  onSubmitted: (a: MyApplication) => void;
}) {
  const [A, setA] = useState<ApplicationForm>(() => ({ categories: [], carriers: [], ...(app?.form ?? {}) }));
  const [step, setStep] = useState(() => Math.min(Math.max(app?.step ?? 0, 0), 4));
  const [errs, setErrs] = useState<FormErrors>({});
  const [agree, setAgree] = useState(false);
  const [save, setSave] = useState<Save>("idle");
  const [busy, setBusy] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const dirty = useRef(false);
  const latest = useRef({ A, step });
  latest.current = { A, step };

  const persist = async (form: ApplicationForm, s: number) => {
    setSave("saving");
    try {
      const r = await onboardingService.save({ step: s, form });
      dirty.current = false;
      setSave("saved");
      if (r.data.data) onChange(r.data.data);
    } catch {
      setSave("error");
    }
  };

  // Saved automatically, a moment after the last change.
  useEffect(() => {
    if (!dirty.current) return;
    const t = setTimeout(() => persist(latest.current.A, latest.current.step), 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [A]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const set = <K extends keyof ApplicationForm>(k: K, value: ApplicationForm[K]) => {
    dirty.current = true;
    setA((a) => ({ ...a, [k]: value }));
    if (errs[k]) setErrs((e) => ({ ...e, [k]: undefined }));
  };

  const go = (s: number) => {
    setErrs({});
    setApiError(null);
    setStep(s);
    persist(A, s);
  };

  const focusFirst = (er: FormErrors) => {
    const k = Object.keys(er)[0];
    if (!k) return;
    requestAnimationFrame(() => {
      const el = document.getElementById(k) ?? document.querySelector<HTMLElement>(`#w-${k} input`);
      el?.focus({ preventScroll: true });
      (document.getElementById(`w-${k}`) ?? el)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setApiError(null);
    if (step < 4) {
      const er = stepErrors(step, A);
      setErrs(er);
      if (Object.keys(er).length) return focusFirst(er);
      go(step + 1);
      return;
    }
    if (!agree) {
      setErrs({ agree: "Tick the box to confirm" });
      return focusFirst({ agree: "x" });
    }
    setBusy(true);
    try {
      await onboardingService.save({ step: 4, form: A });
      const r = await onboardingService.submit();
      onSubmitted(r.data.data!);
    } catch (err) {
      const data = (err as { response?: { data?: { data?: Record<string, string> } } })?.response?.data?.data;
      const fields = data && typeof data === "object" ? Object.keys(data).filter((k) => k in FIELD_STEP) : [];
      if (fields.length) {
        const er: FormErrors = Object.fromEntries(fields.map((k) => [k, data![k]]));
        setStep(Math.min(...fields.map((k) => FIELD_STEP[k])));
        setErrs(er);
        focusFirst(er);
      } else {
        setApiError(getApiErrorMessage(err, "We couldn't submit your application. Please try again."));
      }
    } finally {
      setBusy(false);
    }
  }

  // ── Field helpers ──
  const F = (id: keyof ApplicationForm, label: string, control: ReactNode, o: { req?: boolean; help?: string; opt?: string; full?: boolean } = {}) => (
    <div className={`field${errs[id] ? " invalid" : ""}${o.full ? " full" : ""}`} id={`w-${id}`}>
      <label htmlFor={id}>
        {label}
        {o.req !== false ? <span className="req"> *</span> : null}
        {o.opt ? <span className="opt-tag"> {o.opt}</span> : null}
      </label>
      {control}
      {o.help ? <span className="hint">{o.help}</span> : null}
      {errs[id] ? (
        <p className="err" id={`${id}-e`}>
          <DayloraIcon name="alert" />
          {errs[id]}
        </p>
      ) : null}
    </div>
  );
  const inv = (id: keyof ApplicationForm) => ({ "aria-invalid": !!errs[id], "aria-describedby": errs[id] ? `${id}-e` : undefined });
  const text = (id: keyof ApplicationForm, attrs: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input className="input" id={id} name={id} value={(A[id] as string) ?? ""} onChange={(e) => set(id, e.target.value)} {...inv(id)} {...attrs} />
  );
  const select = (id: keyof ApplicationForm, options: string[], placeholder = "Choose one", attrs: React.SelectHTMLAttributes<HTMLSelectElement> = {}) => (
    <select className="input" id={id} value={(A[id] as string) ?? ""} onChange={(e) => set(id, e.target.value)} {...inv(id)} {...attrs}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
  const radio = (id: keyof ApplicationForm, label: string, options: Array<[string, string]>, full = false) => (
    <fieldset className={`field${errs[id] ? " invalid" : ""}${full ? " full" : ""}`} id={`w-${id}`}>
      <legend>
        {label}
        <span className="req"> *</span>
      </legend>
      <div className="seg" role="radiogroup">
        {options.map(([value, l]) => (
          <label key={value} className="segopt">
            <input type="radio" name={id} value={value} checked={A[id] === value} onChange={() => set(id, value)} />
            <span>{l}</span>
          </label>
        ))}
      </div>
      {errs[id] ? (
        <p className="err">
          <DayloraIcon name="alert" />
          {errs[id]}
        </p>
      ) : null}
    </fieldset>
  );
  const toggle = (id: "categories" | "carriers", value: string) => {
    const cur = A[id] ?? [];
    set(id, cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value]);
  };

  let body: ReactNode = null;
  if (step === 0)
    body = (
      <>
        <h2 className="obh">Your company</h2>
        <p className="obd">The legal details we’ll use for your seller agreement and payments.</p>
        <div className="g2">
          {F("legalName", "Legal business name", text("legalName", { autoComplete: "organization" }))}
          {F("tradingName", "Trading name", text("tradingName"), { req: false, opt: "If different" })}
          {F("ein", "EIN (Employer Identification Number)", text("ein", { inputMode: "numeric", placeholder: "12-3456789", maxLength: 10, onChange: (e) => set("ein", formatEin(e.target.value)) }), { help: "9 digits, from your IRS letter." })}
          {F("website", "Website", text("website", { type: "url", placeholder: "https://" }), { req: false })}
          {F("businessType", "Business type", select("businessType", BUSINESS_TYPES))}
          {F("yearsInBusiness", "Years in business", select("yearsInBusiness", YEARS))}
          {F("phone", "Business phone", text("phone", { type: "tel", autoComplete: "tel", placeholder: "(555) 123-4567" }))}
          <span />
          {F("street", "Business address", text("street", { autoComplete: "street-address", placeholder: "Street and number" }), { full: true })}
          {F("city", "City", text("city", { autoComplete: "address-level2" }))}
          <div className="g2 tight">
            {F("state", "State", select("state", STATES, "State", { autoComplete: "address-level1" }))}
            {F("zip", "ZIP", text("zip", { inputMode: "numeric", autoComplete: "postal-code", maxLength: 10 }))}
          </div>
        </div>
      </>
    );
  if (step === 1)
    body = (
      <>
        <h2 className="obh">What you sell</h2>
        <p className="obd">Your approved categories decide what you can upload later.</p>
        <fieldset className={`field full${errs.categories ? " invalid" : ""}`} id="w-categories">
          <legend>
            Categories <span className="req">*</span> <span className="opt-tag">Choose all that apply</span>
          </legend>
          <div className="chips">
            {CATEGORIES.map((c) => (
              <label key={c} className="chip">
                <input type="checkbox" value={c} checked={(A.categories ?? []).includes(c)} onChange={() => toggle("categories", c)} />
                <span>{c}</span>
              </label>
            ))}
          </div>
          {errs.categories ? (
            <p className="err">
              <DayloraIcon name="alert" />
              {errs.categories}
            </p>
          ) : null}
        </fieldset>
        <div className="g2 mt">
          {F("productCount", "How many products could you list?", select("productCount", PRODUCT_COUNTS))}
          {radio("ownBrand", "Do you sell your own brand?", OWN_BRAND)}
          {F("brands", "Brands you sell", text("brands", { placeholder: "e.g. Northwind Home, Cedar & Co." }), { full: true, help: "Separate with commas. We check these against our restricted brands list." })}
        </div>
      </>
    );
  if (step === 2)
    body = (
      <>
        <h2 className="obh">Shipping</h2>
        <p className="obd">We sell across the US, so these two are must-haves.</p>
        <div className="g2">
          {radio("usWarehouse", "Do you ship from a warehouse in the US?", YES_NO, true)}
          {A.usWarehouse === "yes" ? F("warehouseState", "Warehouse state", select("warehouseState", STATES, "State")) : null}
          {radio("shipsAllStates", "Can you ship to all 50 states, including Alaska and Hawaii?", YES_NO, true)}
          {F("handlingTime", "Usual handling time", select("handlingTime", HANDLING), { help: "From order to handing the parcel to the carrier." })}
          <fieldset className="field" id="w-carriers">
            <legend>
              Carriers you use <span className="opt-tag">Optional</span>
            </legend>
            <div className="chips">
              {CARRIERS.map((c) => (
                <label key={c} className="chip">
                  <input type="checkbox" value={c} checked={(A.carriers ?? []).includes(c)} onChange={() => toggle("carriers", c)} />
                  <span>{c}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        {A.usWarehouse === "no" || A.shipsAllStates === "no" ? (
          <div className="alert warn mt">
            <DayloraIcon name="alert" />
            <span>We can only work with suppliers who ship from the US to all 50 states. You can still submit, but we won’t be able to approve the application.</span>
          </div>
        ) : null}
      </>
    );
  if (step === 3)
    body = (
      <>
        <h2 className="obh">Product data</h2>
        <p className="obd">How you’ll get your products to us. Bulk upload works for everyone.</p>
        <fieldset className={`field full${errs.productData ? " invalid" : ""}`} id="w-productData">
          <legend>
            How can you share your product data? <span className="req">*</span>
          </legend>
          <div className="feeds">
            {FEEDS.map(([value, t, d]) => (
              <label key={value} className="feed">
                <input type="radio" name="productData" value={value} checked={A.productData === value} onChange={() => set("productData", value)} />
                <span>
                  <b>{t}</b>
                  <small>{d}</small>
                </span>
              </label>
            ))}
          </div>
          {errs.productData ? (
            <p className="err">
              <DayloraIcon name="alert" />
              {errs.productData}
            </p>
          ) : null}
        </fieldset>
        <div className="g2 mt">
          {F(
            "moq",
            "Minimum order quantity (MOQ)",
            <span className="unit">
              {text("moq", { inputMode: "numeric", placeholder: "1" })}
              <span>units</span>
            </span>,
            { help: "The smallest quantity per order. As a dropship supplier this is usually 1." },
          )}
          {F("notes", "Anything else we should know?", <textarea className="input" id="notes" value={A.notes ?? ""} onChange={(e) => set("notes", e.target.value)} maxLength={2000} />, { req: false, full: true })}
        </div>
      </>
    );
  if (step === 4) {
    const crit = critFails(A);
    const rows: Array<[string, number, Array<[string, string | undefined]>]> = [
      ["Company", 0, [["Legal name", A.legalName], ["EIN", A.ein], ["Business type", A.businessType], ["Address", [A.street, A.city, A.state, A.zip].filter(Boolean).join(", ")]]],
      ["Products", 1, [["Categories", (A.categories ?? []).join(", ")], ["Products to list", A.productCount], ["Brands", A.brands]]],
      ["Shipping", 2, [["US warehouse", A.usWarehouse === "yes" ? `Yes, ${A.warehouseState ?? ""}` : A.usWarehouse ? "No" : undefined], ["All 50 states", A.shipsAllStates === "yes" ? "Yes" : A.shipsAllStates ? "No" : undefined], ["Handling time", A.handlingTime]]],
      ["Product data", 3, [["Shared as", A.productData ? FEED_LABEL[A.productData] : undefined], ["MOQ", A.moq]]],
    ];
    body = (
      <>
        <h2 className="obh">Check and submit</h2>
        <p className="obd">Our catalog manager reviews applications with a scorecard. You’ll hear back by email.</p>
        {crit.length ? (
          <div className="alert bad mb">
            <DayloraIcon name="alert" />
            <div>
              <b>We won’t be able to approve this application</b>
              <ul>
                {crit.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <span className="block">Change your answers if this isn’t right, or contact us if your situation changes.</span>
            </div>
          </div>
        ) : null}
        <div className="revgrid">
          {rows.map(([t, s, kv]) => (
            <section key={t} className="revc">
              <div className="revh">
                <h3>{t}</h3>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => go(s)}>
                  Edit
                </button>
              </div>
              <dl className="kv">
                {kv.map(([k, val]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{val || "—"}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
        <div className={`field mt${errs.agree ? " invalid" : ""}`} id="w-agree">
          <label className="consent">
            <input type="checkbox" id="agree" checked={agree} onChange={(e) => { setAgree(e.target.checked); setErrs({}); }} />
            <span>I confirm these details are correct and I’m authorised to apply for {A.legalName || app?.companyName || "my company"}.</span>
          </label>
          {errs.agree ? (
            <p className="err">
              <DayloraIcon name="alert" />
              {errs.agree}
            </p>
          ) : null}
        </div>
      </>
    );
  }

  return (
    <>
      <p className="crumb">Application · step {step + 1} of 5</p>
      <h1 className="sr-only" tabIndex={-1}>
        Seller application
      </h1>
      <ol className="substeps" aria-label="Application steps">
        {FORM_STEPS.map((s, i) => (
          <li key={s} className={i < step ? "done" : i === step ? "now" : ""} aria-current={i === step ? "step" : undefined}>
            {i < step ? "✓ " : ""}
            {s}
          </li>
        ))}
      </ol>
      <form className="form-card obcard" noValidate onSubmit={submit}>
        {apiError ? (
          <div className="alert bad mb" role="alert">
            <DayloraIcon name="alert" />
            <span>{apiError}</span>
          </div>
        ) : null}
        {body}
        <div className="obnav">
          <button type="button" className="btn btn-secondary" style={step ? undefined : { visibility: "hidden" }} onClick={() => go(step - 1)}>
            Back
          </button>
          <span className="hint" aria-live="polite">
            {save === "saving" ? "Saving…" : save === "error" ? "Couldn’t save. Check your connection." : "Saved automatically"}
          </span>
          <button className="btn btn-primary" disabled={busy}>
            {step === 4 ? (busy ? "Submitting…" : "Submit application") : "Continue"}
          </button>
        </div>
      </form>
    </>
  );
}
