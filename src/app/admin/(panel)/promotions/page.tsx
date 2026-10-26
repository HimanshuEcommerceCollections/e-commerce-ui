"use client";
import { useCallback, useEffect, useState, type InputHTMLAttributes } from "react";
import adminService from "@/services/admin/admin.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type { AdminGiftCard, AdminPromotion, IssuedGiftCard, PromotionInput, PromotionType } from "@/types/api/admin.types";
import { Drawer, Icon, Pager, StatusPill, money, rangeText, shortDate, toast, usePageTitle, whenText } from "@/components/admin/ui";

const SIZE = 20;
type Tab = "codes" | "cards";

const TYPE_LABEL: Record<PromotionType, string> = { PERCENT: "Percent off", FIXED: "Amount off", FREE_SHIPPING: "Free shipping" };
const PROMO_STATE: Record<string, [string, string]> = {
  ACTIVE: ["Active", "p-ok"],
  SCHEDULED: ["Scheduled", "p-info"],
  EXPIRED: ["Expired", "p-grey"],
  INACTIVE: ["Inactive", "p-grey"],
};
const CARD_STATUS: Record<string, [string, string]> = {
  ACTIVE: ["Not redeemed", "p-info"],
  REDEEMED: ["Redeemed", "p-ok"],
  EXPIRED: ["Expired", "p-grey"],
  DISABLED: ["Disabled", "p-grey"],
};

const valueText = (p: AdminPromotion) =>
  p.type === "PERCENT" ? `${p.value}%` : p.type === "FIXED" ? money(p.value) : "Free standard shipping";

/** Per-field messages from a 400, keyed by field name. */
const fieldErrors = (err: unknown): Record<string, string> => {
  const data = (err as { response?: { status?: number; data?: { data?: unknown } } })?.response;
  return data?.status === 400 && data.data?.data && typeof data.data.data === "object" ? (data.data.data as Record<string, string>) : {};
};

/** "2026-10-26" in local time, for a date input. */
const toDateInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
/** A date input's day as an instant: the start of the day, or its last moment for an end date. */
const fromDateInput = (v: string, end = false) => (v ? new Date(`${v}T${end ? "23:59:59.999" : "00:00:00"}`).toISOString() : null);

/** Promo codes and gift cards (admin only). */
export default function AdminPromotionsPage() {
  usePageTitle("Promotions");
  const [tab, setTab] = useState<Tab>("codes");
  const [editing, setEditing] = useState<AdminPromotion | "new" | null>(null);
  const [issuing, setIssuing] = useState(false);
  const [reload, setReload] = useState(0);

  return (
    <section aria-labelledby="h-promos">
      <div className="page-head">
        <div>
          <h1 id="h-promos">Promotions</h1>
          <p>Promo codes customers enter at checkout, and gift cards they add to their store credit.</p>
        </div>
        <div className="actions">
          {tab === "codes" ? (
            <button className="btn btn-primary" onClick={() => setEditing("new")}>
              <Icon name="plus" />
              New promo code
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setIssuing(true)}>
              <Icon name="gift" />
              Issue gift card
            </button>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === "codes"} onClick={() => setTab("codes")}>Promo codes</button>
          <button role="tab" aria-selected={tab === "cards"} onClick={() => setTab("cards")}>Gift cards</button>
        </div>
        {tab === "codes" ? <PromoList key={`p${reload}`} onOpen={setEditing} /> : <GiftCardList key={`g${reload}`} />}
      </div>

      <PromoDrawer
        promo={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          setReload((n) => n + 1);
        }}
      />
      <IssueDrawer open={issuing} onClose={() => setIssuing(false)} onIssued={() => setReload((n) => n + 1)} />
    </section>
  );
}

