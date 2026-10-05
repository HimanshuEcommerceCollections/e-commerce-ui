"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import adminService from "@/services/admin/admin.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type { AdminReturn, ReturnAction, ReturnStatus } from "@/types/api/admin.types";
import { refreshAdminCounts } from "@/components/admin/refresh";
import { Drawer, Icon, OrderPill, Pager, ReturnPill, dateTime, money, rangeText, toast, whenText } from "@/components/admin/ui";

const SIZE = 20;
const TABS: Array<{ key: ReturnStatus | "ALL"; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "REQUESTED", label: "Requested" },
  { key: "APPROVED", label: "Approved" },
  { key: "RECEIVED", label: "Received" },
  { key: "REFUNDED", label: "Refunded" },
  { key: "REJECTED", label: "Rejected" },
];

/** Valid next steps per status (FR-AD-07). */
const ACTIONS: Record<ReturnStatus, ReturnAction[]> = {
  REQUESTED: ["APPROVE", "REJECT"],
  APPROVED: ["RECEIVE", "REFUND", "REJECT"],
  RECEIVED: ["REFUND"],
  REJECTED: [],
  REFUNDED: [],
};
const ACTION_LABEL: Record<ReturnAction, string> = {
  APPROVE: "Approve",
  REJECT: "Reject",
  RECEIVE: "Mark received",
  REFUND: "Refund",
};
const ACTION_DONE: Record<ReturnAction, string> = {
  APPROVE: "approved",
  REJECT: "rejected",
  RECEIVE: "marked received",
  REFUND: "refunded",
};

const units = (r: AdminReturn) => r.items.reduce((n, i) => n + i.quantity, 0);

