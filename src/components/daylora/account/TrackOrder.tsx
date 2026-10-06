"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { DayloraIcon } from "../DayloraIcons";
import orderService from "@/services/order.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type { TrackedOrder } from "@/types/api/order.types";
import { Field } from "./SignIn";
import { Crumbs, Scans, Steps, Thumb, TrackingRef, headline, normalizeOrderNumber, orderNumberOk, variantText } from "./customerShared";

/** Guest order tracking: order number + the order's email or 5-digit ZIP (design 09). */
export function TrackOrder() {
  const qs = useSearchParams();
  const [no, setNo] = useState(qs.get("o") ?? "");
  const [key, setKey] = useState("");
  const [errs, setErrs] = useState<{ no?: string; key?: string }>({});
  const [notFound, setNotFound] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const noRef = useRef<HTMLInputElement>(null);
  const keyRef = useRef<HTMLInputElement>(null);
  const outRef = useRef<HTMLHeadingElement>(null);

  // A prefilled order number (?o=) puts the cursor on the second field.
  useEffect(() => {
    if (qs.get("o")) keyRef.current?.focus();
  }, [qs]);

  useEffect(() => {
    if (order) outRef.current?.focus();
  }, [order]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setNotFound(false);
    setFailed(null);
    setOrder(null);
    const n = no.trim();
    const k = key.trim();
    const next = {
      no: !n ? "Enter your order number." : !orderNumberOk(n) ? "Order numbers look like EC-4821907." : "",
      key: !k ? "Enter the email or billing ZIP code used for the order." : "",
    };
    setErrs(next);
    if (next.no) return noRef.current?.focus();
    if (next.key) return keyRef.current?.focus();
    setBusy(true);
    try {
      const res = await orderService.track(normalizeOrderNumber(n), k);
      setOrder(res.data.data ?? null);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404 || status === 400) setNotFound(true);
      else if (status === 429) setFailed("Too many lookups. Wait a minute and try again.");
      else setFailed(getApiErrorMessage(err, "We couldn't look up that order right now. Try again in a moment."));
    } finally {
      setBusy(false);
    }
  }

  const h = order ? headline(order) : null;
  const shipment = order?.shipments[0];

  return (
    <main id="main" className="cx pg trk">
      <div className="daylora-container trk-wrap">
        <Crumbs trail={[{ label: "Home", href: "/" }, { label: "Track an order" }]} />
        <div className="pg-head">
          <div>
            <h1>Track an order</h1>
            <p>No account needed. Use the order number from your confirmation email.</p>
          </div>
        </div>
        <form className="card trk-form" noValidate onSubmit={submit} aria-label="Find your order">
          <Field
            id="tNo"
            label="Order number"
            error={errs.no}
            hint={
              <p className="hint" id="tNo-h">
                Starts with EC-, in your confirmation email
              </p>
            }
          >
            <input
              ref={noRef}
              id="tNo"
              placeholder="EC-4821907"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              value={no}
              onChange={(e) => setNo(e.target.value)}
              aria-invalid={!!errs.no || undefined}
              aria-describedby={errs.no ? "tNo-e tNo-h" : "tNo-h"}
            />
          </Field>
          <Field id="tKey" label="Email or billing ZIP code" error={errs.key}>
            <input
              ref={keyRef}
              id="tKey"
              autoComplete="email"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              aria-invalid={!!errs.key || undefined}
              aria-describedby={errs.key ? "tKey-e" : undefined}
            />
          </Field>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Looking…" : "Track order"}
          </button>
        </form>

        {(notFound || failed) && (
          <div className="alert err trk-err" role="alert">
            <DayloraIcon name="alert" />
            <span>
              {notFound ? (
                <>
                  We couldn&apos;t find an order with those details. Check the order number and use the email or ZIP code from
                  checkout. Still stuck? <Link href="/help?t=contact">Contact us</Link>.
                </>
              ) : (
                failed
              )}
            </span>
          </div>
        )}

        <div className="trk-out" aria-live="polite" hidden={!order}>
          {order && h && (
            <>
              <section className="card" aria-labelledby="th">
                <div className="trk-h">
                  <h2 id="th" ref={outRef} tabIndex={-1} className={`oc-st ${h.tone}`}>
                    {h.label}
                  </h2>
                  <p>
                    Order <span className="mono">{order.orderNumber}</span>
                    {shipment && (
                      <>
                        {" "}
                        · <TrackingRef shipment={shipment} />
                      </>
                    )}
                  </p>
                </div>
                {h.line && <p className="oc-sub trk-line">{h.line}</p>}
                <Steps order={order} />
                <div className="ti" aria-label="Items in this order" role="list">
                  {order.items.map((i, n) => (
                    <span role="listitem" key={n} title={`${i.productName}${variantText(i) ? ` · ${variantText(i)}` : ""}`}>
                      <Thumb src={i.imageUrl} alt={`${i.productName}${i.quantity > 1 ? `, quantity ${i.quantity}` : ""}`} />
                    </span>
                  ))}
                </div>
                <h3 className="scans-h">Tracking history</h3>
                <Scans order={order} />
              </section>
              <p className="trk-note">
                Shipping to {order.shipTo.city}, {order.shipTo.state} {order.shipTo.postalCode5}. For your privacy we only show the
                city.
              </p>
            </>
          )}
        </div>
        <p className="trk-more">
          Have an account?{" "}
          <Link href="/login?next=track" className="link inline">
            Sign in
          </Link>{" "}
          to see all your orders.
        </p>
      </div>
    </main>
  );
}
