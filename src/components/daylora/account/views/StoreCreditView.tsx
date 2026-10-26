"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import storeCreditService from "@/services/account/storeCredit.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type { StoreCredit } from "@/types/api/account.types";
import { Field } from "../SignIn";
import { fmtLong, money, useAccountToast } from "../customerShared";
import { ErrorAlert, ViewHead, fieldErrors, statusOf } from "./settingsShared";

/** "ec25gift2026demo" → "EC25-GIFT-2026-DEMO" as they type. */
const formatCode = (raw: string) =>
  raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1-")
    .replace(/-$/, "");

/**
 * Store credit & gift cards (design 08 #credit, contract C11). Using credit at
 * checkout is a later phase, so the copy doesn't promise it yet.
 */
export default function StoreCreditView() {
  const [data, setData] = useState<StoreCredit | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    storeCreditService
      .get()
      .then((r) => setData(r.data.data ?? null))
      .catch((e) => setError(getApiErrorMessage(e, "We couldn't load your store credit.")));

  useEffect(() => {
    load();
  }, []);

  const cur = data?.currency || "USD";

  return (
    <>
      <ViewHead title="Store credit & gift cards" sub="Credit from returns and gift cards. Using it at checkout is coming soon." />
      {error ? (
        <ErrorAlert>{error}</ErrorAlert>
      ) : !data ? (
        <div className="skel" style={{ height: 320 }} aria-hidden="true" />
      ) : (
        <>
          <div className="bal">
            <div>
              <small>Available balance</small>
              <b>{money(data.balance, cur)}</b>
              {data.pendingFromReturns > 0 && <small>{money(data.pendingFromReturns, cur)} pending from returns</small>}
            </div>
            <Link className="btn btn-primary" href="/">
              Shop now
            </Link>
          </div>
          <RedeemForm currency={cur} onRedeemed={load} />
          <section className="card" aria-labelledby="actH">
            <h2 id="actH">Activity</h2>
            {data.activity.length === 0 ? (
              <p className="note-sm" style={{ fontSize: 14, marginTop: 8 }}>
                No store credit activity yet.
              </p>
            ) : (
              <ul className="hist">
                {data.activity.map((h) => (
                  <li key={h.id}>
                    <span>
                      {h.description}
                      <small>{fmtLong(h.createdAt)}</small>
                    </span>
                    <span className={h.amount > 0 ? "plus" : "minus"}>
                      {h.amount > 0 ? "+" : "−"}
                      {money(Math.abs(h.amount), cur)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  );
}

function RedeemForm({ currency, onRedeemed }: { currency: string; onRedeemed: () => void }) {
  const toast = useAccountToast();
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [errs, setErrs] = useState<{ code?: string; pin?: string }>({});
  const [busy, setBusy] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<HTMLInputElement>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const raw = code.replace(/-/g, "");
    const next = {
      code: raw.length === 16 ? "" : "Check the gift card number.",
      pin: /^\d{4}$/.test(pin) ? "" : "Enter the 4-digit PIN on the back.",
    };
    setErrs(next);
    if (next.code) return codeRef.current?.focus();
    if (next.pin) return pinRef.current?.focus();
    setBusy(true);
    try {
      const r = await storeCreditService.redeem(raw, pin);
      const added = r.data.data?.added ?? 0;
      setCode("");
      setPin("");
      onRedeemed();
      toast({ title: `${money(added, currency)} added`, body: "It's in your store credit balance." });
    } catch (err) {
      const status = statusOf(err);
      const fe = fieldErrors(err);
      if (fe.pin && !fe.code) {
        setErrs({ pin: fe.pin });
        pinRef.current?.focus();
      } else {
        const msg =
          fe.code ??
          (status === 404
            ? "We couldn't find a gift card with that number and PIN."
            : status === 409
              ? "This gift card has already been added."
              : status === 429
                ? "Too many attempts. Wait 15 minutes and try again."
                : getApiErrorMessage(err, "We couldn't add this gift card. Try again."));
        setErrs({ code: msg });
        codeRef.current?.focus();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card form-stack" noValidate onSubmit={submit} aria-labelledby="gcH">
      <h2 id="gcH">Redeem a gift card</h2>
      <div className="row2">
        <Field id="gcCode" label="Gift card number" error={errs.code}>
          <input
            ref={codeRef}
            id="gcCode"
            placeholder="XXXX-XXXX-XXXX-XXXX"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            maxLength={19}
            value={code}
            onChange={(e) => setCode(formatCode(e.target.value))}
            aria-invalid={!!errs.code || undefined}
            aria-describedby={errs.code ? "gcCode-e" : undefined}
          />
        </Field>
        <Field id="gcPin" label="PIN" error={errs.pin}>
          <input
            ref={pinRef}
            id="gcPin"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            placeholder="4 digits"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            aria-invalid={!!errs.pin || undefined}
            aria-describedby={errs.pin ? "gcPin-e" : undefined}
          />
        </Field>
      </div>
      <div>
        <button className="btn btn-secondary" type="submit" disabled={busy}>
          {busy ? "Adding…" : "Add to balance"}
        </button>
      </div>
    </form>
  );
}
