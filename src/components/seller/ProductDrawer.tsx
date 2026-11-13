"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import sellerService from "@/services/seller/seller.service";
import type { PriceChange, ReviewActivity, SellerProduct, StockMove, SubmissionReport } from "@/types/api/seller.types";
import { describeActivity } from "./SellerShell";
import {
  Dialog,
  FieldError,
  Ico,
  KIND,
  Loading,
  Pill,
  StatePill,
  SubmissionPill,
  Thumb,
  errorText,
  fmtDate,
  money,
  pct,
  rel,
  reviewBy,
} from "./ui";

export type DrawerTab = "details" | "price" | "notes" | "stock";
const BIG_CHANGE = 0.3;
const DELIST_REASONS = ["Discontinued", "Out of stock long-term", "Quality issue", "Other"];

/** What a price request's report means for the seller, as one line. */
export function priceOutcome(r: SubmissionReport) {
  if (r.errors.length) return { ok: false, text: r.errors[0].reason };
  if (r.submissions.length) return { ok: true, text: `Price change sent for review as ${r.submissions[0].reference}. Shoppers see the old price until it's approved.` };
  if (r.draftsSaved.length) return { ok: true, text: "Draft price updated. It's reviewed when you submit the product." };
  return { ok: true, text: "That's already the price." };
}

/**
 * One product, as in the design's side drawer: details and actions, price
 * history and requests, review notes, stock history and update.
 */