function PromoList({ onOpen }: { onOpen: (p: AdminPromotion) => void }) {
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<AdminPromotion[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await adminService.listPromotions({ page, size: SIZE, sort: "createdAt,desc" });
      const data = r.data.data!;
      setRows(data.content);
      setTotal(data.totalElements);
      setPages(data.totalPages);
    } catch (err) {
      setRows([]);
      setError(getApiErrorMessage(err, "Couldn't load promotions"));
    }
  }, [page]);
  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <div className="twrap">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Type</th>
              <th className="num">Value</th>
              <th className="num">Min. subtotal</th>
              <th>Dates</th>
              <th className="num">Usage</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows === null ? (
              <tr className="loading-row"><td colSpan={7}>Loading promotions…</td></tr>
            ) : error ? (
              <tr className="empty-row"><td colSpan={7}><span className="err-text">{error}</span></td></tr>
            ) : rows.length === 0 ? (
              <tr className="empty-row"><td colSpan={7}>No promo codes yet. Use New promo code to add one.</td></tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id} className="click" tabIndex={0} onClick={() => onOpen(p)} onKeyDown={(e) => e.key === "Enter" && onOpen(p)}>
                  <td>
                    <code>{p.code}</code>
                    <div className="sub trunc">{p.description}</div>
                    {p.firstOrderOnly ? <span className="sub">First order only</span> : null}
                  </td>
                  <td>{TYPE_LABEL[p.type] ?? p.type}</td>
                  <td className="num">{p.type === "FREE_SHIPPING" ? "—" : valueText(p)}</td>
                  <td className="num">{p.minSubtotal ? money(p.minSubtotal) : <span className="sub">—</span>}</td>
                  <td className="sub">
                    {p.startsAt || p.endsAt
                      ? `${p.startsAt ? shortDate(p.startsAt) : "Now"} – ${p.endsAt ? shortDate(p.endsAt) : "no end"}`
                      : "Always"}
                  </td>
                  <td className="num">
                    {p.timesUsed.toLocaleString()} / {p.usageLimit ?? "∞"}
                    {p.perCustomerLimit ? <div className="sub">{p.perCustomerLimit} per customer</div> : null}
                  </td>
                  <td><StatusPill map={PROMO_STATE} status={p.state ?? (p.active ? "ACTIVE" : "INACTIVE")} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="tfoot">
        <span>{rows ? rangeText(page, SIZE, rows.length, total, "promo codes") : ""}</span>
        <Pager page={page} pages={pages} onPage={setPage} />
      </div>
    </>
  );
}

const EMPTY = {
  code: "",
  description: "",
  type: "PERCENT" as PromotionType,
  value: "",
  minSubtotal: "",
  startsAt: "",
  endsAt: "",
  usageLimit: "",
  perCustomerLimit: "",
  firstOrderOnly: false,
  active: true,
};

