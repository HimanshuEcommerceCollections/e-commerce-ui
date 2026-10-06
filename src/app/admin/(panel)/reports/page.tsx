"use client";
import { useCallback, useEffect, useState } from "react";
import adminService from "@/services/admin/admin.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type { AnalyticsEventType, AnalyticsSummary, SalesReport } from "@/types/api/admin.types";
import { Thumb, money, usePageTitle } from "@/components/admin/ui";

type Days = 7 | 14 | 30;
const DAY = 86_400_000;
const FUNNEL: Array<[AnalyticsEventType, string]> = [
  ["PRODUCT_VIEW", "Viewed a product"],
  ["ADD_TO_CART", "Added to cart"],
  ["CHECKOUT_START", "Started checkout"],
  ["PURCHASE", "Purchased"],
];

/** "Oct 6" for a "2026-10-06" day key, without a timezone shift. */
const dayLabel = (d: string) =>
  new Date(`${d.slice(0, 10)}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

function Delta({ now, before, days, points }: { now: number; before: number; days: number; points?: boolean }) {
  if (points) {
    const d = now - before;
    const cls = Math.abs(d) < 0.05 ? "flat" : d > 0 ? "up" : "down";
    return (
      <span className={`delta ${cls}`}>
        {cls === "flat" ? "No change" : `${d > 0 ? "▲" : "▼"} ${Math.abs(d).toFixed(1)} pts`} vs previous {days} days
      </span>
    );
  }
  if (!before) return <span className="delta flat">{now ? "New vs previous period" : `No sales in either ${days}-day period`}</span>;
  const p = Math.round(((now - before) / before) * 100);
  const cls = p === 0 ? "flat" : p > 0 ? "up" : "down";
  return (
    <span className={`delta ${cls}`}>
      {p === 0 ? "No change" : `${p > 0 ? "▲" : "▼"} ${Math.abs(p)}%`} vs previous {days} days
    </span>
  );
}

/** Sales, orders and top products (design 12 Reports), plus the storefront funnel (FR-IN-05). */
export default function AdminReportsPage() {
  usePageTitle("Reports");
  const [days, setDays] = useState<Days>(14);
  const [report, setReport] = useState<SalesReport | null>(null);
  const [funnel, setFunnel] = useState<{ now: AnalyticsSummary; before: AnalyticsSummary } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setReport(null);
    setFunnel(null);
    const to = new Date();
    const from = new Date(to.getTime() - days * DAY);
    const prevFrom = new Date(from.getTime() - days * DAY);
    try {
      const [r, a, b] = await Promise.all([
        adminService.salesReport(days),
        adminService.analyticsSummary({ from: from.toISOString(), to: to.toISOString() }),
        adminService.analyticsSummary({ from: prevFrom.toISOString(), to: from.toISOString() }),
      ]);
      setReport(r.data.data);
      setFunnel({ now: a.data.data!, before: b.data.data! });
    } catch (err) {
      setError(getApiErrorMessage(err, "Couldn't load reports"));
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const cur = report?.currency ?? "USD";
  const t = report?.totals;
  const prev = report?.previous;
  const prevAov = prev && prev.orders ? prev.revenue / prev.orders : 0;
  const conv = funnel?.now.conversionRate ?? null;
  const convBefore = funnel?.before.conversionRate ?? null;
  const topDept = Math.max(1, ...(report?.byDepartment ?? []).map((d) => d.revenue));

  return (
    <section aria-labelledby="h-reports">
      <div className="page-head">
        <div>
          <h1 id="h-reports">Reports</h1>
          <p>Sales, orders and top products.</p>
        </div>
        <div className="actions">
          <select className="sel" aria-label="Date range" value={days} onChange={(e) => setDays(Number(e.target.value) as Days)}>
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
        </div>
      </div>

      {error ? (
        <p className="err-text" role="alert" style={{ marginBottom: 16 }}>
          {error}{" "}
          <button className="link" onClick={load}>Try again</button>
        </p>
      ) : null}

      <div className="stats">
        <div className="stat">
          <span>Revenue</span>
          <b>{t ? money(t.revenue, cur) : "…"}</b>
          {t && prev ? <Delta now={t.revenue} before={prev.revenue} days={days} /> : null}
        </div>
        <div className="stat">
          <span>Orders</span>
          <b>{t ? t.orders.toLocaleString("en-US") : "…"}</b>
          {t && prev ? <Delta now={t.orders} before={prev.orders} days={days} /> : null}
        </div>
        <div className="stat">
          <span>Avg. order value</span>
          <b>{t ? money(t.averageOrderValue, cur) : "…"}</b>
          {t && prev ? <Delta now={t.averageOrderValue} before={prevAov} days={days} /> : null}
        </div>
        <div className="stat">
          <span>Conversion rate</span>
          <b>{funnel ? (conv === null ? "—" : `${conv.toFixed(1)}%`) : "…"}</b>
          {funnel ? (
            conv !== null && convBefore !== null ? (
              <Delta now={conv} before={convBefore} days={days} points />
            ) : (
              <span className="delta flat">Sessions that purchased</span>
            )
          ) : null}
        </div>
      </div>

      <div className="r-grid">
        <div className="panel">
          <div className="r-h">
            <h2>Sales</h2>
            <span>{report?.daily.length ? `${dayLabel(report.daily[0].date)} – ${dayLabel(report.daily[report.daily.length - 1].date)}` : ""}</span>
          </div>
          <div className="r-chart">
            {report ? <SalesChart daily={report.daily} currency={cur} /> : <p className="sub" style={{ padding: "48px 0", textAlign: "center" }}>Loading…</p>}
          </div>
        </div>
        <div className="panel">
          <div className="r-h"><h2>Sales by department</h2></div>
          <div className="r-bars">
            {!report ? (
              <p className="sub">Loading…</p>
            ) : report.byDepartment.length === 0 ? (
              <p className="sub">No sales in this period.</p>
            ) : (
              report.byDepartment.map((d) => (
                <div className="r-bar" key={d.categoryId ?? d.name}>
                  <span>{d.name}</span>
                  <b>{money(d.revenue, cur)}</b>
                  <div className="t" aria-hidden="true"><i style={{ width: `${(d.revenue / topDept) * 100}%` }} /></div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="r-h"><h2>Top products</h2></div>
        <div className="twrap" style={{ marginTop: 12 }}>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th className="num">Units sold</th>
                <th className="num">Revenue</th>
                <th className="num">Stock left</th>
              </tr>
            </thead>
            <tbody>
              {!report ? (
                <tr className="loading-row"><td colSpan={4}>Loading…</td></tr>
              ) : report.topProducts.length === 0 ? (
                <tr className="empty-row"><td colSpan={4}>No sales in this period.</td></tr>
              ) : (
                report.topProducts.map((p) => (
                  <tr key={p.productId}>
                    <td>
                      <div className="cust">
                        <Thumb src={p.imageUrl} />
                        <div>
                          <strong>{p.name}</strong>
                          <span className="sub"><code>{p.sku}</code></span>
                        </div>
                      </div>
                    </td>
                    <td className="num">{p.units.toLocaleString()}</td>
                    <td className="num">{money(p.revenue, cur)}</td>
                    <td className={`num ${p.stockLeft === 0 ? "qty-out" : ""}`}>{p.stockLeft.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="r-h">
          <h2>Storefront funnel</h2>
          <span>Sessions per step, from the analytics events</span>
        </div>
        <div className="funnel">
          {FUNNEL.map(([key, label], i) => {
            const ev = funnel?.now.events;
            const step = ev?.[key] ?? { events: 0, sessions: 0 };
            const top = Math.max(1, ev?.PRODUCT_VIEW?.sessions ?? 0);
            const prevStep = i ? ev?.[FUNNEL[i - 1][0]]?.sessions ?? 0 : 0;
            const drop = i && prevStep ? 100 - (step.sessions / prevStep) * 100 : null;
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
                {i && ev ? (
                  <span className="sub">
                    {drop === null ? "No sessions in the previous step" : `${Math.max(0, drop).toFixed(0)}% drop-off from the previous step`}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** Daily revenue as a line with one shared scale for marks, gridlines and labels; hover shows the day. */
function SalesChart({ daily, currency }: { daily: SalesReport["daily"]; currency: string }) {
  const [hover, setHover] = useState<number | null>(null);
  if (!daily.length) return <p className="sub">No days in range.</p>;
  const W = 720, H = 240, pl = 56, pr = 12, pt = 12, pb = 28;
  const peak = Math.max(...daily.map((d) => d.revenue));
  // A round axis maximum: 1, 2 or 5 × a power of ten.
  const mag = Math.pow(10, Math.floor(Math.log10(Math.max(peak, 1))));
  const max = [1, 2, 5, 10].map((m) => m * mag).find((m) => m >= peak) ?? 10 * mag;
  const x = (i: number) => pl + (W - pl - pr) * (daily.length === 1 ? 0.5 : i / (daily.length - 1));
  const y = (v: number) => pt + (H - pt - pb) * (1 - v / max);
  const line = daily.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.revenue).toFixed(1)}`).join("");
  const area = `${line}L${x(daily.length - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z`;
  const ticks = [0, max / 4, max / 2, (max * 3) / 4, max];
  const step = Math.ceil(daily.length / 7);
  const short = (v: number) =>
    v >= 1000 ? `$${(v / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })}k` : `$${Math.round(v)}`;
  const slot = (W - pl - pr) / Math.max(1, daily.length - 1);
  const h = hover === null ? null : daily[hover];
  const total = daily.reduce((a, d) => a + d.revenue, 0);

  return (
    <>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Daily revenue, ${daily.length} days, ${money(total, currency)} in total`}
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((v) => (
          <g key={v}>
            <line className="grid" x1={pl} x2={W - pr} y1={y(v)} y2={y(v)} />
            <text className="axis" x={pl - 8} y={y(v) + 4} textAnchor="end">{short(v)}</text>
          </g>
        ))}
        {daily.map((d, i) =>
          i % step === 0 || i === daily.length - 1 ? (
            <text key={d.date} className="axis" x={x(i)} y={H - 8} textAnchor="middle">{dayLabel(d.date)}</text>
          ) : null
        )}
        <path className="area" d={area} />
        <path className="line" d={line} />
        {h && hover !== null ? (
          <>
            <line className="cross" x1={x(hover)} x2={x(hover)} y1={pt} y2={y(0)} />
            <circle className="dot" cx={x(hover)} cy={y(h.revenue)} r={5} />
          </>
        ) : null}
        {daily.map((d, i) => (
          <rect
            key={d.date}
            className="hit"
            x={x(i) - slot / 2}
            y={pt}
            width={slot}
            height={H - pt - pb}
            onMouseEnter={() => setHover(i)}
          />
        ))}
      </svg>
      {h && hover !== null ? (
        <div className="r-tip" style={{ left: `calc(16px + (100% - 32px) * ${x(hover) / W})`, top: `calc(12px + (100% - 28px) * ${y(h.revenue) / H} - 8px)` }}>
          <b>{money(h.revenue, currency)}</b>
          {dayLabel(h.date)} · {h.orders} order{h.orders === 1 ? "" : "s"}
        </div>
      ) : null}
      <table className="sr-only">
        <caption>Daily sales</caption>
        <thead><tr><th>Day</th><th>Revenue</th><th>Orders</th></tr></thead>
        <tbody>
          {daily.map((d) => (
            <tr key={d.date}><td>{dayLabel(d.date)}</td><td>{money(d.revenue, currency)}</td><td>{d.orders}</td></tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
