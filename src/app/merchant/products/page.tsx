"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ProductDrawer, priceOutcome, type DrawerTab } from "@/components/seller/ProductDrawer";
import {
  Ico,
  LoadError,
  Loading,
  Pill,
  StatePill,
  Thumb,
  daysSince,
  errorText,
  fmtDate,
  isLow,
  isOut,
  money,
  onStore,
  pct,
  rel,
  sellable,
  useLoad,
} from "@/components/seller/ui";
import { useTitle } from "@/components/seller/useSellerSession";
import sellerService from "@/services/seller/seller.service";
import type { PriceChange, SellerProduct } from "@/types/api/seller.types";

type Tab = "all" | "live" | "inreview" | "changes" | "draft" | "suspended" | "archived";
type Sort = "upd" | "stock" | "title";
const STALE_DAYS = 25;
const BIG_CHANGE = 0.3;

const group = (p: SellerProduct): Tab =>
  p.state === "SUBMITTED" || p.state === "IN_REVIEW"
    ? "inreview"
    : p.state === "LIVE" || p.state === "CHANGE_PENDING"
      ? "live"
      : p.state === "CHANGES_REQUESTED"
        ? "changes"
        : (p.state.toLowerCase() as Tab);
const totalStock = (p: SellerProduct) => p.variants.reduce((s, v) => s + v.stockQuantity, 0);
const isStale = (p: SellerProduct) => onStore(p) && sellable(p).some((v) => daysSince(v.stockUpdatedAt) >= STALE_DAYS);
const OPEN = ["SUBMITTED", "IN_REVIEW", "CHANGES_REQUESTED"];

/** The price column's second line: a request waiting, or one turned down lately. */
function PriceCell({ changes, onOpen }: { changes: PriceChange[]; onOpen: () => void }) {
  const pending = changes.find((c) => OPEN.includes(c.status));
  if (pending) {
    return (
      <button type="button" className="sp-pc" onClick={onOpen}>
        <span className="sp-pc-l">
          {money(pending.from)} → <b>{money(pending.to)}</b> <span className={pending.to < pending.from ? "sp-dn" : "sp-up"}>{pct(pending.from, pending.to)}</span>
        </span>
        <Pill tone="info">Pending review</Pill>
      </button>
    );
  }
  const last = changes.find((c) => c.status === "REJECTED" || c.status === "APPROVED");
  if (last?.status === "REJECTED") {
    return (
      <button type="button" className="sp-pc" onClick={onOpen}>
        <span className="sp-pc-l">
          {money(last.to)} <span className="sp-muted">not approved</span>
        </span>
        <Pill tone="bad">Rejected · {fmtDate(last.decidedAt ?? last.submittedAt)}</Pill>
      </button>
    );
  }
  if (last) {
    return (
      <button type="button" className="sp-pc" onClick={onOpen}>
        <span className="sp-pc-l">
          <span className={last.to < last.from ? "sp-dn" : "sp-up"}>
            {last.to < last.from ? "↓" : "↑"} {pct(last.from, last.to)}
          </span>{" "}
          <span className="sp-muted">was {money(last.from)}</span>
        </span>
        <span className="sp-pc-d">{fmtDate(last.decidedAt ?? last.submittedAt)}</span>
      </button>
    );
  }
  return <span className="sp-muted">No changes</span>;
}