function PromoDrawer({ promo, onClose, onSaved }: { promo: AdminPromotion | "new" | null; onClose: () => void; onSaved: () => void }) {
  const existing = promo && promo !== "new" ? promo : null;
  const [f, setF] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setErrors({});
    if (!promo) return;
    setF(
      existing
        ? {
            code: existing.code,
            description: existing.description,
            type: existing.type,
            value: existing.type === "FREE_SHIPPING" ? "" : String(existing.value),
            minSubtotal: existing.minSubtotal !== null ? String(existing.minSubtotal) : "",
            startsAt: toDateInput(existing.startsAt),
            endsAt: toDateInput(existing.endsAt),
            usageLimit: existing.usageLimit !== null ? String(existing.usageLimit) : "",
            perCustomerLimit: existing.perCustomerLimit !== null ? String(existing.perCustomerLimit) : "",
            firstOrderOnly: existing.firstOrderOnly,
            active: existing.active,
          }
        : EMPTY
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promo]);

  const set = <K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) => setF((s) => ({ ...s, [k]: v }));
  const num = (v: string) => (v.trim() === "" ? null : Number(v));

  const save = async () => {
    const e: Record<string, string> = {};
    if (!f.code.trim()) e.code = "Enter a code";
    else if (!/^[A-Za-z0-9_-]+$/.test(f.code.trim())) e.code = "Use letters, numbers, dashes or underscores";
    if (!f.description.trim()) e.description = "Enter a description";
    const value = f.type === "FREE_SHIPPING" ? 0 : Number(f.value);
    if (f.type !== "FREE_SHIPPING" && !(value > 0)) e.value = "Enter a value greater than 0";
    if (f.type === "PERCENT" && value > 100) e.value = "A percentage can't be more than 100";
    if (f.startsAt && f.endsAt && f.endsAt < f.startsAt) e.endsAt = "The end date is before the start date";
    setErrors(e);
    if (Object.keys(e).length) return;

    const body: PromotionInput = {
      code: f.code.trim().toUpperCase(),
      description: f.description.trim(),
      type: f.type,
      value,
      minSubtotal: num(f.minSubtotal),
      startsAt: fromDateInput(f.startsAt),
      endsAt: fromDateInput(f.endsAt, true),
      usageLimit: num(f.usageLimit),
      perCustomerLimit: num(f.perCustomerLimit),
      firstOrderOnly: f.firstOrderOnly,
      active: f.active,
    };
    setBusy(true);
    try {
      if (existing) await adminService.updatePromotion(existing.id, body);
      else await adminService.createPromotion(body);
      toast(`${body.code} ${existing ? "saved" : "created"}`);
      onSaved();
    } catch (err) {
      const fe = fieldErrors(err);
      setErrors(fe);
      if (!Object.keys(fe).length) toast(getApiErrorMessage(err, "Couldn't save the promo code"), true);
    } finally {
      setBusy(false);
    }
  };

  const deactivate = async () => {
    if (!existing || !window.confirm(`Deactivate ${existing.code}? Customers can no longer use it; past orders keep their discount.`)) return;
    setBusy(true);
    try {
      await adminService.deactivatePromotion(existing.id);
      toast(`${existing.code} deactivated`);
      onSaved();
    } catch (err) {
      toast(getApiErrorMessage(err, "Couldn't deactivate the promo code"), true);
    } finally {
      setBusy(false);
    }
  };

  const fld = (key: keyof typeof EMPTY, label: string, props: InputHTMLAttributes<HTMLInputElement> = {}, hint?: string) => (
    <div className="fld">
      <label htmlFor={`pr-${key}`}>{label}</label>
      <input
        className={`inp ${errors[key] ? "bad" : ""}`}
        id={`pr-${key}`}
        value={f[key] as string}
        onChange={(e) => set(key, e.target.value as never)}
        {...props}
      />
      {errors[key] ? <span className="err-text">{errors[key]}</span> : hint ? <span className="hint">{hint}</span> : null}
    </div>
  );

  return (
    <Drawer
      open={!!promo}
      onClose={onClose}
      title={existing ? existing.code : "New promo code"}
      sub={existing ? <span className="badges">Used {existing.timesUsed} time{existing.timesUsed === 1 ? "" : "s"} <StatusPill map={PROMO_STATE} status={existing.state} /></span> : null}
      foot={
        <>
          {existing?.active ? (
            <button className="btn btn-danger" onClick={deactivate} disabled={busy}>Deactivate</button>
          ) : null}
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={busy}>
            {busy ? "Saving…" : existing ? "Save changes" : "Create code"}
          </button>
        </>
      }
    >
      <div className="form">
        <div className="row2">
          {fld("code", "Code", { maxLength: 40, style: { textTransform: "uppercase" }, autoComplete: "off" })}
          <div className="fld">
            <label htmlFor="pr-type">Type</label>
            <select className="sel inp" id="pr-type" value={f.type} onChange={(e) => set("type", e.target.value as PromotionType)}>
              {(Object.keys(TYPE_LABEL) as PromotionType[]).map((t) => (
                <option key={t} value={t}>{TYPE_LABEL[t]}</option>
              ))}
            </select>
          </div>
        </div>
        {fld("description", "Description", { maxLength: 255, placeholder: "10% off your first order" }, "Shown to the customer when the code is applied.")}
        <div className="row2">
          {f.type === "FREE_SHIPPING" ? (
            <div className="fld">
              <label>Value</label>
              <span className="hint">Standard shipping becomes free.</span>
            </div>
          ) : (
            fld("value", f.type === "PERCENT" ? "Percent off" : "Amount off (USD)", { inputMode: "decimal", placeholder: f.type === "PERCENT" ? "10" : "5.00" })
          )}
          {fld("minSubtotal", "Minimum subtotal (optional)", { inputMode: "decimal", placeholder: "50.00" })}
        </div>
        <div className="row2">
          {fld("startsAt", "Starts (optional)", { type: "date" })}
          {fld("endsAt", "Ends (optional)", { type: "date" }, "Last day the code works.")}
        </div>
        <div className="row2">
          {fld("usageLimit", "Total uses (optional)", { inputMode: "numeric", placeholder: "Unlimited" })}
          {fld("perCustomerLimit", "Uses per customer (optional)", { inputMode: "numeric", placeholder: "Unlimited" })}
        </div>
        <label className="switch">
          <input type="checkbox" checked={f.firstOrderOnly} onChange={(e) => set("firstOrderOnly", e.target.checked)} />
          First order only
        </label>
        <label className="switch">
          <input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} />
          Active
        </label>
        {errors.type ? <p className="err-text">{errors.type}</p> : null}
      </div>
    </Drawer>
  );
}

