"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import adminService from "@/services/admin/admin.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type { UserRole } from "@/types/api/common.types";
import type { AdminCustomerDetail, AdminCustomerRow } from "@/types/api/admin.types";
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
  useDebounced,
  whenText,
} from "@/components/admin/ui";

const SIZE = 20;
const VIEWS: Array<{ role: UserRole; label: string }> = [
  { role: "ROLE_CUSTOMER", label: "Customers" },
  { role: "ROLE_MERCHANT", label: "Merchants" },
  { role: "ROLE_CATALOG", label: "Staff · Catalog" },
  { role: "ROLE_ADMIN", label: "Staff · Admin" },
];
const SORTS: Array<[string, string]> = [
  ["createdAt,desc", "Newest first"],
  ["lastOrderAt,desc", "Last order"],
  ["orders,desc", "Most orders"],
  ["totalSpent,desc", "Top spend"],
  ["fullName,asc", "Name A–Z"],
  ["email,asc", "Email A–Z"],
];
const ROLES: UserRole[] = ["ROLE_CUSTOMER", "ROLE_MERCHANT", "ROLE_CATALOG", "ROLE_ADMIN"];

/** Customer records linked to orders (FR-AD-06) and staff roles (FR-AD-08). */
export default function AdminCustomersPage() {
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

  // Deep link from an order: /admin/customers?id=…
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (id) setOpen(id);
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await adminService.listCustomers({ search: q || undefined, role, page, size: SIZE, sort });
      const data = r.data.data!;
      setRows(data.content);
      setTotal(data.totalElements);
      setPages(data.totalPages);
    } catch (err) {
      setRows([]);
      setError(getApiErrorMessage(err, "Couldn't load customers"));
    }
  }, [q, role, page, sort]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => setPage(0), [q, role, sort]);

  const staff = role === "ROLE_ADMIN" || role === "ROLE_CATALOG";

  return (
    <section aria-labelledby="h-customers">
      <div className="page-head">
        <div>
          <h1 id="h-customers">Customers</h1>
          <p>Accounts with their orders and spend. Staff views manage who can use this panel.</p>
        </div>
      </div>

      <div className="panel">
        <div className="tabs" role="tablist">
          {VIEWS.map((v) => (
            <button key={v.role} role="tab" aria-selected={role === v.role} onClick={() => setRole(v.role)}>
              {v.label}
            </button>
          ))}
        </div>
        <div className="toolbar">
          <label className="search">
            <Icon name="search" />
            <span className="sr-only">Search accounts</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email or phone" />
          </label>
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
                <th>Name</th>
                <th>Phone</th>
                <th>Role</th>
                <th className="num">Orders</th>
                <th className="num">Spent</th>
                <th>Last order</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {rows === null ? (
                <tr className="loading-row"><td colSpan={7}>Loading accounts…</td></tr>
              ) : error ? (
                <tr className="empty-row"><td colSpan={7}><span className="err-text">{error}</span></td></tr>
              ) : rows.length === 0 ? (
                <tr className="empty-row"><td colSpan={7}>{q ? "No accounts match." : "No accounts here yet."}</td></tr>
              ) : (
                rows.map((c) => (
                  <tr key={c.id} className="click" onClick={() => setOpen(c.id)}>
                    <td>
                      <strong>{c.fullName}</strong>
                      <div className="sub">{c.email}</div>
                    </td>
                    <td className="sub">{c.phoneNumber ?? "—"}</td>
                    <td>
                      <RolePill role={c.role} />
                      {!c.enabled ? <div className="sub">Disabled</div> : null}
                    </td>
                    <td className="num">{c.orders}</td>
                    <td className="num">{money(c.totalSpent)}</td>
                    <td className="sub">{c.lastOrderAt ? shortDate(c.lastOrderAt) : "—"}</td>
                    <td className="sub">{shortDate(c.createdAt)}</td>
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

      <CustomerDrawer id={open} onClose={() => setOpen(null)} onChanged={load} />
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
