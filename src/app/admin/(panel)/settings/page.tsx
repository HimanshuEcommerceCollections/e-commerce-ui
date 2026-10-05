"use client";
import { useEffect, useState, type ReactNode } from "react";
import adminService from "@/services/admin/admin.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type { AdminSettings } from "@/types/api/admin.types";
import { Icon, money } from "@/components/admin/ui";

const yes = (b: boolean) => <span className={`pill ${b ? "p-ok" : "p-grey"}`}>{b ? "On" : "Off"}</span>;
const provider = (p: string) => (p === "manual" ? "Manual" : p.charAt(0).toUpperCase() + p.slice(1));
const amount = (v: string | number | null | undefined, currency: string) =>
  v === null || v === undefined ? "—" : money(Number(v), currency);

/** Store configuration, read-only: it comes from the server's environment. */
export default function AdminSettingsPage() {
  const [s, setS] = useState<AdminSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminService
      .settings()
      .then((r) => setS(r.data.data))
      .catch((err) => setError(getApiErrorMessage(err, "Couldn't load settings")));
  }, []);

  return (
    <section aria-labelledby="h-settings">
      <div className="page-head">
        <div>
          <h1 id="h-settings">Settings</h1>
          <p>How the store is configured.</p>
        </div>
      </div>

      <div className="note" style={{ marginBottom: 24 }}>
        <Icon name="info" />
        <span>These values are set by the server configuration (environment variables) and are read-only here. Ask the developer to change them.</span>
      </div>

      {error ? <p className="err-text">{error}</p> : null}
      {!s ? (
        error ? null : <p className="sub">Loading…</p>
      ) : (
        <div className="grid2">
          <Group title="Payments">
            <dt>Currency</dt><dd>{s.currency}</dd>
            <dt>Gateway</dt><dd>{provider(s.paymentProvider)}</dd>
            <dt>Mark paid by staff</dt><dd>{yes(s.manualPaymentConfirmation)}</dd>
          </Group>

          <Group title="Tax">
            <dt>Prices include tax</dt><dd>{yes(s.pricesIncludeTax)}</dd>
            <dt>Rate</dt><dd>Per SKU tax rate (FR-IN-06)</dd>
          </Group>

          <Group title="Shipping">
            <dt>Provider</dt><dd>{provider(s.shippingProvider)}</dd>
            {s.shipping.map((m) => (
              <div key={m.method} style={{ display: "contents" }}>
                <dt>{m.method === "EXPRESS" ? "Express" : m.method === "STANDARD" ? "Standard" : m.method}</dt>
                <dd>{amount(m.fee, s.currency)}<div className="sub">{m.estimatedDelivery}</div></dd>
              </div>
            ))}
            <dt>Free shipping over</dt><dd>{amount(s.freeShippingThreshold, s.currency)}</dd>
          </Group>

          <Group title="Catalog and inventory">
            <dt>Low-stock default</dt><dd>{s.lowStockThreshold} units (a SKU&apos;s own level overrides it)</dd>
            <dt>Image URL checks</dt><dd>{yes(s.imageChecks)}</dd>
          </Group>

          <Group title="Returns">
            <dt>Return window</dt><dd>{s.returnWindowDays} days after delivery</dd>
          </Group>

          <Group title="Email">
            <dt>Customer emails</dt>
            <dd>
              {s.email === "smtp" ? "Sent by SMTP" : "Logged only, not sent"}
              {s.email !== "smtp" ? <div className="sub">Configure SMTP on the server to send them.</div> : null}
            </dd>
          </Group>
        </div>
      )}
    </section>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="panel">
      <div className="toolbar"><strong>{title}</strong></div>
      <dl className="kv" style={{ padding: 16 }}>{children}</dl>
    </div>
  );
}
