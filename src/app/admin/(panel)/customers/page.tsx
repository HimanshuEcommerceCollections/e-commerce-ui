"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import adminService from "@/services/admin/admin.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type { UserRole } from "@/types/api/common.types";
import type { AdminCustomerDetail, AdminCustomerRow, AdminCustomerStats, CustomerSegment } from "@/types/api/admin.types";
import { useAdminSession } from "@/components/admin/useAdminSession";
import {
  Drawer,
  FulfilmentPill,
  Icon,
  OrderPill,
  Pager,
  PaymentPill,
  ROLE_LABEL,
  RolePill,
  money,
  rangeText,
  shortDate,
  toast,
  initials,
  useDebounced,
  usePageTitle,
  whenText,
} from "@/components/admin/ui";
import { fileNameFrom, saveFile } from "@/components/admin/files";

const SIZE = 20;
const VIEWS: Array<{ role: UserRole; label: string }> = [
  { role: "ROLE_CUSTOMER", label: "Customers" },
  { role: "ROLE_CATALOG", label: "Catalog staff" },
  { role: "ROLE_ADMIN", label: "Admins" },
  { role: "ROLE_MERCHANT", label: "Merchants" },
];
/** The design's sort options. */
const SORTS: Array<[string, string]> = [
  ["totalSpent,desc", "Most spent"],
  ["lastOrderAt,desc", "Most recent order"],
  ["orders,desc", "Most orders"],
  ["fullName,asc", "Name A–Z"],
];
const ROLES: UserRole[] = ["ROLE_CUSTOMER", "ROLE_MERCHANT", "ROLE_CATALOG", "ROLE_ADMIN"];
/** The design's customer tabs: by number of orders. */
const SEGMENTS: Array<{ key: CustomerSegment | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "repeat", label: "Repeat" },
  { key: "none", label: "No orders yet" },
];

