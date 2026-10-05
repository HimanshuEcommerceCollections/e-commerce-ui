"use client";
import { useCallback, useEffect, useState } from "react";
import adminService from "@/services/admin/admin.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type { AnalyticsEventType, AnalyticsSummary, TopProduct } from "@/types/api/admin.types";
import { money, shortDate } from "@/components/admin/ui";

const PRESETS = [7, 30, 90] as const;
const FUNNEL: Array<[AnalyticsEventType, string]> = [
  ["PRODUCT_VIEW", "Viewed a product"],
  ["ADD_TO_CART", "Added to cart"],
  ["CHECKOUT_START", "Started checkout"],
  ["PURCHASE", "Purchased"],
];

const pct = (n: number) => `${n.toFixed(n >= 10 ? 0 : 1)}%`;

/** Storefront funnel from the recorded events (FR-IN-05). */
export default function AdminAnalyticsPage() {
  const [days, setDays] = useState<(typeof PRESETS)[number]>(30);
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const to = new Date();
    const from = new Date(to.getTime() - days * 86_400_000);
    try {
      const r = await adminService.analyticsSummary({ from: from.toISOString(), to: to.toISOString() });
      setData(r.data.data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Couldn't load analytics"));
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const ev = data?.events;
  const top = ev ? Math.max(1, ev.PRODUCT_VIEW?.sessions ?? 0) : 1;

  return (
    <section aria-labelledby="h-analytics">
      <div className="page-head">
        <div>
          <h1 id="h-analytics">Analytics</h1>
          <p>{data ? `${shortDate(data.from)} – ${shortDate(data.to)} · sessions per funnel step` : "Storefront events"}</p>
        </div>
        <div className="seg" role="group" aria-label="Date range">
          {PRESETS.map((d) => (
            <button key={d} aria-pressed={days === d} onClick={() => setDays(d)}>
              {d} days
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="err-text" style={{ marginBottom: 16 }}>{error}</p> : null}

      <div className="stats">
        <div className="stat"><span>Revenue</span><b>{data ? money(data.revenue) : "…"}</b></div>
        <div className="stat"><span>Orders</span><b>{data ? data.orders.toLocaleString() : "…"}</b></div>
        <div className="stat">
          <span>Conversion</span>
          <b>{data ? (data.conversionRate === null ? "—" : pct(data.conversionRate)) : "…"}</b>
        </div>
        <div className="stat"><span>Searches</span><b>{ev ? (ev.SEARCH?.events ?? 0).toLocaleString() : "…"}</b></div>
      </div>

      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="toolbar"><strong>Funnel</strong></div>
        <div className="funnel">
          {FUNNEL.map(([key, label], i) => {
            const step = ev?.[key] ?? { events: 0, sessions: 0 };
            const prev = i ? ev?.[FUNNEL[i - 1][0]]?.sessions ?? 0 : 0;
            const drop = i && prev ? 100 - (step.sessions / prev) * 100 : null;
            return (
              <div className="fstep" key={key}>
                <div className="fhead">
                  <strong>{label}</strong>
                  <span>
                    <b>{ev ? step.sessions.toLocaleString() : "…"}</b>
                    <span className="sub"> sessions · {ev ? step.events.toLocaleString() : "…"} events</span>
                  </span>
                </div>
                <div className="fbar" aria-hidden="true">
                  <i style={{ width: `${ev ? Math.max(step.sessions ? 2 : 0, (step.sessions / top) * 100) : 0}%` }} />
                </div>
                {i ? (
                  <span className="sub">
                    {drop === null ? "No sessions in the previous step" : `${pct(Math.max(0, drop))} drop-off from the previous step`}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid2">
        <TopTable title="Most viewed products" rows={data?.topViewedProducts} noun="views" />
        <TopTable title="Most added to cart" rows={data?.topAddedToCartProducts} noun="adds" />
      </div>
    </section>
  );
}

function TopTable({ title, rows, noun }: { title: string; rows: TopProduct[] | undefined; noun: string }) {
  return (
    <div className="panel">
      <div className="toolbar"><strong>{title}</strong></div>
      <div className="twrap">
        <table>
          <thead>
            <tr>
              <th className="num">#</th>
              <th>Product</th>
              <th className="num">{noun}</th>
            </tr>
          </thead>
          <tbody>
            {!rows ? (
              <tr className="loading-row"><td colSpan={3}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr className="empty-row"><td colSpan={3}>No events in this range.</td></tr>
            ) : (
              rows.slice(0, 10).map((p, i) => (
                <tr key={p.productId}>
                  <td className="num sub">{i + 1}</td>
                  <td style={{ whiteSpace: "normal" }}>
                    {p.name}
                    <div className="sub"><code>{p.sku}</code></div>
                  </td>
                  <td className="num">{p.count.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