export function ProductDrawer({
  product,
  tab,
  setTab,
  prices,
  activity,
  onClose,
  onChanged,
}: {
  product: SellerProduct | null;
  tab: DrawerTab;
  setTab: (t: DrawerTab) => void;
  prices: PriceChange[];
  activity: ReviewActivity[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const p = product;
  const notes = p ? activity.filter((a) => a.parentProductId === p.id && a.note) : [];
  const tabs: [DrawerTab, string][] = [
    ["details", "Details"],
    ["price", "Price"],
    ["notes", `Review notes${notes.length ? ` (${notes.length})` : ""}`],
    ["stock", "Stock"],
  ];
  return (
    <Dialog open={!!p} onClose={onClose} label={p?.name ?? "Product"} drawer>
      {p ? (
        <>
          <div className="sp-dh">
            <div className="sp-sup">
              <Thumb src={p.imageUrl} size={52} />
              <span style={{ minWidth: 0 }}>
                <h2>{p.name}</h2>
                <StatePill state={p.state} />
              </span>
            </div>
            <button type="button" className="sp-x" aria-label="Close" onClick={onClose}>
              <Ico name="x" />
            </button>
          </div>
          <div className="sp-dtabs" role="tablist">
            {tabs.map(([k, label]) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
                {label}
              </button>
            ))}
          </div>
          <div className="sp-db">
            {tab === "details" ? <Details p={p} onChanged={onChanged} onClose={onClose} /> : null}
            {tab === "price" ? <PriceTab p={p} prices={prices.filter((c) => c.parentProductId === p.id)} onChanged={onChanged} /> : null}
            {tab === "notes" ? <NotesTab p={p} notes={notes} /> : null}
            {tab === "stock" ? <StockTab p={p} onChanged={onChanged} /> : null}
          </div>
        </>
      ) : null}
    </Dialog>
  );
}

function Details({ p, onChanged, onClose }: { p: SellerProduct; onChanged: () => void; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [delisting, setDelisting] = useState(false);
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const open = p.openSubmission;
  const live = p.state === "LIVE" || p.state === "CHANGE_PENDING";
  const editable = ["LIVE", "CHANGE_PENDING", "CHANGES_REQUESTED", "DRAFT", "SUSPENDED", "SUBMITTED"].includes(p.state) && open?.status !== "IN_REVIEW" && open?.kind !== "DELIST";

  const act = async (fn: () => Promise<unknown>, done: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(done);
      onChanged();
    } catch (e) {
      toast.error(errorText(e, "That didn't work. Try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {p.state === "CHANGE_PENDING" && open ? (
        <div className="sp-alert sp-alert-info">
          <Ico name="info" />
          <span>
            <b>
              A {KIND[open.kind].toLowerCase()} is waiting for review (<Link href={`/merchant/submissions/${open.reference}`}>{open.reference}</Link>).
            </b>{" "}
            Shoppers still see the live version until it&apos;s approved.
          </span>
        </div>
      ) : null}
      {p.state === "SUBMITTED" || p.state === "IN_REVIEW" ? (
        <div className="sp-alert sp-alert-info">
          <Ico name="clock" />
          <span>
            {p.state === "IN_REVIEW" ? "Our catalog team is reviewing this product now." : "Waiting for review."} We&apos;ll reply by{" "}
            {reviewBy(open?.submittedAt ?? p.updatedAt)}.
          </span>
        </div>
      ) : null}
      {open?.status === "CHANGES_REQUESTED" ? (
        <div className="sp-alert sp-alert-warn">
          <Ico name="warn" />
          <span>
            <b>Changes requested.</b> {open.reviewNote}
          </span>
        </div>
      ) : null}
      {p.state === "SUSPENDED" ? (
        <div className="sp-alert sp-alert-bad">
          <Ico name="alert" />
          <span>This product is hidden from the store. Check the review notes, fix it and resubmit.</span>
        </div>
      ) : null}

      <dl className="sp-kv">
        <dt>Product code</dt>
        <dd className="sp-mono">{p.code}</dd>
        <dt>Category</dt>
        <dd>{[p.category, p.subcategory].filter(Boolean).join(" › ") || "—"}</dd>
        <dt>Brand</dt>
        <dd>{p.brand || "—"}</dd>
        <dt>Last updated</dt>
        <dd>{rel(p.updatedAt)}</dd>
        {open ? (
          <>
            <dt>Open submission</dt>
            <dd>
              <Link href={`/merchant/submissions/${open.reference}`}>{open.reference}</Link> · {KIND[open.kind]} · <SubmissionPill status={open.status} />
            </dd>
          </>
        ) : null}
      </dl>

      <div className="sp-tw sp-box" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Price</th>
              <th>MRP</th>
              <th>Stock</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {p.variants.map((v) => (
              <tr key={v.sku}>
                <td>
                  <span className="sp-mono">{v.sku}</span>
                  {v.variantName ? <small className="sp-muted" style={{ display: "block" }}>{v.variantName}</small> : null}
                </td>
                <td className="sp-num">{money(v.price)}</td>
                <td className="sp-num">{money(v.mrp)}</td>
                <td className="sp-num">{v.stockQuantity}</td>
                <td>{v.status.charAt(0) + v.status.slice(1).toLowerCase()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editable ? (
        <div className="sp-box">
          <h3 className="sp-bh">
            {p.state === "CHANGES_REQUESTED" || p.state === "SUSPENDED" ? "Fix and resubmit" : p.state === "DRAFT" ? "Finish this draft" : "Edit this product"}
          </h3>
          <p className="sp-help">
            {live
              ? "Your edit is reviewed before it goes live. Until then, shoppers see the current version."
              : "Changes are sent to our catalog team for review."}
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link className="sp-btn sp-btn-grn sp-btn-sm" href={`/merchant/add/product?edit=${p.id}`} onClick={onClose}>
              {p.state === "DRAFT" ? "Continue editing" : p.state === "CHANGES_REQUESTED" || p.state === "SUSPENDED" ? "Fix and resubmit" : "Edit details"}
            </Link>
            {p.state === "DRAFT" && !open ? (
              <button type="button" className="sp-btn sp-btn-sec sp-btn-sm" disabled={busy} onClick={() => act(() => sellerService.submitDraft(p.id), "Submitted for review")}>
                Submit for review as it is
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {open && (open.status === "SUBMITTED" || open.status === "CHANGES_REQUESTED") ? (
        <div className="sp-box">
          <h3 className="sp-bh">Withdraw {open.reference}</h3>
          <p className="sp-help">
            {open.kind === "NEW_PRODUCT"
              ? "The product goes back to being a draft that isn't in the review queue."
              : "The live version stays exactly as it is."}
          </p>
          <div>
            <button
              type="button"
              className="sp-btn sp-btn-sec sp-btn-sm"
              disabled={busy}
              onClick={() => act(() => sellerService.withdraw(open.reference), "Withdrawn. Nothing changed on the store.")}
            >
              Withdraw my {open.kind === "DELIST" ? "delisting request" : open.kind === "EDIT" ? "change" : "submission"}
            </button>
          </div>
        </div>
      ) : null}

      {live && !open ? (
        <div className="sp-box sp-danger">
          <h3 className="sp-bh">{delisting ? "Why are you delisting it?" : "Stop selling this product"}</h3>
          {delisting ? (
            <>
              <div className="sp-seg" role="radiogroup" aria-label="Reason">
                {DELIST_REASONS.map((r) => (
                  <label key={r} className="sp-segopt">
                    <input type="radio" name="sp-dr" value={r} checked={reason === r} onChange={() => setReason(r)} />
                    <span>{r}</span>
                  </label>
                ))}
              </div>
              <label className="sp-field" htmlFor="sp-dr-d">
                <span className="sp-lab">
                  Anything else? <span className="sp-opt">Optional</span>
                </span>
                <input id="sp-dr-d" className="sp-inp" value={detail} maxLength={500} onChange={(e) => setDetail(e.target.value)} />
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="sp-btn sp-btn-sec sp-btn-sm" onClick={() => setDelisting(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="sp-btn sp-btn-pri sp-btn-sm"
                  disabled={busy}
                  onClick={() => {
                    if (!reason) return toast.error("Choose a reason");
                    void act(() => sellerService.delist(p.id, [reason, detail.trim()].filter(Boolean).join(": ")), "Delisting requested. It stays live until approved.");
                  }}
                >
                  Send request
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="sp-help">Delisting is reviewed like any other change. The product stays live until it&apos;s approved.</p>
              <div>
                <button type="button" className="sp-btn sp-btn-sec sp-btn-sm" onClick={() => setDelisting(true)}>
                  Request delisting
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}
    </>
  );
}

function PriceTab({ p, prices, onChanged }: { p: SellerProduct; prices: PriceChange[]; onChanged: () => void }) {
  const [sku, setSku] = useState(p.variants[0]?.sku ?? "");
  const v = p.variants.find((x) => x.sku === sku) ?? p.variants[0];
  const [price, setPrice] = useState(v ? v.price.toFixed(2) : "");
  const [mrp, setMrp] = useState(v?.mrp ? v.mrp.toFixed(2) : "");
  const [note, setNote] = useState("");
  const [bigOk, setBigOk] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const blocked = p.openSubmission?.status === "IN_REVIEW" || p.openSubmission?.kind === "DELIST" || p.state === "ARCHIVED";
  const pending = prices.find((c) => c.status === "SUBMITTED" || c.status === "IN_REVIEW" || c.status === "CHANGES_REQUESTED");

  useEffect(() => {
    if (!v) return;
    setPrice(v.price.toFixed(2));
    setMrp(v.mrp ? v.mrp.toFixed(2) : "");
    setBigOk(false);
    setErr("");
  }, [v]);

  if (!v) return <p className="sp-muted">This product has no SKUs.</p>;
  const n = Number(price.replace(/[$,\s]/g, ""));
  const m = mrp.trim() ? Number(mrp.replace(/[$,\s]/g, "")) : null;
  const change = n > 0 && n !== v.price ? (n - v.price) / v.price : 0;
  const big = Math.abs(change) >= BIG_CHANGE;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!(n > 0)) return setErr("Enter your price, like 28.50");
    if (m !== null && !(m > 0)) return setErr("Enter the MRP, or leave it empty");
    if (m !== null && n > m) return setErr(`Your price can't be higher than the MRP (${money(m)})`);
    if (n === v.price && (m ?? null) === (v.mrp ?? null)) return setErr("Nothing changed yet");
    if (big && !bigOk) return setErr("Please confirm the new price");
    setErr("");
    setBusy(true);
    try {
      const r = (await sellerService.requestPrice(p.id, { items: [{ sku: v.sku, price: n, ...(m ? { mrp: m } : {}) }], note: note.trim() || undefined })).data.data!;
      const out = priceOutcome(r);
      if (out.ok) {
        toast.success(out.text);
        setNote("");
        onChanged();
      } else setErr(out.text);
    } catch (e2) {
      setErr(errorText(e2, "We couldn't send the price change. Try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="sp-pstats">
        <div>
          <span>Live price</span>
          <b>{money(v.price)}</b>
        </div>
        <div>
          <span>MRP</span>
          <b>{money(v.mrp)}</b>
        </div>
        <div>
          <span>Requests, 30 days</span>
          <b>{prices.length}</b>
        </div>
      </div>
      {pending ? (
        <div className="sp-alert sp-alert-info">
          <Ico name="clock" />
          <span>
            <b>
              {money(pending.from)} → {money(pending.to)} ({pct(pending.from, pending.to)}) is waiting for review.
            </b>{" "}
            Shoppers still pay {money(pending.from)} until it&apos;s approved.
          </span>
        </div>
      ) : null}

      {blocked ? (
        <p className="sp-help">Prices can&apos;t be changed while {p.openSubmission ? `${p.openSubmission.reference} is in review or open` : "the product is archived"}.</p>
      ) : (
        <form className="sp-box" onSubmit={submit} noValidate>
          <h3 className="sp-bh">Change the price</h3>
          {p.variants.length > 1 ? (
            <label className="sp-field" htmlFor="sp-pr-sku">
              <span className="sp-lab">SKU</span>
              <select id="sp-pr-sku" className="sp-inp" value={v.sku} onChange={(e) => setSku(e.target.value)}>
                {p.variants.map((x) => (
                  <option key={x.sku} value={x.sku}>
                    {x.variantName ? `${x.variantName} · ` : ""}
                    {x.sku} ({money(x.price)})
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="sp-g2">
            <label className="sp-field" htmlFor="sp-pr">
              <span className="sp-lab">Your price</span>
              <span className="sp-unit sp-pre">
                <span>$</span>
                <input id="sp-pr" className="sp-inp" inputMode="decimal" value={price} onChange={(e) => { setPrice(e.target.value); setBigOk(false); }} />
              </span>
              {change ? (
                <span className="sp-help">
                  Live {money(v.price)} → {money(n)} <b className={change < 0 ? "sp-dn" : "sp-up"}>{pct(v.price, n)}</b>
                </span>
              ) : null}
            </label>
            <label className="sp-field" htmlFor="sp-mrp">
              <span className="sp-lab">MRP</span>
              <span className="sp-unit sp-pre">
                <span>$</span>
                <input id="sp-mrp" className="sp-inp" inputMode="decimal" value={mrp} onChange={(e) => setMrp(e.target.value)} />
              </span>
            </label>
          </div>
          {big ? (
            <div className="sp-alert sp-alert-warn">
              <Ico name="warn" />
              <div>
                <b>
                  That&apos;s {Math.abs(change * 100).toFixed(0)}% {change < 0 ? "lower" : "higher"} than your live price.
                </b>{" "}
                Big changes get an extra check by our team.
                <label className="sp-check" style={{ marginTop: 8 }}>
                  <input type="checkbox" checked={bigOk} onChange={(e) => setBigOk(e.target.checked)} /> Yes, {money(n)} is the right price
                </label>
              </div>
            </div>
          ) : null}
          <label className="sp-field" htmlFor="sp-pr-note">
            <span className="sp-lab">
              Reason <span className="sp-opt">Optional, for our reviewer</span>
            </span>
            <input id="sp-pr-note" className="sp-inp" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Supplier cost increase" />
          </label>
          <FieldError id="sp-pr-e">{err}</FieldError>
          <div>
            <button className="sp-btn sp-btn-grn sp-btn-sm" disabled={busy}>
              {busy ? "Sending…" : "Submit price for review"}
            </button>
          </div>
        </form>
      )}

      <ol className="sp-phl">
        {prices.length ? (
          prices.map((c) => (
            <li key={`${c.reference}-${c.sku}`} className={c.status === "SUBMITTED" || c.status === "IN_REVIEW" ? "sp-pending" : ""}>
              <div className="sp-phr">
                <span className="sp-phd">{fmtDate(c.decidedAt ?? c.submittedAt)}</span>
                <span className="sp-num">
                  <span className="sp-muted">{money(c.from)} →</span> <b>{money(c.to)}</b>{" "}
                  <span className={c.to < c.from ? "sp-dn" : "sp-up"}>{pct(c.from, c.to)}</span>
                  {p.variants.length > 1 ? <span className="sp-mono sp-muted"> · {c.sku}</span> : null}
                </span>
                <SubmissionPill status={c.status} />
              </div>
              {c.reviewNote ? <p className="sp-phn">{c.reviewNote}</p> : null}
            </li>
          ))
        ) : (
          <li className="sp-muted">No price requests in the last 30 days.</li>
        )}
      </ol>
      <p className="sp-help">Price requests waiting for review and those decided in the last 30 days. Only approved prices are ever shown to shoppers.</p>
    </>
  );
}

function NotesTab({ p, notes }: { p: SellerProduct; notes: ReviewActivity[] }) {
  const open = p.openSubmission;
  const fixable = open?.status === "CHANGES_REQUESTED" || p.state === "SUSPENDED";
  return (
    <>
      {notes.length ? (
        <ul className="sp-notes">
          {notes.map((n) => (
            <li key={n.id}>
              <span className="sp-av sp-av-sm">CT</span>
              <div>
                <b>Catalog team</b> <small>{rel(n.at)} · {describeActivity(n).title} · {n.reference}</small>
                <p>{n.note}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="sp-empty">
          <Ico name="check" />
          <p>No review notes for this product.</p>
        </div>
      )}
      {fixable ? (
        <div>
          <Link className="sp-btn sp-btn-pri" href={`/merchant/add/product?edit=${p.id}`}>
            Fix and resubmit
          </Link>
        </div>
      ) : null}
    </>
  );
}

function StockTab({ p, onChanged }: { p: SellerProduct; onChanged: () => void }) {
  const [log, setLog] = useState<StockMove[] | null>(null);
  const [sku, setSku] = useState(p.variants[0]?.sku ?? "");
  const v = p.variants.find((x) => x.sku === sku) ?? p.variants[0];
  const [value, setValue] = useState(String(v?.stockQuantity ?? ""));
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () =>
    sellerService
      .stockHistory(p.id)
      .then((r) => setLog(r.data.data ?? []))
      .catch(() => setLog([]));
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload per product only
  }, [p.id]);
  useEffect(() => setValue(String(v?.stockQuantity ?? "")), [v]);

  if (!v) return <p className="sp-muted">This product has no SKUs.</p>;
  const canStock = p.state !== "ARCHIVED";

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!/^\d+$/.test(value.trim())) return setErr("Enter a whole number, 0 or more");
    if (Number(value) === v.stockQuantity) return setErr(`Stock is already ${value}`);
    setErr("");
    setBusy(true);
    try {
      const r = (await sellerService.updateStock([{ sku: v.sku, quantity: Number(value) }])).data.data!;
      if (r.errors.length) throw new Error(r.errors[0].reason);
      toast.success("Stock updated. Live on the store now.");
      onChanged();
      void load();
    } catch (e2) {
      setErr(errorText(e2, "We couldn't save the stock."));
    } finally {
      setBusy(false);
    }
  }

  const SOURCE: Record<string, string> = { SELLER: "You", ORDER: "Order", CANCELLATION: "Cancelled order", RETURN: "Return", IMPORT: "Catalog import", ADJUSTMENT: "Catalog team", BULK_UPDATE: "Bulk update" };
  return (
    <>
      <p className="sp-help">Stock changes apply immediately and are logged here.</p>
      {canStock ? (
        <form className="sp-box" onSubmit={save} noValidate>
          <div className="sp-g2">
            {p.variants.length > 1 ? (
              <label className="sp-field" htmlFor="sp-sh-sku">
                <span className="sp-lab">SKU</span>
                <select id="sp-sh-sku" className="sp-inp" value={v.sku} onChange={(e) => setSku(e.target.value)}>
                  {p.variants.map((x) => (
                    <option key={x.sku} value={x.sku}>
                      {x.variantName ? `${x.variantName} · ` : ""}
                      {x.sku} ({x.stockQuantity})
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="sp-field" htmlFor="sp-sh">
              <span className="sp-lab">Update stock</span>
              <span className="sp-unit">
                <input id="sp-sh" className="sp-inp" inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ""))} />
                <span>units</span>
              </span>
            </label>
          </div>
          <FieldError id="sp-sh-e">{err}</FieldError>
          <div>
            <button className="sp-btn sp-btn-pri sp-btn-sm" disabled={busy}>
              {busy ? "Saving…" : "Save stock"}
            </button>
          </div>
        </form>
      ) : null}
      {log === null ? (
        <Loading />
      ) : log.length ? (
        <div className="sp-tw">
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Change</th>
                <th>From</th>
              </tr>
            </thead>
            <tbody>
              {log.map((m, i) => (
                <tr key={`${m.at}-${i}`}>
                  <td>
                    {rel(m.at)}
                    {p.variants.length > 1 ? <small className="sp-mono sp-muted" style={{ display: "block" }}>{m.sku}</small> : null}
                  </td>
                  <td className="sp-num">
                    <b>
                      {m.from} → {m.to}
                    </b>{" "}
                    {m.to === 0 ? <Pill tone="bad">Out of stock</Pill> : null}
                  </td>
                  <td className="sp-muted">{SOURCE[m.source] ?? m.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="sp-muted">No stock changes yet.</p>
      )}
    </>
  );
}
