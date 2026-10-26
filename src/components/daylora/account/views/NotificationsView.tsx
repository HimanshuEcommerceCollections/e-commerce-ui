"use client";

import { useEffect, useState } from "react";
import notificationPrefsService from "@/services/account/notificationPrefs.service";
import { useStoreConfig } from "@/hooks/useStoreConfig";
import { getApiErrorMessage } from "@/lib/apiError";
import type { NotificationPrefKey, NotificationPrefs } from "@/types/api/account.types";
import { useAccountToast } from "../customerShared";
import { ErrorAlert, Switch, ViewHead, fieldErrors, useGoLink } from "./settingsShared";

const EMAIL_ROWS: { k: NotificationPrefKey; t: string; s: string }[] = [
  { k: "deals", t: "Deals and offers", s: "Today's deals and members-only offers, about 2 a week." },
  { k: "newArrivals", t: "New arrivals", s: "A weekly roundup of what's new." },
  { k: "priceDrops", t: "Price drops on saved items", s: "When something you saved gets cheaper." },
  { k: "backInStock", t: "Back in stock", s: "When a saved item is available again." },
  { k: "reviewReminders", t: "Review reminders", s: "A reminder to review items a week after delivery." },
];

/** Notifications: email and text preferences that save right away (design 08 #notifications, contract C10). */
export default function NotificationsView() {
  const toast = useAccountToast();
  const goLink = useGoLink();
  const config = useStoreConfig();
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [smsErr, setSmsErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    notificationPrefsService
      .get()
      .then((r) => setPrefs(r.data.data ?? null))
      .catch((e) => setError(getApiErrorMessage(e, "We couldn't load your notification settings.")));
  }, []);

  async function change(k: NotificationPrefKey, on: boolean, label: string) {
    if (!prefs) return;
    const before = prefs;
    setPrefs({ ...prefs, [k]: on }); // optimistic; undone if the save fails
    setBusy(k);
    if (k === "smsDelivery") setSmsErr(null);
    try {
      const r = await notificationPrefsService.update({ [k]: on });
      if (r.data.data) setPrefs(r.data.data);
      toast({ title: on ? "Turned on" : "Turned off", body: label });
    } catch (e) {
      setPrefs(before);
      const msg = fieldErrors(e)[k] ?? getApiErrorMessage(e, "We couldn't save that change. Try again.");
      if (k === "smsDelivery") setSmsErr(msg);
      else toast({ title: "Couldn't save that change", body: msg });
    } finally {
      setBusy(null);
    }
  }

  async function unsubscribeAll() {
    setBusy("all");
    try {
      const r = await notificationPrefsService.unsubscribeAll();
      if (r.data.data) setPrefs(r.data.data);
      toast({ title: "Unsubscribed from marketing", body: "Order updates still on." });
    } catch (e) {
      toast({ title: "Couldn't unsubscribe", body: getApiErrorMessage(e, "Try again.") });
    } finally {
      setBusy(null);
    }
  }

  const row = (k: string, t: string, s: React.ReactNode, on: boolean, onChange?: (v: boolean) => void, disabled?: boolean) => (
    <div className="row-set" key={k}>
      <span>
        <b id={`nl-${k}`}>{t}</b>
        <small>{s}</small>
      </span>
      <Switch checked={on} labelledBy={`nl-${k}`} disabled={disabled} onChange={onChange} />
    </div>
  );

  return (
    <>
      <ViewHead title="Notifications" sub="Choose what we send you. Changes save right away." />
      {error ? (
        <ErrorAlert>{error}</ErrorAlert>
      ) : !prefs ? (
        <div className="skel" style={{ height: 420 }} aria-hidden="true" />
      ) : (
        <>
          <section className="card" aria-labelledby="neH">
            <h2 id="neH">Email</h2>
            {row(
              "orderUpdates",
              "Order and delivery updates",
              "Confirmations, shipping and delivery. Always on while you have an order.",
              true,
              undefined,
              true
            )}
            {EMAIL_ROWS.map((r) => row(r.k, r.t, r.s, prefs[r.k], (v) => change(r.k, v, r.t), busy === r.k || busy === "all"))}
          </section>
          <section className="card" aria-labelledby="ntH">
            <h2 id="ntH">Text messages</h2>
            {row(
              "smsDelivery",
              "Delivery texts",
              `Out for delivery and delivered alerts to ${prefs.phone || "your phone"}. Message and data rates may apply. Reply STOP to opt out.`,
              prefs.smsDelivery,
              (v) => change("smsDelivery", v, "Delivery texts"),
              busy === "smsDelivery"
            )}
            {config && config.smsAvailable !== true && (
              <p className="note-sm">Text messages aren&apos;t connected in this store yet, so we&apos;ll start sending them once they are.</p>
            )}
            {smsErr && (
              <div style={{ paddingTop: 12 }}>
                <ErrorAlert>
                  {smsErr}
                  {/mobile number/i.test(smsErr) && (
                    <>
                      {" "}
                      <a {...goLink("profile")}>Go to Profile</a>
                    </>
                  )}
                </ErrorAlert>
              </div>
            )}
          </section>
          <section className="card">
            <div className="row-set">
              <span>
                <b>Unsubscribe from all marketing</b>
                <small>You&apos;ll still get messages about your orders and account.</small>
              </span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={unsubscribeAll} disabled={busy === "all"}>
                Unsubscribe
              </button>
            </div>
          </section>
        </>
      )}
    </>
  );
}
