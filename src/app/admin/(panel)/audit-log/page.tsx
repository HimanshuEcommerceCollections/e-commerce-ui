"use client";
import "../../_styles/catalog-review.css";
import { Fragment, useCallback, useEffect, useState } from "react";
import auditService from "@/services/admin/audit.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type { AuditActorType, AuditEvent, AuditListParams, AuditStats } from "@/types/api/audit.types";
import { fileNameFrom, saveFile } from "@/components/admin/files";
import { Icon, Pager, rangeText, toast, useDebounced, usePageTitle } from "@/components/admin/ui";

const SIZE = 20;
type Range = "1" | "7" | "30" | "all";
const RANGES: Array<[Range, string]> = [
  ["1", "Last 24 hours"],
  ["7", "Last 7 days"],
  ["30", "Last 30 days"],
  ["all", "All time"],
];
/** Pill colour per category, as in the design. */
const CATEGORY_PILL: Record<string, string> = {
  stock: "p-info",
  price: "p-warn",
  submit: "p-info",
  edit: "p-info",
  decision: "p-ok",
  assign: "p-grey",
  delist: "p-bad",
  unpub: "p-bad",
  status: "p-grey",
  product: "p-grey",
  import: "p-grey",
  supplier: "p-ok",
  doc: "p-grey",
  integration: "p-grey",
};
const ACTOR_LABEL: Record<AuditActorType, string> = { team: "Catalog team", seller: "Seller", system: "Automatic rule" };

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const fullWhen = (iso: string) => new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "medium" });
const actorName = (e: AuditEvent) => (e.actor.type === "system" ? "System" : e.actor.name || e.actor.email || "Unknown");

