"use client";

import { useEffect, useState, type FormEvent } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import paymentMethodsService from "@/services/account/paymentMethods.service";
import { useStoreConfigState } from "@/hooks/useStoreConfig";
import { getApiErrorMessage } from "@/lib/apiError";
import type { SavedPaymentMethod } from "@/types/api/account.types";
import { useAccountToast } from "../customerShared";
import { EmptyBox, ErrorAlert, ViewHead } from "./settingsShared";

const BRAND: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "Amex",
  american_express: "Amex",
  discover: "Discover",
  diners: "Diners Club",
  jcb: "JCB",
  unionpay: "UnionPay",
};
const brandName = (p: SavedPaymentMethod) =>
  p.type === "PAYPAL" ? "PayPal" : (p.brand && (BRAND[p.brand.toLowerCase()] ?? p.brand)) || "Card";
const expiry = (p: SavedPaymentMethod) =>
  p.expMonth && p.expYear ? `${String(p.expMonth).padStart(2, "0")}/${String(p.expYear).slice(-2)}` : "";

const stripeCache = new Map<string, Promise<Stripe | null>>();
const getStripe = (key: string) => {
  if (!stripeCache.has(key)) stripeCache.set(key, loadStripe(key));
  return stripeCache.get(key)!;
};

/**
 * Payment methods (design 08 #payments, contract C12). Cards are saved with a
 * Stripe SetupIntent and Stripe's Payment Element, so card numbers never touch
 * our code or API. Without Stripe the page says so honestly.
 */
export default function PaymentsView() {
  const { config, loading, failed } = useStoreConfigState();
  const enabled = !!config?.savedPaymentMethods && config.paymentProvider === "stripe" && !!config.stripePublishableKey;

  return (
    <>
      <ViewHead title="Payment methods" sub="Saved securely with our payment provider. We never store your full card number." />
      {loading ? (
        <div className="skel" style={{ height: 180 }} aria-hidden="true" />
      ) : failed ? (
        <ErrorAlert>We couldn&apos;t load your payment methods. Refresh the page to try again.</ErrorAlert>
      ) : enabled ? (
        <SavedCards stripeKey={config!.stripePublishableKey!} />
      ) : (
        <EmptyBox icon="card" title="No saved cards" text="Saved cards are coming soon. You can pay securely at checkout." />
      )}
    </>
  );
}

