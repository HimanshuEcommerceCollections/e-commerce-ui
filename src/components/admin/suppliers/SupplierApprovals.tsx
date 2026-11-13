"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supplierService from "@/services/admin/supplier.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type { SupplierList, SupplierView } from "@/types/api/supplier.types";
import { Icon, toast, useDebounced, usePageTitle } from "@/components/admin/ui";
import { daysUntil, hue, shortDay, stagePill, supplierInitials } from "./labels";
import "./suppliers.css";

const TABS: Array<[SupplierView, string, keyof SupplierList["counts"] | null]> = [
  ["todo", "Needs my action", "todo"],
  ["docs", "Waiting on supplier", "docs"],
  ["active", "Active", "active"],
  ["closed", "Declined & auto-rejected", "closed"],
  ["all", "All", "all"],
];

export function Initials({ id, name, size = 40 }: { id: string; name: string; size?: number }) {
  const h = hue(id);
  return (
    <span
      className="sup-av"
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: size / 3, background: `linear-gradient(135deg,hsl(${h} 40% 84%),hsl(${h + 30} 32% 93%))` }}
    >
      {supplierInitials(name)}
    </span>
  );
}

/** Supplier approvals (design: catalog-supplier-approvals): the queue. */
export function SupplierApprovals() {
  usePageTitle("Supplier approvals");
  const router = useRouter();
  const [tab, setTab] = useState<SupplierView>("todo");
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const [data, setData] = useState<SupplierList | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await supplierService.list({ view: tab, q: q || undefined });
      setData(r.data.data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Couldn't load supplier applications"));
    }
  }, [tab, q]);

  useEffect(() => {
    load();
  }, [load]);

  const remind = async (id: string, name: string) => {
    try {
      await supplierService.remind(id, "Your certificate of insurance expires soon. Please upload a current one.");
      toast(`Reminder sent to ${name}`);
    } catch (err) {
      toast(getApiErrorMessage(err, "Couldn't send the reminder"), true);
    }
  };

  const c = data?.counts;
  const open = (id: string) => router.push(`/admin/seller-applications/${id}`);

  return (
    <section aria-labelledby="h-sup" className="sup">
      <div className="page-head">
        <div>
          <h1 id="h-sup">Supplier approvals</h1>
          <p>
            Two gates: first the supplier, then every product. Score applications against <b>SUP-001</b>, check documents, then
            activate the account.
          </p>
        </div>
      </div>

      <section className="stats" aria-label="Summary">
        <button className="stat" onClick={() => setTab("todo")}>
          <span><i style={{ background: "var(--navy)" }} />Your action needed</span>
          <b>{c?.todo ?? "—"}</b>
          <small>scorecards and documents to check</small>
        </button>
        <button className="stat" onClick={() => setTab("docs")}>
          <span><i style={{ background: "var(--warn)" }} />Waiting on supplier</span>
          <b>{c?.docs ?? "—"}</b>
          <small>passed, documents not all in</small>
        </button>
        <button className="stat" onClick={() => setTab("active")}>
          <span><i style={{ background: "var(--leaf)" }} />Active suppliers</span>
          <b>{c ? c.active - c.suspended : "—"}</b>
          <small>{c?.suspended ?? 0} suspended</small>
        </button>
        <button className={`stat${c?.expiring ? " red" : ""}`} onClick={() => setTab("active")}>
          <span><i style={{ background: "var(--bad)" }} />Insurance expiring</span>
          <b>{c?.expiring ?? "—"}</b>
          <small>within 30 days</small>
        </button>
      </section>

      {data?.expiring.map((e) => (
        <div className="note warn sup-exp" key={e.id}>
          <Icon name="alert" />
          <span>
            <b>{e.companyName}</b>:{" "}
            {e.days < 0 ? `insurance certificate expired ${shortDay(e.expiresAt)}.` : `insurance certificate expires in ${e.days} days (${shortDay(e.expiresAt)}).`}{" "}
            <button className="linkish" onClick={() => remind(e.id, e.companyName)}>
              Remind supplier
            </button>
          </span>
        </div>
      ))}

      <div className="panel">
        <div className="tabs" role="tablist" aria-label="Views">
          {TABS.map(([k, label, count]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
              {label}
              {c && count ? <span className="c">{count === "active" ? c.active : c[count]}</span> : null}
            </button>
          ))}
        </div>
        <div className="toolbar">
          <label className="search">
            <Icon name="search" />
            <span className="sr-only">Search</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search company, contact, email or reference" />
          </label>
        </div>
        <div className="twrap">
          <table>
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Stage</th>
                <th>Categories</th>
                <th>Ships from</th>
                <th>Score</th>
                <th>Documents</th>
                <th>Applied</th>
              </tr>
            </thead>
            <tbody>
              {!data && !error ? (
                <tr className="loading-row"><td colSpan={7}>Loading suppliers…</td></tr>
              ) : error ? (
                <tr className="empty-row"><td colSpan={7}><span className="err-text">{error}</span></td></tr>
              ) : data!.items.length === 0 ? (
                <tr className="empty-row"><td colSpan={7}>{q ? `Nothing matches “${q}”.` : "Nothing here right now."}</td></tr>
              ) : (
                data!.items.map((s) => {
                  const [pc, pl] = stagePill(s);
                  const exp = s.insuranceExpiresAt ? daysUntil(s.insuranceExpiresAt) : null;
                  return (
                    <tr key={s.id} className="click" tabIndex={0} onClick={() => open(s.id)} onKeyDown={(e) => e.key === "Enter" && open(s.id)}>
                      <td>
                        <span className="sup-item">
                          <Initials id={s.id} name={s.companyName} />
                          <span>
                            <strong>{s.companyName}</strong>
                            <span className="sub">{s.contactName} · {s.reference}</span>
                          </span>
                        </span>
                      </td>
                      <td><span className={`pill ${pc}`}>{pl}</span></td>
                      <td className="trunc">{s.categories.join(", ") || "—"}</td>
                      <td>
                        {s.usWarehouse === "yes" ? `${s.warehouseState ?? ""}, US` : s.usWarehouse === "no" ? <span className="sup-bad">Outside US</span> : <span className="sub">—</span>}
                      </td>
                      <td>
                        {s.score === null ? <span className="sub">—</span> : <><b className={s.score >= 70 ? "sup-up" : "sup-dn"}>{s.score}</b><span className="sub"> / 100</span></>}
                      </td>
                      <td>
                        {["APPLIED", "SCREENED", "SCORECARD", "AUTO_REJECTED", "DECLINED"].includes(s.stage) ? (
                          <span className="sub">Not requested</span>
                        ) : (
                          <>
                            {s.documentsUploaded} of {s.documentsRequired}
                            {s.stage === "APPROVED" && exp !== null && exp <= 30 ? <> <span className="pill p-warn">Expiring</span></> : null}
                          </>
                        )}
                      </td>
                      <td>{shortDay(s.submittedAt)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="tfoot">
          <span>Oldest first</span>
        </div>
      </div>
    </section>
  );
}