export default function AdminReturnsPage() {
  const [tab, setTab] = useState<ReturnStatus | "ALL">("ALL");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<AdminReturn[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [counts, setCounts] = useState<Partial<Record<ReturnStatus, number>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  // Deep link from an order: /admin/returns?id=…
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (id) setOpen(id);
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [list, s] = await Promise.all([
        adminService.listReturns({ status: tab === "ALL" ? undefined : tab, page, size: SIZE, sort: "createdAt,desc" }),
        adminService.orderStats(),
      ]);
      const data = list.data.data!;
      setRows(data.content);
      setTotal(data.totalElements);
      setPages(data.totalPages);
      setCounts(s.data.data?.returnsByStatus ?? {});
    } catch (err) {
      setRows([]);
      setError(getApiErrorMessage(err, "Couldn't load returns"));
    }
  }, [tab, page]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => setPage(0), [tab]);

  const count = (k: ReturnStatus | "ALL") =>
    counts ? (k === "ALL" ? Object.values(counts).reduce((a, b) => a + (b ?? 0), 0) : counts[k] ?? 0) : null;

  return (
    <section aria-labelledby="h-returns">
      <div className="page-head">
        <div>
          <h1 id="h-returns">Returns</h1>
          <p>Approve, receive and refund returns. Refunds go back through the payment gateway.</p>
        </div>
      </div>

      <div className="panel">
        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}>
              {t.label}
              <span className="c">{count(t.key) ?? "…"}</span>
            </button>
          ))}
        </div>
        <div className="twrap">
          <table>
            <thead>
              <tr>
                <th>Return</th>
                <th>Order</th>
                <th>Customer</th>
                <th className="num">Units</th>
                <th className="num">Refund</th>
                <th>Status</th>
                <th>Opened</th>
              </tr>
            </thead>
            <tbody>
              {rows === null ? (
                <tr className="loading-row"><td colSpan={7}>Loading returns…</td></tr>
              ) : error ? (
                <tr className="empty-row"><td colSpan={7}><span className="err-text">{error}</span></td></tr>
              ) : rows.length === 0 ? (
                <tr className="empty-row"><td colSpan={7}>No returns here.</td></tr>
              ) : (
                rows.map((r) => {
                  const d = dateTime(r.createdAt);
                  return (
                    <tr key={r.id} className="click" onClick={() => setOpen(r.id)}>
                      <td>
                        <strong>{r.rmaNumber}</strong>
                        <div className="sub trunc">{r.reason}</div>
                      </td>
                      <td>{r.order.orderNumber}</td>
                      <td>{r.order.customer.name}<div className="sub">{r.order.customer.email}</div></td>
                      <td className="num">{units(r)}</td>
                      <td className="num">
                        {money(r.refundAmount ?? r.refundDue, r.order.currency)}
                        {r.refundAmount === null ? <div className="sub">due</div> : null}
                      </td>
                      <td><ReturnPill status={r.status} /></td>
                      <td>{d.date}<div className="sub">by {r.requestedBy.toLowerCase()}</div></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="tfoot">
          <span>{rows ? rangeText(page, SIZE, rows.length, total, "returns") : ""}</span>
          <Pager page={page} pages={pages} onPage={setPage} />
        </div>
      </div>

      <ReturnDrawer
        id={open}
        onClose={() => setOpen(null)}
        onChanged={() => {
          load();
          refreshAdminCounts();
        }}
      />
    </section>
  );
}

function ReturnDrawer({ id, onClose, onChanged }: { id: string | null; onClose: () => void; onChanged: () => void }) {
  const [r, setR] = useState<AdminReturn | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<ReturnAction | null>(null);
  const [note, setNote] = useState("");
  const [restock, setRestock] = useState(true);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setR(null);
    setError(null);
    setAction(null);
    if (!id) return;
    adminService
      .getReturn(id)
      .then((res) => setR(res.data.data))
      .catch((err) => setError(getApiErrorMessage(err, "Couldn't load the return")));
  }, [id]);

  const choose = (a: ReturnAction) => {
    setAction(a);
    setNote("");
    setRestock(true);
    setAmount(r ? r.refundDue.toFixed(2) : "");
  };

  const submit = async () => {
    if (!r || !action) return;
    const refund = action === "REFUND" ? Number(amount) : undefined;
    if (refund !== undefined && !(refund > 0)) return toast("Enter a refund amount greater than 0.", true);
    if (action === "REFUND" && !window.confirm(`Refund ${money(refund!, r.order.currency)} to ${r.order.customer.name}?`)) return;
    setBusy(true);
    try {
      const res = await adminService.returnAction(r.id, {
        action,
        note: note.trim() || undefined,
        restock: action === "RECEIVE" ? restock : undefined,
        refundAmount: refund !== undefined && Math.abs(refund - r.refundDue) > 0.004 ? Math.round(refund * 100) / 100 : undefined,
      });
      setR(res.data.data);
      setAction(null);
      toast(`${r.rmaNumber} ${ACTION_DONE[action]}`);
      onChanged();
    } catch (err) {
      toast(getApiErrorMessage(err, "Couldn't update the return"), true);
    } finally {
      setBusy(false);
    }
  };

  const next = r ? ACTIONS[r.status] ?? [] : [];

  return (
    <Drawer
      open={!!id}
      onClose={onClose}
      title={r ? `Return ${r.rmaNumber}` : "Return"}
      sub={r ? <span className="badges">{dateTime(r.createdAt).date} <ReturnPill status={r.status} /></span> : null}
      foot={
        next.length && !action ? (
          <>
            {next.map((a) => (
              <button
                key={a}
                className={`btn ${a === "REJECT" ? "btn-danger" : a === next[0] ? "btn-primary" : "btn-secondary"}`}
                onClick={() => choose(a)}
              >
                {ACTION_LABEL[a]}
              </button>
            ))}
          </>
        ) : (
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        )
      }
    >
      {!r ? (
        error ? <p className="err-text">{error}</p> : <p className="sub">Loading…</p>
      ) : (
        <>
          {action ? (
            <div className={`d-sec actbox ${action === "REJECT" ? "bad" : ""}`}>
              <h3>{ACTION_LABEL[action]}</h3>
              <div className="form">
                {action === "RECEIVE" ? (
                  <label className="switch">
                    <input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} />
                    Put the units back into sellable stock
                  </label>
                ) : null}
                {action === "REFUND" ? (
                  <div className="fld">
                    <label htmlFor="rfAmount">Refund amount ({r.order.currency})</label>
                    <input className="inp" id="rfAmount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    <span className="hint">
                      Due for these lines: {money(r.refundDue, r.order.currency)} · already refunded on the order:{" "}
                      {money(r.order.refundedTotal, r.order.currency)} of {money(r.order.grandTotal, r.order.currency)}
                    </span>
                  </div>
                ) : null}
                {action === "REFUND" && r.status === "APPROVED" ? (
                  <p className="sub">Refunding before the parcel arrives skips receiving; stock isn&apos;t restored.</p>
                ) : null}
                <div className="fld">
                  <label htmlFor="rtNote">Note (optional)</label>
                  <input className="inp" id="rtNote" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
                </div>
                <div className="actrow">
                  <button className="btn btn-secondary btn-sm" onClick={() => setAction(null)} disabled={busy}>Back</button>
                  <button className={`btn btn-sm ${action === "REJECT" ? "btn-danger" : "btn-primary"}`} onClick={submit} disabled={busy}>
                    {busy ? "Saving…" : ACTION_LABEL[action]}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="d-sec">
            <h3>Items</h3>
            <div className="items">
              {r.lines.map((l) => (
                <div className="item" key={l.orderItemId}>
                  <div>
                    <strong>{l.productName}</strong>
                    <span className="sub"><code>{l.sku}</code></span>
                  </div>
                  <span>{l.quantity} × {money(l.unitPrice, r.order.currency)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="d-sec">
            <h3>Details</h3>
            <dl className="kv">
              <dt>Reason</dt><dd>{r.reason}</dd>
              <dt>Opened by</dt><dd>{r.requestedBy.toLowerCase()} · {whenText(r.createdAt)}</dd>
              <dt>Received</dt><dd>{whenText(r.receivedAt)}{r.receivedAt ? (r.restocked ? " · restocked" : " · not restocked") : ""}</dd>
              <dt>Refund</dt>
              <dd>
                {r.refundAmount !== null ? money(r.refundAmount, r.order.currency) : `${money(r.refundDue, r.order.currency)} due`}
                {r.refundedAt ? ` · ${whenText(r.refundedAt)}` : ""}
              </dd>
              {r.refundReference ? (<><dt>Refund ref.</dt><dd><code>{r.refundReference}</code></dd></>) : null}
              {r.adminNote ? (<><dt>Staff note</dt><dd>{r.adminNote}</dd></>) : null}
            </dl>
          </div>

          <div className="d-sec">
            <h3>Order</h3>
            <dl className="kv">
              <dt>Order</dt>
              <dd><Link className="link" href={`/admin/orders?id=${r.order.id}`}>{r.order.orderNumber}</Link> <OrderPill status={r.order.status} /></dd>
              <dt>Customer</dt><dd>{r.order.customer.name}<div className="sub">{r.order.customer.email}</div></dd>
              <dt>Total</dt><dd>{money(r.order.grandTotal, r.order.currency)}</dd>
              <dt>Refunded</dt><dd>{money(r.order.refundedTotal, r.order.currency)}</dd>
            </dl>
          </div>

          {r.status === "REFUNDED" || r.status === "REJECTED" ? (
            <div className="note">
              <Icon name="info" />
              <span>This return is closed.</span>
            </div>
          ) : null}
        </>
      )}
    </Drawer>
  );
}