function SavedCards({ stripeKey }: { stripeKey: string }) {
  const toast = useAccountToast();
  const [list, setList] = useState<SavedPaymentMethod[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () =>
    paymentMethodsService
      .list()
      .then((r) => setList(r.data.data ?? []))
      .catch((e) => setError(getApiErrorMessage(e, "We couldn't load your payment methods.")));

  useEffect(() => {
    load();
  }, []);

  async function makeDefault(p: SavedPaymentMethod) {
    setBusyId(p.id);
    try {
      await paymentMethodsService.setDefault(p.id);
      await load();
      toast({ title: "Default payment updated" });
    } catch (e) {
      toast({ title: "Couldn't update the payment method", body: getApiErrorMessage(e, "Try again.") });
    } finally {
      setBusyId(null);
    }
  }

  async function remove(p: SavedPaymentMethod) {
    setBusyId(p.id);
    try {
      await paymentMethodsService.remove(p.id);
      setConfirmId(null);
      await load();
      toast({ title: "Payment method removed" });
    } catch (e) {
      toast({ title: "Couldn't remove the payment method", body: getApiErrorMessage(e, "Try again.") });
    } finally {
      setBusyId(null);
    }
  }

  if (error) return <ErrorAlert>{error}</ErrorAlert>;
  if (!list) return <div className="skel" style={{ height: 180 }} aria-hidden="true" />;

  const sorted = list.slice().sort((a, b) => Number(b.isDefault) - Number(a.isDefault));

  return (
    <>
      <div className="addr-grid">
        {sorted.map((p) => {
          const name = brandName(p);
          const pp = p.type === "PAYPAL";
          return (
            <div className="card addr-card" key={p.id}>
              <div className="paycard">
                <span className={`cardart${pp ? " pp" : ""}`} aria-hidden="true">
                  {name.toUpperCase()}
                  <i>{p.last4 ? `•••• ${p.last4}` : ""}</i>
                </span>
                <div>
                  <b>{pp ? "PayPal" : `${name} ending in ${p.last4 ?? "····"}`}</b>
                  <small>{pp ? p.email ?? "" : [expiry(p) && `Expires ${expiry(p)}`, p.holderName].filter(Boolean).join(" · ")}</small>
                </div>
              </div>
              {p.isDefault && (
                <span className="pill ok" style={{ alignSelf: "flex-start" }}>
                  Default
                </span>
              )}
              <div className="acts">
                {!p.isDefault && (
                  <button type="button" onClick={() => makeDefault(p)} disabled={busyId === p.id}>
                    Set as default
                  </button>
                )}
                <button
                  type="button"
                  className="del"
                  onClick={() => setConfirmId(p.id)}
                  aria-label={pp ? "Remove PayPal" : `Remove ${name} ending in ${p.last4}`}
                >
                  Remove
                </button>
              </div>
              {confirmId === p.id && (
                <div className="confirm pay-confirm" role="group" aria-label="Confirm removal">
                  <span className="sp">Remove {pp ? "PayPal" : "this card"}?</span>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setConfirmId(null)}>
                    Keep
                  </button>
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => remove(p)} disabled={busyId === p.id}>
                    Remove
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {!adding && (
          <button type="button" className="addr-new" onClick={() => setAdding(true)}>
            + Add a card
          </button>
        )}
      </div>
      {adding && (
        <AddCard
          stripeKey={stripeKey}
          first={list.length === 0}
          onCancel={() => setAdding(false)}
          onSaved={async (p) => {
            setAdding(false);
            await load();
            toast({ title: "Card saved", body: `${brandName(p)} ending in ${p.last4}` });
          }}
        />
      )}
    </>
  );
}

/** Creates a SetupIntent, then shows Stripe's Payment Element bound to it. */
function AddCard({
  stripeKey,
  first,
  onCancel,
  onSaved,
}: {
  stripeKey: string;
  first: boolean;
  onCancel: () => void;
  onSaved: (p: SavedPaymentMethod) => void;
}) {
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    paymentMethodsService
      .setupIntent()
      .then((r) => setSecret(r.data.data?.clientSecret ?? null))
      .catch((e) => setError(getApiErrorMessage(e, "We couldn't start adding a card. Try again.")));
  }, []);

  return (
    <section className="card form-stack" aria-labelledby="acH">
      <h2 id="acH">Add a card</h2>
      {error ? (
        <>
          <ErrorAlert>{error}</ErrorAlert>
          <div>
            <button className="btn btn-secondary" type="button" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </>
      ) : !secret ? (
        <div className="skel" style={{ height: 160 }} aria-hidden="true" />
      ) : (
        <Elements
          stripe={getStripe(stripeKey)}
          options={{
            clientSecret: secret,
            appearance: {
              theme: "stripe",
              variables: { colorPrimary: "#16794C", colorText: "#1A2433", colorDanger: "#B42318", borderRadius: "8px", fontFamily: "Inter, system-ui, sans-serif" },
            },
          }}
        >
          <AddCardForm secret={secret} first={first} onCancel={onCancel} onSaved={onSaved} />
        </Elements>
      )}
    </section>
  );
}

function AddCardForm({
  secret,
  first,
  onCancel,
  onSaved,
}: {
  secret: string;
  first: boolean;
  onCancel: () => void;
  onSaved: (p: SavedPaymentMethod) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [def, setDef] = useState(first);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return setError("The card form is still loading. Try again in a moment.");
    setError(null);
    setBusy(true);
    try {
      const { error: se, setupIntent } = await stripe.confirmSetup({
        elements,
        clientSecret: secret,
        confirmParams: { return_url: `${window.location.origin}/account#payments` },
        redirect: "if_required",
      });
      if (se) throw new Error(se.message ?? "Check your card details.");
      const pm = setupIntent?.payment_method;
      const pmId = typeof pm === "string" ? pm : pm?.id;
      if (!pmId) throw new Error("We couldn't save this card. Try again.");
      const r = await paymentMethodsService.add(pmId, def);
      onSaved(r.data.data!);
    } catch (err) {
      setError(getApiErrorMessage(err, "We couldn't save this card. Try again."));
      setBusy(false);
    }
  }

  return (
    <form className="form-stack" noValidate onSubmit={submit}>
      {error && <ErrorAlert>{error}</ErrorAlert>}
      <div className="stripe-box">
        <PaymentElement options={{ layout: "tabs", wallets: { applePay: "never", googlePay: "never" } }} />
      </div>
      {!first && (
        <label className="check">
          <input type="checkbox" checked={def} onChange={(e) => setDef(e.target.checked)} />
          <span>Make this my default payment method</span>
        </label>
      )}
      <div className="help-row">
        <button className="btn btn-primary" type="submit" disabled={busy || !stripe}>
          {busy ? "Saving…" : "Save card"}
        </button>
        <button className="btn btn-secondary" type="button" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  );
}