/** Inline price edit for a single-SKU product: a request for review, never a direct change. */
function InlinePrice({ p, onDone }: { p: SellerProduct; onDone: () => void }) {
  const v = p.variants[0];
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(v.price.toFixed(2));
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const blocked = p.openSubmission?.status === "IN_REVIEW" || p.openSubmission?.kind === "DELIST" || p.state === "ARCHIVED";
  const n = Number(value.replace(/[$,\s]/g, ""));
  const change = n > 0 ? (n - v.price) / v.price : 0;

  const save = async () => {
    if (!(n > 0)) return toast.error("Enter a price, like 28.50");
    if (n === v.price) return setEditing(false);
    if (v.mrp && n > v.mrp) return toast.error(`Your price can't be higher than the MRP (${money(v.mrp)}). Change both in the product's Price tab.`);
    if (Math.abs(change) >= BIG_CHANGE && !confirm) return setConfirm(true);
    setBusy(true);
    try {
      const out = priceOutcome((await sellerService.requestPrice(p.id, { items: [{ sku: v.sku, price: n }] })).data.data!);
      if (out.ok) {
        toast.success(out.text);
        setEditing(false);
        onDone();
      } else toast.error(out.text);
    } catch (e) {
      toast.error(errorText(e, "We couldn't send the price change."));
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  };

  if (!editing) {
    return (
      <span>
        <b>{money(v.price)}</b>
        <small className="sp-muted" style={{ display: "block" }}>
          {v.mrp ? `MRP ${money(v.mrp)}` : "No MRP"}
          {blocked ? null : (
            <>
              {" · "}
              <button type="button" className="sp-lnk" onClick={() => setEditing(true)} aria-label={`Change price of ${p.name}`}>
                Change
              </button>
            </>
          )}
        </small>
      </span>
    );
  }
  return (
    <span style={{ display: "grid", gap: 4 }}>
      <span className="sp-priceedit">
        <span className="sp-unit sp-pre">
          <span>$</span>
          <input
            className="sp-inp"
            inputMode="decimal"
            value={value}
            autoFocus
            aria-label={`New price for ${p.name}`}
            onChange={(e) => {
              setValue(e.target.value);
              setConfirm(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") void save();
              if (e.key === "Escape") setEditing(false);
            }}
          />
        </span>
        <button type="button" className="sp-btn sp-btn-sec sp-btn-sm" disabled={busy} onClick={save}>
          {confirm ? "Confirm" : "Send"}
        </button>
        <button type="button" className="sp-btn sp-btn-ghost sp-btn-sm" onClick={() => setEditing(false)} aria-label="Cancel">
          <Ico name="x" />
        </button>
      </span>
      {n > 0 && n !== v.price ? (
        <small className={Math.abs(change) >= BIG_CHANGE ? "sp-low-t" : "sp-muted"}>
          {pct(v.price, n)}
          {Math.abs(change) >= BIG_CHANGE ? " · big change, gets an extra check" : ""} · reviewed first
        </small>
      ) : null}
    </span>
  );
}

/** Inline stock edit: applies at once. Products with several SKUs edit stock in the drawer. */
function InlineStock({ p, onDone, onOpen }: { p: SellerProduct; onDone: () => void; onOpen: () => void }) {
  const v = p.variants[0];
  const [value, setValue] = useState(String(v?.stockQuantity ?? ""));
  const [busy, setBusy] = useState(false);
  useEffect(() => setValue(String(v?.stockQuantity ?? "")), [v?.stockQuantity]);
  if (!v) return <span className="sp-muted">—</span>;
  if (p.state === "ARCHIVED") return <span className="sp-muted">{totalStock(p)}</span>;
  if (p.variants.length > 1) {
    const outs = p.variants.filter(isOut).length;
    return (
      <button type="button" className="sp-pc" onClick={onOpen}>
        <span className="sp-pc-l">
          <b>{totalStock(p)}</b> in {p.variants.length} SKUs
        </span>
        {outs ? <small className="sp-zero-t">{outs} out of stock</small> : p.variants.some(isLow) ? <small className="sp-low-t">Some low</small> : null}
      </button>
    );
  }
  const dirty = value !== "" && value !== String(v.stockQuantity);
  const save = async () => {
    if (!dirty) return;
    setBusy(true);
    try {
      const r = (await sellerService.updateStock([{ sku: v.sku, quantity: Number(value) }])).data.data!;
      if (r.errors.length) throw new Error(r.errors[0].reason);
      toast.success(Number(value) === 0 ? `Stock set to 0. ${p.name} now shows as out of stock.` : `Stock updated to ${value}. Live on the store now.`);
      onDone();
    } catch (e) {
      toast.error(errorText(e, "We couldn't save the stock."));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <span className="sp-stk">
        <input
          className={`sp-inp sp-stkin ${v.stockQuantity === 0 ? "sp-zero" : isLow(v) ? "sp-low" : ""}`}
          inputMode="numeric"
          aria-label={`Stock for ${p.name}`}
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ""))}
          onKeyDown={(e) => {
            if (e.key === "Enter") void save();
            if (e.key === "Escape") setValue(String(v.stockQuantity));
          }}
        />
        {dirty ? (
          <button type="button" className="sp-btn sp-btn-sec sp-btn-sm" disabled={busy} onClick={save}>
            Save
          </button>
        ) : null}
      </span>
      {v.stockQuantity === 0 ? <small className="sp-zero-t">Out of stock</small> : isLow(v) ? <small className="sp-low-t">Low</small> : null}
    </>
  );
}