/** Every change to sellers, products and stock: who, when, from where and the previous value. */
export default function AuditLogPage() {
  usePageTitle("Audit log");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [actorType, setActorType] = useState<AuditActorType | "">("");
  const [sellerId, setSellerId] = useState("");
  const [range, setRange] = useState<Range>("7");
  const [alerts, setAlerts] = useState(false);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<AuditEvent[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const debouncedQ = useDebounced(q.trim(), 300);

  const filter = useCallback((): Omit<AuditListParams, "page" | "size"> => ({
    q: debouncedQ || undefined,
    category: category || undefined,
    actorType: actorType || undefined,
    sellerId: sellerId || undefined,
    days: range === "all" ? undefined : Number(range),
    alerts: alerts || undefined,
  }), [debouncedQ, category, actorType, sellerId, range, alerts]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await auditService.list({ ...filter(), page, size: SIZE });
      const data = res.data.data!;
      setRows(data.content);
      setTotal(data.totalElements);
      setPages(data.totalPages);
    } catch (err) {
      setRows([]);
      setError(getApiErrorMessage(err, "Couldn't load the audit log"));
    }
  }, [filter, page]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => setPage(0), [debouncedQ, category, actorType, sellerId, range, alerts]);
  useEffect(() => {
    auditService
      .stats()
      .then((r) => setStats(r.data.data))
      .catch(() => {});
  }, []);

  const filtered = !!(q || category || actorType || sellerId || alerts || range !== "7");
  const clear = () => {
    setQ("");
    setCategory("");
    setActorType("");
    setSellerId("");
    setRange("7");
    setAlerts(false);
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await auditService.exportCsv(filter());
      saveFile(fileNameFrom(res.headers["content-disposition"] as string | undefined, "audit-log.csv"), res.data);
      toast(`Exported ${Number(res.headers["x-total-rows"] ?? total).toLocaleString()} rows`);
    } catch (err) {
      toast(getApiErrorMessage(err, "Couldn't export the audit log"), true);
    } finally {
      setExporting(false);
    }
  };

  const day = stats?.last24h;

  return (
    <section aria-labelledby="h-audit">
      <div className="page-head">
        <div>
          <h1 id="h-audit">Audit log</h1>
          <p>
            Every change to sellers, products and stock: who made it, when, where it came from and the previous value. Records can&apos;t be
            edited or deleted.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={exportCsv} disabled={exporting || !total}>
          <Icon name="download" />
          {exporting ? "Exporting…" : `Export ${total.toLocaleString()} rows (CSV)`}
        </button>
      </div>

      <div className="stats" aria-label="Last 24 hours">
        <div className="stat">
          <span><i style={{ background: "var(--navy)" }} />Events · 24 h</span>
          <b>{day ? day.events.toLocaleString() : "…"}</b>
          <small>all sources</small>
        </div>
        <div className="stat">
          <span><i style={{ background: "var(--info)" }} />Stock changes · 24 h</span>
          <b>{day ? day.stockChanges.toLocaleString() : "…"}</b>
          <small>applied without review</small>
        </div>
        <button
          className={`stat ${day?.stockAlerts ? "red" : ""}`}
          aria-pressed={alerts && range === "1"}
          onClick={() => {
            setAlerts(true);
            setRange("1");
          }}
        >
          <span><i style={{ background: "var(--bad)" }} />Stock alerts · 24 h</span>
          <b>{day ? day.stockAlerts : "…"}</b>
          <small>to zero, or down 80%+</small>
        </button>
        <div className="stat">
          <span><i style={{ background: "var(--leaf)" }} />Review decisions · 24 h</span>
          <b>{day ? day.reviewDecisions : "…"}</b>
          <small>by the catalog team</small>
        </div>
      </div>

      <div className="panel">
        <div className="toolbar filters">
          <label className="search">
            <Icon name="search" />
            <span className="sr-only">Search</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="SKU, product, person or event ID" aria-label="Search" />
          </label>
          <select className="sel" aria-label="Action" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All actions</option>
            {(stats?.categories ?? []).map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
          <select className="sel" aria-label="Who" value={actorType} onChange={(e) => setActorType(e.target.value as AuditActorType | "")}>
            <option value="">Everyone</option>
            <option value="seller">Sellers</option>
            <option value="team">Catalog team</option>
            <option value="system">System</option>
          </select>
          <select className="sel" aria-label="Seller" value={sellerId} onChange={(e) => setSellerId(e.target.value)}>
            <option value="">All sellers</option>
            {(stats?.sellers ?? []).map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select className="sel" aria-label="Date range" value={range} onChange={(e) => setRange(e.target.value as Range)}>
            {RANGES.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <label className="check-inline">
            <input type="checkbox" className="chk" checked={alerts} onChange={(e) => setAlerts(e.target.checked)} /> Alerts only
          </label>
          {filtered ? (
            <button className="btn btn-secondary btn-sm" onClick={clear}>Clear filters</button>
          ) : null}
        </div>

        <div className="twrap">
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Action</th>
                <th>Item</th>
                <th>Before → after</th>
                <th>Who · source</th>
                <th><span className="sr-only">Details</span></th>
              </tr>
            </thead>
            <tbody>
              {rows === null ? (
                <tr className="loading-row"><td colSpan={6}>Loading events…</td></tr>
              ) : error ? (
                <tr className="empty-row"><td colSpan={6}><span className="err-text">{error}</span></td></tr>
              ) : rows.length === 0 ? (
                <tr className="empty-row"><td colSpan={6}>No events match these filters.</td></tr>
              ) : (
                rows.map((e) => {
                  const isOpen = open === e.id;
                  return (
                    <Fragment key={e.id}>
                      <tr className={e.alert ? "alert-row" : undefined}>
                        <td>
                          {when(e.createdAt)}
                          <div className="sub"><code>{e.eventId}</code></div>
                        </td>
                        <td className="wrap">
                          <span className={`pill ${CATEGORY_PILL[e.category] ?? "p-grey"}`}>{e.categoryLabel}</span>
                          {e.alert ? (
                            <div style={{ marginTop: 4 }}><span className="pill p-bad">{e.alert}</span></div>
                          ) : null}
                        </td>
                        <td className="wrap">
                          <strong>{e.entity.label ?? "—"}</strong>
                          {e.entity.code ? <div className="sub"><code>{e.entity.code}</code></div> : null}
                        </td>
                        <td className="ba">
                          <span className="before">{e.before ?? "—"}</span> <span className="sub">→</span> <b>{e.after ?? "—"}</b>
                        </td>
                        <td className="wrap">
                          <span className={`who ${e.actor.type}`}>{e.actor.type === "system" ? <Icon name="gear" size={14} /> : null}{actorName(e)}</span>
                          <div className="sub">{e.source}</div>
                        </td>
                        <td>
                          <button className="btn btn-secondary btn-sm" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : e.id)}>
                            {isOpen ? "Hide" : "Details"}
                          </button>
                        </td>
                      </tr>
                      {isOpen ? (
                        <tr className="drow">
                          <td colSpan={6}>
                            <EventDetails e={e} />
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="tfoot">
          <span>{rows ? rangeText(page, SIZE, rows.length, total, "events") : ""}</span>
          <Pager page={page} pages={pages} onPage={setPage} />
        </div>
      </div>
      <p className="sub" style={{ marginTop: 10 }}>Newest first.</p>
    </section>
  );
}

function EventDetails({ e }: { e: AuditEvent }) {
  const details = Object.keys(e.details ?? {}).length ? JSON.stringify(e.details, null, 2) : null;
  return (
    <dl className="kv">
      <dt>Event ID</dt><dd><code>{e.eventId}</code> <span className="sub">{e.action}</span></dd>
      <dt>Time</dt><dd>{fullWhen(e.createdAt)}</dd>
      <dt>Actor</dt>
      <dd>
        {actorName(e)} ({ACTOR_LABEL[e.actor.type] ?? e.actor.type})
        {e.actor.email && e.actor.type !== "system" ? <div className="sub">{e.actor.email}</div> : null}
      </dd>
      <dt>Source</dt><dd>{e.source}</dd>
      <dt>Item</dt><dd>{e.entity.label ?? "—"}{e.entity.code ? ` · ${e.entity.code}` : ""}</dd>
      {e.seller ? (<><dt>Seller</dt><dd>{e.seller.name ?? e.seller.id}</dd></>) : null}
      <dt>Summary</dt><dd>{e.summary}</dd>
      <dt>Previous value</dt><dd>{e.before ?? "—"}</dd>
      <dt>New value</dt><dd>{e.after ?? "—"}</dd>
      {e.note ? (<><dt>Note</dt><dd style={{ whiteSpace: "pre-wrap" }}>{e.note}</dd></>) : null}
      {e.alert ? (<><dt>Alert</dt><dd style={{ color: "var(--bad)" }}>{e.alert}</dd></>) : null}
      {details ? (<><dt>Before / after</dt><dd><pre>{details}</pre></dd></>) : null}
    </dl>
  );
}
