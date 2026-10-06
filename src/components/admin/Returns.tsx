"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import adminService from "@/services/admin/admin.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type { AdminReturn, OrderReturnSummary, ReturnAction, ReturnStatus } from "@/types/api/admin.types";
import { refreshAdminCounts } from "./refresh";
import { Drawer, Icon, OrderPill, Pager, ReturnPill, dateTime, money, rangeText, toast, whenText } from "./ui";

// Returns and refunds (FR-AD-07): a tab of Orders, and inside each order's detail.

const SIZE = 20;
export const RETURN_FILTERS: Array<{ key: ReturnStatus | "ALL"; label: string }> = [
  { key: "ALL", label: "All returns" },
  { key: "REQUESTED", label: "Requested" },
  { key: "APPROVED", label: "Approved" },
  { key: "RECEIVED", label: "Received" },
  { key: "REFUNDED", label: "Refunded" },
  { key: "REJECTED", label: "Rejected" },
];

/** Valid next steps per status. */
export const RETURN_ACTIONS: Record<ReturnStatus, ReturnAction[]> = {
  REQUESTED: ["APPROVE", "REJECT"],
  APPROVED: ["RECEIVE", "REFUND", "REJECT"],
  RECEIVED: ["REFUND"],
  REJECTED: [],
  REFUNDED: [],
};
const ACTION_LABEL: Record<ReturnAction, string> = {
  APPROVE: "Approve",
  REJECT: "Reject",
  RECEIVE: "Receive",
  REFUND: "Refund",
};
const ACTION_DONE: Record<ReturnAction, string> = {
  APPROVE: "approved",
  REJECT: "rejected",
  RECEIVE: "received",
  REFUND: "refunded",
};
const METHOD: Record<string, string> = { DROPOFF: "Drop-off", PICKUP: "Courier pickup" };

const units = (r: { items: { quantity: number }[] }) => r.items.reduce((n, i) => n + i.quantity, 0);

/** The returns table shown under Orders › Returns. */
export function ReturnsList({ status, initialOpen }: { status: ReturnStatus | "ALL"; initialOpen?: string | null }) {
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<AdminReturn[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(initialOpen ?? null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const list = await adminService.listReturns({ status: status === "ALL" ? undefined : status, page, size: SIZE, sort: "createdAt,desc" });
      const data = list.data.data!;
      setRows(data.content);
      setTotal(data.totalElements);
      setPages(data.totalPages);
    } catch (err) {
      setRows([]);
      setError(getApiErrorMessage(err, "Couldn't load returns"));
    }
  }, [status, page]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => setPage(0), [status]);

  return (
    <>
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
                  <tr
                    key={r.id}
                    className="click"
                    tabIndex={0}
                    onClick={() => setOpen(r.id)}
                    onKeyDown={(e) => e.key === "Enter" && setOpen(r.id)}
                  >
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
      <ReturnDrawer
        id={open}
        onClose={() => setOpen(null)}
        onChanged={() => {
          load();
          refreshAdminCounts();
        }}
      />
    </>
  );
}