function GiftCardList() {
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<AdminGiftCard[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    adminService
      .listGiftCards({ page, size: SIZE })
      .then((r) => {
        const data = r.data.data!;
        setRows(data.content);
        setTotal(data.totalElements);
        setPages(data.totalPages);
      })
      .catch((err) => {
        setRows([]);
        setError(getApiErrorMessage(err, "Couldn't load gift cards"));
      });
  }, [page]);

  return (
    <>
      <div className="twrap">
        <table>
          <thead>
            <tr>
              <th>Card</th>
              <th className="num">Amount</th>
              <th>Status</th>
              <th>Issued</th>
              <th>Expires</th>
              <th>Redeemed</th>
            </tr>
          </thead>
          <tbody>
            {rows === null ? (
              <tr className="loading-row"><td colSpan={6}>Loading gift cards…</td></tr>
            ) : error ? (
              <tr className="empty-row"><td colSpan={6}><span className="err-text">{error}</span></td></tr>
            ) : rows.length === 0 ? (
              <tr className="empty-row"><td colSpan={6}>No gift cards yet. Use Issue gift card to create one.</td></tr>
            ) : (
              rows.map((g) => (
                <tr key={g.id}>
                  <td><code>{g.maskedCode}</code></td>
                  <td className="num">{money(g.amount, g.currency)}</td>
                  <td><StatusPill map={CARD_STATUS} status={g.status} /></td>
                  <td>{shortDate(g.createdAt)}{g.createdBy ? <div className="sub">{g.createdBy}</div> : null}</td>
                  <td className="sub">{g.expiresAt ? shortDate(g.expiresAt) : "Never"}</td>
                  <td>{g.redeemedAt ? <>{shortDate(g.redeemedAt)}<div className="sub">{g.redeemedByEmail ?? ""}</div></> : <span className="sub">—</span>}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="tfoot">
        <span>{rows ? rangeText(page, SIZE, rows.length, total, "gift cards") : ""}</span>
        <Pager page={page} pages={pages} onPage={setPage} />
      </div>
    </>
  );
}

/** Issues a card; its code and PIN are shown once, here, and never again. */
function IssueDrawer({ open, onClose, onIssued }: { open: boolean; onClose: () => void; onIssued: () => void }) {
  const [amount, setAmount] = useState("");
  const [expires, setExpires] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<IssuedGiftCard | null>(null);

  useEffect(() => {
    if (!open) return;
    setAmount("");
    setExpires("");
    setErrors({});
    setIssued(null);
  }, [open]);

  const issue = async () => {
    const n = Number(amount);
    if (!(n > 0) || n > 2000) return setErrors({ amount: "Enter an amount from 0.01 to 2,000.00" });
    setErrors({});
    setBusy(true);
    try {
      const r = await adminService.issueGiftCard({ amount: Math.round(n * 100) / 100, expiresAt: fromDateInput(expires, true) ?? undefined });
      setIssued(r.data.data);
      onIssued();
    } catch (err) {
      const fe = fieldErrors(err);
      setErrors(fe);
      if (!Object.keys(fe).length) toast(getApiErrorMessage(err, "Couldn't issue the gift card"), true);
    } finally {
      setBusy(false);
    }
  };

  const copy = (text: string, what: string) =>
    navigator.clipboard?.writeText(text).then(
      () => toast(`${what} copied`),
      () => toast(`Couldn't copy the ${what.toLowerCase()}`, true)
    );

  // Closing hides the code for good, so confirm while it's on screen.
  const close = () => {
    if (issued && !window.confirm("Close? The code and PIN won't be shown again.")) return;
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={close}
      title={issued ? "Gift card issued" : "Issue gift card"}
      foot={
        issued ? (
          <button className="btn btn-primary" onClick={close}>Done</button>
        ) : (
          <>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={issue} disabled={busy}>{busy ? "Issuing…" : "Issue card"}</button>
          </>
        )
      }
    >
      {issued ? (
        <>
          <div className="note warn" role="alert">
            <Icon name="lock" />
            <span>Copy the code and PIN now. They&apos;re shown only once; we store neither.</span>
          </div>
          <div className="d-sec">
            <dl className="kv">
              <dt>Amount</dt><dd>{money(issued.amount, issued.currency)}</dd>
              <dt>Code</dt>
              <dd className="secret">
                <code>{issued.code}</code>
                <button className="link" onClick={() => copy(issued.code, "Code")}>Copy</button>
              </dd>
              <dt>PIN</dt>
              <dd className="secret">
                <code>{issued.pin}</code>
                <button className="link" onClick={() => copy(issued.pin, "PIN")}>Copy</button>
              </dd>
              <dt>Expires</dt><dd>{issued.expiresAt ? whenText(issued.expiresAt) : "Never"}</dd>
            </dl>
          </div>
          <p className="sub">The customer adds it in their account under Store credit, with the code and PIN.</p>
        </>
      ) : (
        <div className="form">
          <div className="fld">
            <label htmlFor="gcAmount">Amount (USD)</label>
            <input className={`inp ${errors.amount ? "bad" : ""}`} id="gcAmount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50.00" />
            {errors.amount ? <span className="err-text">{errors.amount}</span> : <span className="hint">Up to $2,000.</span>}
          </div>
          <div className="fld">
            <label htmlFor="gcExpires">Expires (optional)</label>
            <input className={`inp ${errors.expiresAt ? "bad" : ""}`} id="gcExpires" type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
            {errors.expiresAt ? <span className="err-text">{errors.expiresAt}</span> : <span className="hint">Leave empty for a card that never expires.</span>}
          </div>
        </div>
      )}
    </Drawer>
  );
}