/** Customer records linked to orders (FR-AD-06) and staff roles (FR-AD-08). */
export default function AdminCustomersPage() {
  usePageTitle("Customers");
  const [role, setRole] = useState<UserRole>("ROLE_CUSTOMER");
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const [sort, setSort] = useState(SORTS[0][0]);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<AdminCustomerRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [segment, setSegment] = useState<CustomerSegment | "all">("all");
  const [stats, setStats] = useState<AdminCustomerStats | null>(null);
  const customers = role === "ROLE_CUSTOMER";
  // Segments only apply to customers; staff and merchant views list everyone in the role.
  const seg = customers && segment !== "all" ? segment : undefined;

  // The KPIs cover every customer; the tab counts follow the search.
  const [found, setFound] = useState<AdminCustomerStats | null>(null);
  const loadStats = useCallback(() => {
    adminService
      .customerStats()
      .then((r) => setStats(r.data.data))
      .catch(() => setStats(null));
  }, []);
  useEffect(loadStats, [loadStats]);
  useEffect(() => {
    if (!q) return setFound(null);
    adminService
      .customerStats({ search: q })
      .then((r) => setFound(r.data.data))
      .catch(() => setFound(null));
  }, [q]);
  const segCounts = (q ? found : stats)?.segments;

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await adminService.exportCustomers({ search: q || undefined, role, sort, segment: seg });
      saveFile(fileNameFrom(res.headers["content-disposition"] as string | undefined, "customers.csv"), res.data);
    } catch (err) {
      toast(getApiErrorMessage(err, "Couldn't export customers"), true);
    } finally {
      setExporting(false);
    }
  };

  // Deep link from an order: /admin/customers?id=…
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (id) setOpen(id);
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await adminService.listCustomers({ search: q || undefined, role, segment: seg, page, size: SIZE, sort });
      const data = r.data.data!;
      setRows(data.content);
      setTotal(data.totalElements);
      setPages(data.totalPages);
    } catch (err) {
      setRows([]);
      setError(getApiErrorMessage(err, "Couldn't load customers"));
    }
  }, [q, role, seg, page, sort]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => setPage(0), [q, role, seg, sort]);

  const staff = role === "ROLE_ADMIN" || role === "ROLE_CATALOG";
  const pct = (n: number) => `${Math.round(n)}%`;
  const kpis: Array<[string, string]> = stats
    ? [
        ["Customers", stats.customers.toLocaleString()],
        // Share of buyers (customers with at least one order), as the design computes it.
        ["Repeat buyers", `${stats.repeatBuyers.toLocaleString()} · ${pct(stats.buyers ? (stats.repeatBuyers / stats.buyers) * 100 : 0)}`],
        ["Avg. spend", money(stats.averageSpend)],
        ["Email opt-in", pct(stats.marketingOptInRate)],
      ]
    : [["Customers", "…"], ["Repeat buyers", "…"], ["Avg. spend", "…"], ["Email opt-in", "…"]];

  return (
    <section aria-labelledby="h-customers">
      <div className="page-head">
        <div>
          <h1 id="h-customers">Customers</h1>
          <p>Everyone who has ordered, with their order history and contact details.</p>
        </div>
        <div className="actions">
          <button className="btn btn-secondary" onClick={exportCsv} disabled={exporting}>
            <Icon name="download" />
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        </div>
      </div>

      <div className="stats">
        {kpis.map(([label, value]) => (
          <div className="stat" key={label}>
            <span>{label}</span>
            <b>{value}</b>
          </div>
        ))}
      </div>

      <div className="panel">
        {customers ? (
          <div className="tabs" role="tablist" aria-label="Customer segments">
            {SEGMENTS.map((s) => (
              <button key={s.key} role="tab" aria-selected={segment === s.key} onClick={() => setSegment(s.key)}>
                {s.label}
                <span className="c">{segCounts ? segCounts[s.key] : "…"}</span>
              </button>
            ))}
          </div>
        ) : null}
        <div className="toolbar">
          <label className="search">
            <Icon name="search" />
            <span className="sr-only">Search accounts</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email or city" />
          </label>
          <select className="sel" aria-label="Accounts" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
            {VIEWS.map((v) => (
              <option key={v.role} value={v.role}>{v.label}</option>
            ))}
          </select>
          <select className="sel" aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORTS.map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </div>
        {staff ? (
          <div className="note" style={{ borderRadius: 0 }}>
            <Icon name="info" />
            <span>
              Catalog staff can manage products, inventory and catalog files, but not orders, customers or settings.
              Change a role from the account&apos;s detail.
            </span>
          </div>
        ) : null}
        <div className="twrap">
          <table>
            <thead>
              <tr>
                <th>{staff ? "Staff member" : "Customer"}</th>
                <th>Location</th>
                <th className="num">Orders</th>
                <th className="num">Total spent</th>
                <th>Last order</th>
                <th>{staff ? "Role" : "Marketing"}</th>
              </tr>
            </thead>
            <tbody>
              {rows === null ? (
                <tr className="loading-row"><td colSpan={6}>Loading accounts…</td></tr>
              ) : error ? (
                <tr className="empty-row"><td colSpan={6}><span className="err-text">{error}</span></td></tr>
              ) : rows.length === 0 ? (
                <tr className="empty-row"><td colSpan={6}>{q ? `No accounts match “${q}”.` : "No accounts here yet."}</td></tr>
              ) : (
                rows.map((c) => (
                  <tr
                    key={c.id}
                    className="click"
                    tabIndex={0}
                    onClick={() => setOpen(c.id)}
                    onKeyDown={(e) => e.key === "Enter" && setOpen(c.id)}
                  >
                    <td>
                      <div className="cust">
                        <span className="av" aria-hidden="true">{initials(c.fullName || c.email)}</span>
                        <div>
                          <strong>{c.fullName}</strong>
                          <span className="sub">{c.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>{c.location ?? <span className="sub">—</span>}</td>
                    <td className="num">{c.orders}</td>
                    <td className="num">{money(c.totalSpent)}</td>
                    <td>
                      {c.lastOrderAt ? shortDate(c.lastOrderAt) : <span className="sub">None yet</span>}
                      {c.lastOrderAt && c.lastOrderNumber ? <div className="sub">{c.lastOrderNumber}</div> : null}
                    </td>
                    <td>
                      {staff ? (
                        <RolePill role={c.role} />
                      ) : c.marketingOptIn ? (
                        <span className="pill p-ok">Subscribed</span>
                      ) : (
                        <span className="pill p-grey">Not subscribed</span>
                      )}
                      {!c.enabled ? <div className="sub">Disabled</div> : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="tfoot">
          <span>{rows ? rangeText(page, SIZE, rows.length, total, "accounts") : ""}</span>
          <Pager page={page} pages={pages} onPage={setPage} />
        </div>
      </div>

      <CustomerDrawer
        id={open}
        onClose={() => setOpen(null)}
        onChanged={() => {
          load();
          loadStats();
        }}
      />
    </section>
  );
}

function CustomerDrawer({ id, onClose, onChanged }: { id: string | null; onClose: () => void; onChanged: () => void }) {
  const { user } = useAdminSession();
  const [c, setC] = useState<AdminCustomerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>("ROLE_CUSTOMER");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setC(null);
    setError(null);
    if (!id) return;
    adminService
      .getCustomer(id)
      .then((r) => {
        setC(r.data.data);
        setRole(r.data.data!.role);
      })
      .catch((err) => setError(getApiErrorMessage(err, "Couldn't load the account")));
  }, [id]);

  const saveRole = async () => {
    if (!c || role === c.role) return;
    const msg =
      role === "ROLE_ADMIN"
        ? `Give ${c.fullName} full admin access, including orders, refunds and roles?`
        : `Change ${c.fullName} from ${ROLE_LABEL[c.role]} to ${ROLE_LABEL[role]}?`;
    if (!window.confirm(msg)) return;
    setBusy(true);
    try {
      await adminService.setRole(c.id, role);
      setC({ ...c, role });
      toast(`${c.fullName} is now ${ROLE_LABEL[role]}`);
      onChanged();
    } catch (err) {
      // e.g. an admin removing their own admin role (400).
      toast(getApiErrorMessage(err, "Couldn't change the role"), true);
      setRole(c.role);
    } finally {
      setBusy(false);
    }
  };

  const self = !!c && c.id === user?.userId;

  return (
    <Drawer
      open={!!id}
      onClose={onClose}
      title={c?.fullName ?? "Account"}
      sub={c ? <span className="badges">{c.email} <RolePill role={c.role} /></span> : null}
      foot={<button className="btn btn-secondary" onClick={onClose}>Close</button>}
    >
      {!c ? (
        error ? <p className="err-text">{error}</p> : <p className="sub">Loading…</p>
      ) : (
        <>
          <div className="stats" style={{ marginBottom: 0 }}>
            <div className="stat"><span>Orders</span><b>{c.orders.length}</b></div>
            <div className="stat"><span>Total spent</span><b>{money(c.totalSpent)}</b></div>
          </div>

          <div className="d-sec">
            <h3>Account</h3>
            <dl className="kv">
              <dt>Email</dt><dd>{c.email}</dd>
              <dt>Phone</dt><dd>{c.phoneNumber ?? "—"}</dd>
              <dt>Joined</dt><dd>{whenText(c.createdAt)}</dd>
              <dt>Last sign-in</dt><dd>{whenText(c.lastLoginAt)}</dd>
              <dt>Marketing</dt><dd>{c.marketingOptIn ? "Subscribed to email" : "Not subscribed"}</dd>
              <dt>Status</dt><dd>{c.enabled ? "Active" : "Disabled"}</dd>
            </dl>
          </div>

          <div className="d-sec">
            <h3>Role</h3>
            <div className="actrow" style={{ justifyContent: "flex-start" }}>
              <select className="sel" aria-label="Role" value={role} onChange={(e) => setRole(e.target.value as UserRole)} disabled={busy}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                ))}
              </select>
              <button className="btn btn-primary" onClick={saveRole} disabled={busy || role === c.role}>
                {busy ? "Saving…" : "Change role"}
              </button>
            </div>
            <p className="sub" style={{ marginTop: 8 }}>
              {self ? "This is your account; you can't remove your own admin role. " : ""}
              Catalog staff: products, inventory and catalog files only. Admin: everything.
            </p>
          </div>

          {c.role === "ROLE_CUSTOMER" ? (
            <StoreCredit
              key={c.id}
              customer={c}
              onAdjusted={(balance) => setC({ ...c, storeCreditBalance: balance ?? c.storeCreditBalance })}
            />
          ) : null}

          <div className="d-sec">
            <h3>Orders ({c.orders.length})</h3>
            {c.orders.length ? (
              <div className="items">
                {c.orders.map((o) => (
                  <div className="item" key={o.id}>
                    <div>
                      <Link className="link" href={`/admin/orders?id=${o.id}`}>{o.orderNumber}</Link>
                      <span className="sub badges">
                        {shortDate(o.createdAt)} <OrderPill status={o.status} />
                        {o.fulfilmentStatus ? <FulfilmentPill status={o.fulfilmentStatus} /> : null}
                      </span>
                    </div>
                    <span style={{ textAlign: "right" }}>
                      {money(o.grandTotal, o.currency)}
                      <div><PaymentPill status={o.paymentStatus} /></div>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="sub">No orders yet.</p>
            )}
          </div>

          <div className="d-sec">
            <h3>Addresses ({c.addresses.length})</h3>
            {c.addresses.length ? (
              <div className="items">
                {c.addresses.map((a) => (
                  <div className="item" key={a.id}>
                    <div>
                      <strong>{a.label}{a.isDefault ? " · default" : ""}</strong>
                      <span className="sub">
                        {a.recipientName}, {a.addressLine1}
                        {a.addressLine2 ? `, ${a.addressLine2}` : ""}, {a.city}, {a.state} {a.postalCode}, {a.country}
                        {a.phone ? ` · ${a.phone}` : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="sub">No saved addresses.</p>
            )}
          </div>
        </>
      )}
    </Drawer>
  );
}

/** Manual store credit: goodwill (+) or a correction (−), with a reason the customer sees in their activity. */
function StoreCredit({ customer: c, onAdjusted }: { customer: AdminCustomerDetail; onAdjusted: (balance: number | undefined) => void }) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const n = Number(amount);
    if (!amount.trim() || !Number.isFinite(n) || n === 0) return setErr("Enter an amount, e.g. 10 to add or -10 to take away.");
    if (!description.trim()) return setErr("Add a reason. The customer sees it in their store credit activity.");
    const value = Math.round(n * 100) / 100;
    const msg = value > 0 ? `Add ${money(value)} store credit for ${c.fullName}?` : `Remove ${money(-value)} store credit from ${c.fullName}?`;
    if (!window.confirm(msg)) return;
    setErr(null);
    setBusy(true);
    try {
      const res = await adminService.adjustStoreCredit(c.id, value, description.trim());
      const d = res.data.data;
      const balance = d?.balance;
      toast(`${value > 0 ? "Added" : "Removed"} ${money(Math.abs(value))} store credit${balance !== undefined ? ` · balance ${money(balance)}` : ""}`);
      setAmount("");
      setDescription("");
      onAdjusted(balance);
    } catch (e) {
      setErr(getApiErrorMessage(e, "Couldn't adjust store credit"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="d-sec">
      <h3>Store credit</h3>
      {c.storeCreditBalance !== undefined ? (
        <p style={{ marginBottom: 8 }}>
          Balance <b>{money(c.storeCreditBalance)}</b>
        </p>
      ) : null}
      <div className="form">
        <div className="row2">
          <div className="fld">
            <label htmlFor="scAmount">Amount (USD)</label>
            <input className={`inp ${err && !amount.trim() ? "bad" : ""}`} id="scAmount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="10.00 or -10.00" />
          </div>
          <div className="fld">
            <label htmlFor="scDesc">Reason</label>
            <input className={`inp ${err && !description.trim() ? "bad" : ""}`} id="scDesc" value={description} maxLength={255} onChange={(e) => setDescription(e.target.value)} placeholder="Goodwill: late delivery" />
          </div>
        </div>
        {err ? <p className="err-text">{err}</p> : null}
        <div className="actrow" style={{ justifyContent: "flex-start" }}>
          <button className="btn btn-secondary btn-sm" onClick={submit} disabled={busy}>
            {busy ? "Saving…" : "Adjust credit"}
          </button>
        </div>
      </div>
    </div>
  );
}