/** The form for one action on a return: approve, reject, receive (restock) or refund (amount). */
export function ReturnActionForm({
  r,
  action,
  onBack,
  onDone,
}: {
  r: AdminReturn;
  action: ReturnAction;
  onBack: () => void;
  onDone: (updated: AdminReturn) => void;
}) {
  const [note, setNote] = useState("");
  const [restock, setRestock] = useState(true);
  const [amount, setAmount] = useState(r.refundDue.toFixed(2));
  const [busy, setBusy] = useState(false);
  const left = Math.max(0, r.order.grandTotal - r.order.refundedTotal);

  const submit = async () => {
    const refund = action === "REFUND" ? Number(amount) : undefined;
    if (refund !== undefined && !(refund > 0)) return toast("Enter a refund amount greater than 0.", true);
    if (refund !== undefined && refund > left + 0.004) return toast(`At most ${money(left, r.order.currency)} can still be refunded.`, true);
    if (action === "REFUND" && !window.confirm(`Refund ${money(refund!, r.order.currency)} to ${r.order.customer.name}?`)) return;
    setBusy(true);
    try {
      const res = await adminService.returnAction(r.id, {
        action,
        note: note.trim() || undefined,
        restock: action === "RECEIVE" ? restock : undefined,
        refundAmount: refund !== undefined && Math.abs(refund - r.refundDue) > 0.004 ? Math.round(refund * 100) / 100 : undefined,
      });
      toast(`${r.rmaNumber} ${ACTION_DONE[action]}${action === "REFUND" ? ` · ${money(refund!, r.order.currency)}` : ""}`);
      onDone(res.data.data!);
    } catch (err) {
      toast(getApiErrorMessage(err, "Couldn't update the return"), true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`actbox ${action === "REJECT" ? "bad" : ""}`}>
      <div className="form">
        <strong>{ACTION_LABEL[action]} {r.rmaNumber}</strong>
        {action === "RECEIVE" ? (
          <label className="switch">
            <input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} />
            Put the units back into sellable stock
          </label>
        ) : null}
        {action === "REFUND" ? (
          <div className="fld">
            <label htmlFor={`rf-${r.id}`}>Refund amount ({r.order.currency})</label>
            <input className="inp" id={`rf-${r.id}`} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <span className="hint">
              Due for these lines: {money(r.refundDue, r.order.currency)} · still refundable on the order: {money(left, r.order.currency)}.
              Enter less for a partial refund.
            </span>
          </div>
        ) : null}
        {action === "REFUND" && r.status === "APPROVED" ? (
          <p className="sub">Refunding before the parcel arrives skips receiving; stock isn&apos;t restored.</p>
        ) : null}
        <div className="fld">
          <label htmlFor={`rn-${r.id}`}>Note (optional)</label>
          <input className="inp" id={`rn-${r.id}`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
        </div>
        <div className="actrow">
          <button className="btn btn-secondary btn-sm" onClick={onBack} disabled={busy}>Back</button>
          <button className={`btn btn-sm ${action === "REJECT" ? "btn-danger" : "btn-primary"}`} onClick={submit} disabled={busy}>
            {busy ? "Saving…" : action === "REFUND" ? `Refund ${money(Number(amount) || 0, r.order.currency)}` : ACTION_LABEL[action]}
          </button>
        </div>
      </div>
    </div>
  );
}

/** A return inside an order's detail, with its next actions inline. */
export function OrderReturnRow({ r, currency, onChanged }: { r: OrderReturnSummary; currency: string; onChanged: () => void }) {
  const [full, setFull] = useState<AdminReturn | null>(null);
  const [action, setAction] = useState<ReturnAction | null>(null);
  const next = RETURN_ACTIONS[r.status] ?? [];

  const choose = async (a: ReturnAction) => {
    try {
      // The refund due and the order's refundable balance come with the full return.
      const res = full ?? (await adminService.getReturn(r.id)).data.data!;
      setFull(res);
      setAction(a);
    } catch (err) {
      toast(getApiErrorMessage(err, "Couldn't load the return"), true);
    }
  };

  return (
    <div className="vcard">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <strong>{r.rmaNumber}</strong>
          <span className="sub">
            {units(r)} unit{units(r) === 1 ? "" : "s"} · {r.reason}
            {r.restocked ? " · restocked" : ""} · {whenText(r.createdAt)}
          </span>
        </div>
        <span style={{ textAlign: "right" }}>
          <ReturnPill status={r.status} />
          {r.refundAmount ? <div className="sub">{money(r.refundAmount, currency)} refunded</div> : null}
        </span>
      </div>
      {action && full ? (
        <ReturnActionForm
          r={full}
          action={action}
          onBack={() => setAction(null)}
          onDone={(u) => {
            setFull(u);
            setAction(null);
            onChanged();
          }}
        />
      ) : next.length ? (
        <div className="actrow" style={{ justifyContent: "flex-start" }}>
          {next.map((a) => (
            <button key={a} className={`btn btn-sm ${a === "REJECT" ? "btn-danger" : a === next[0] ? "btn-primary" : "btn-secondary"}`} onClick={() => choose(a)}>
              {a === "RECEIVE" ? "Receive (restock)" : a === "REFUND" ? "Refund…" : ACTION_LABEL[a]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ReturnDrawer({ id, onClose, onChanged }: { id: string | null; onClose: () => void; onChanged: () => void }) {
  const [r, setR] = useState<AdminReturn | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<ReturnAction | null>(null);

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

  const next = r ? RETURN_ACTIONS[r.status] ?? [] : [];

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
                onClick={() => setAction(a)}
              >
                {a === "RECEIVE" ? "Receive (restock)" : ACTION_LABEL[a]}
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
            <ReturnActionForm
              r={r}
              action={action}
              onBack={() => setAction(null)}
              onDone={(u) => {
                setR(u);
                setAction(null);
                onChanged();
              }}
            />
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
              {r.method ? (<><dt>Method</dt><dd>{METHOD[r.method] ?? r.method}</dd></>) : null}
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