export default function MyProductsPage() {
  useTitle("My products");
  const catalog = useLoad(() => sellerService.catalog());
  const prices = useLoad(() => sellerService.priceChanges());
  const activity = useLoad(() => sellerService.activity(100));
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [sort, setSort] = useState<Sort>("upd");
  const [openId, setOpenId] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("details");

  // Deep links from the dashboard: ?tab=…&sort=…&open=<id>&tab=notes|price
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const t = sp.get("tab");
    const open = sp.get("open");
    if (open) {
      setOpenId(open);
      if (t === "notes" || t === "price" || t === "stock") setDrawerTab(t);
    } else if (t && ["all", "live", "inreview", "changes", "draft", "suspended", "archived"].includes(t)) setTab(t as Tab);
    if (sp.get("sort") === "stock") setSort("stock");
  }, []);

  const products = useMemo(() => catalog.data ?? [], [catalog.data]);
  const reload = () => {
    void catalog.reload();
    void prices.reload();
  };
  const open = products.find((p) => p.id === openId) ?? null;
  const openProduct = (id: string, t: DrawerTab = "details") => {
    const p = products.find((x) => x.id === id);
    setDrawerTab(t === "details" && p && (p.state === "CHANGES_REQUESTED" || p.state === "SUSPENDED") ? "notes" : t);
    setOpenId(id);
  };

  const counts = (t: Tab) => (t === "all" ? products.length : products.filter((p) => group(p) === t).length);
  const TABS: [Tab, string][] = [
    ["all", "All"],
    ["live", "Live"],
    ["inreview", "In review"],
    ["changes", "Changes requested"],
    ["draft", "Drafts"],
    ["suspended", "Suspended"],
    ["archived", "Archived"],
  ];
  const categories = Array.from(new Set(products.map((p) => p.category).filter((c): c is string => !!c))).sort();
  const needle = q.trim().toLowerCase();
  const list = products
    .filter((p) => tab === "all" || group(p) === tab)
    .filter((p) => !cat || p.category === cat)
    .filter((p) => !needle || p.name.toLowerCase().includes(needle) || p.code.toLowerCase().includes(needle) || p.variants.some((v) => v.sku.toLowerCase().includes(needle)))
    .sort((a, b) =>
      sort === "stock" ? totalStock(a) - totalStock(b) : sort === "title" ? a.name.localeCompare(b.name) : b.updatedAt.localeCompare(a.updatedAt)
    );

  const att = {
    changes: products.filter((p) => p.state === "CHANGES_REQUESTED").length,
    susp: products.filter((p) => p.state === "SUSPENDED").length,
    out: products.filter((p) => onStore(p) && sellable(p).some(isOut)).length,
    stale: products.filter(isStale).length,
  };
  const pricesFor = (id: string) => (prices.data ?? []).filter((c) => c.parentProductId === id);
  const clear = () => {
    setTab("all");
    setQ("");
    setCat("");
    setSort("upd");
  };

  return (
    <>
      <div className="sp-ph">
        <div>
          <h1>My products</h1>
          <p>Every product you&apos;ve added and where it is. Stock updates go live straight away; everything else is reviewed first.</p>
        </div>
        <Link className="sp-btn sp-btn-pri" href="/merchant/add">
          <Ico name="plus" />
          Add products
        </Link>
      </div>

      {catalog.error ? <LoadError error={catalog.error} onRetry={catalog.reload} what="your products" /> : null}
      {catalog.loading && !catalog.data ? <Loading label="Loading your products…" /> : null}

      {catalog.data ? (
        <>
          {att.changes || att.susp || att.out || att.stale ? (
            <section className="sp-attn" aria-label="Needs your attention">
              <span className="sp-attn-h">
                <Ico name="warn" />
                Needs your attention
              </span>
              <div className="sp-attn-list">
                {att.changes ? (
                  <button type="button" className="sp-att" onClick={() => setTab("changes")}>
                    <b>{att.changes}</b> {att.changes > 1 ? "products need" : "product needs"} changes from our review
                  </button>
                ) : null}
                {att.susp ? (
                  <button type="button" className="sp-att" onClick={() => setTab("suspended")}>
                    <b>{att.susp}</b> suspended
                  </button>
                ) : null}
                {att.out ? (
                  <button
                    type="button"
                    className="sp-att"
                    onClick={() => {
                      setTab("live");
                      setSort("stock");
                      setQ("");
                    }}
                  >
                    <b>{att.out}</b> live {att.out > 1 ? "products are" : "product is"} out of stock
                  </button>
                ) : null}
                {att.stale ? (
                  <button
                    type="button"
                    className="sp-att"
                    onClick={() => {
                      const p = products.find(isStale);
                      if (p) openProduct(p.id, "stock");
                    }}
                  >
                    <b>{att.stale}</b> stock not updated for {STALE_DAYS}+ days
                  </button>
                ) : null}
              </div>
            </section>
          ) : null}

          <div className="sp-panel">
            <div className="sp-ptools">
              <div className="sp-tabs" role="tablist" aria-label="Filter by state">
                {TABS.map(([k, label]) => (
                  <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
                    {label}
                    <span className="sp-n">{counts(k)}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="sp-ptools" style={{ justifyContent: "flex-start" }}>
              <label className="sp-srch">
                <span className="sp-sr">Search products</span>
                <Ico name="search" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, code or SKU" />
              </label>
              <label className="sp-sr" htmlFor="sp-mcat">
                Category
              </label>
              <select id="sp-mcat" className="sp-inp sp-sm-inp" value={cat} onChange={(e) => setCat(e.target.value)}>
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <label className="sp-sr" htmlFor="sp-msort">
                Sort
              </label>
              <select id="sp-msort" className="sp-inp sp-sm-inp" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                <option value="upd">Recently updated</option>
                <option value="stock">Lowest stock</option>
                <option value="title">Title A–Z</option>
              </select>
            </div>
            <div className="sp-tw">
              <table className="sp-resp sp-mp">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Status</th>
                    <th>Live price</th>
                    <th>Price change</th>
                    <th>Stock</th>
                    <th>
                      <span className="sp-sr">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {list.length ? (
                    list.map((p) => {
                      const amounts = p.variants.map((v) => v.price);
                      return (
                        <tr key={p.id}>
                          <td className="sp-c-wide">
                            <button type="button" className="sp-prow" onClick={() => openProduct(p.id)}>
                              <Thumb src={p.imageUrl} />
                              <span style={{ minWidth: 0 }}>
                                <b>{p.name}</b>
                                <small>
                                  <span className="sp-mono">{p.variants.length === 1 ? p.variants[0].sku : p.code}</span>
                                  {p.category ? ` · ${[p.category, p.subcategory].filter(Boolean).join(" › ")}` : ""}
                                </small>
                              </span>
                            </button>
                          </td>
                          <td>
                            <StatePill state={p.state} />
                            <small className="sp-muted" style={{ display: "block", marginTop: 4, fontSize: 12 }}>
                              Updated {rel(p.updatedAt)}
                            </small>
                            {isStale(p) ? (
                              <span style={{ display: "block", marginTop: 4 }}>
                                <Pill tone="warn">Check stock</Pill>
                              </span>
                            ) : null}
                          </td>
                          <td className="sp-num">
                            {p.variants.length === 1 ? (
                              <InlinePrice key={`${p.variants[0].price}`} p={p} onDone={reload} />
                            ) : amounts.length ? (
                              <>
                                <b>
                                  {money(Math.min(...amounts))}
                                  {Math.max(...amounts) !== Math.min(...amounts) ? ` – ${money(Math.max(...amounts))}` : ""}
                                </b>
                                <small className="sp-muted" style={{ display: "block" }}>
                                  <button type="button" className="sp-lnk" onClick={() => openProduct(p.id, "price")}>
                                    Change prices
                                  </button>
                                </small>
                              </>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td>
                            <PriceCell changes={pricesFor(p.id)} onOpen={() => openProduct(p.id, "price")} />
                          </td>
                          <td>
                            <InlineStock p={p} onDone={reload} onOpen={() => openProduct(p.id, "stock")} />
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button type="button" className="sp-btn sp-btn-ghost sp-btn-sm" onClick={() => openProduct(p.id)}>
                              {p.state === "CHANGES_REQUESTED" || p.state === "SUSPENDED" ? "Fix" : p.state === "DRAFT" ? "Continue" : "View"}
                              <Ico name="right" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", color: "var(--muted)", padding: 32 }}>
                        {products.length ? (
                          <>
                            No products match.{" "}
                            <button type="button" className="sp-btn sp-btn-ghost sp-btn-sm" onClick={clear}>
                              Clear filters
                            </button>
                          </>
                        ) : (
                          <>
                            You haven&apos;t added any products yet. <Link href="/merchant/add">Add your first product</Link>
                          </>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <p className="sp-help" style={{ marginTop: 12 }}>
            {list.length} of {products.length} products
          </p>
        </>
      ) : null}

      <ProductDrawer
        product={open}
        tab={drawerTab}
        setTab={setDrawerTab}
        prices={prices.data ?? []}
        activity={activity.data ?? []}
        onClose={() => setOpenId(null)}
        onChanged={reload}
      />
    </>
  );
}
