"use client";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { documentTasks, DocumentsPanel } from "@/components/seller/DocumentsPanel";
import { describeActivity } from "@/components/seller/SellerShell";
import { StockDialog } from "@/components/seller/StockDialog";
import {
  Ico,
  LoadError,
  Loading,
  Pill,
  STATE,
  STATE_ORDER,
  Thumb,
  daysSince,
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
import { useAuthStore } from "@/store/useAuthStore";
import { OPEN_SUBMISSION_STATUSES, type ListingState, type SellerProduct } from "@/types/api/seller.types";

const DAY = 86_400_000;
const STALE_DAYS = 25;

/** My products tab for each state (the list groups "live" and "in review"). */
const TAB: Record<ListingState, string> = {
  LIVE: "live",
  CHANGE_PENDING: "live",
  SUBMITTED: "inreview",
  IN_REVIEW: "inreview",
  CHANGES_REQUESTED: "changes",
  SUSPENDED: "suspended",
  DRAFT: "draft",
  ARCHIVED: "archived",
};

type Task = { id: string; level: "bad" | "warn" | "info"; product?: SellerProduct; title: ReactNode; detail: ReactNode; action: ReactNode };

export default function SellerDashboardPage() {
  useTitle("Dashboard");
  const user = useAuthStore((s) => s.user);
  const catalog = useLoad(() => sellerService.catalog());
  const activity = useLoad(() => sellerService.activity(6));
  const prices = useLoad(() => sellerService.priceChanges());
  const earnings = useLoad(() => sellerService.earnings(1));
  const documents = useLoad(() => sellerService.documents());
  const [stockFor, setStockFor] = useState<{ product: SellerProduct; sku?: string } | null>(null);

  const products = useMemo(() => catalog.data ?? [], [catalog.data]);
  const live = products.filter(onStore);
  const liveVariants = live.flatMap((p) => sellable(p).map((v) => ({ p, v })));
  const out = liveVariants.filter(({ v }) => isOut(v));
  const low = liveVariants.filter(({ v }) => isLow(v));
  const stale = liveVariants.filter(({ v }) => daysSince(v.stockUpdatedAt) >= STALE_DAYS);
  const count = (s: ListingState) => products.filter((p) => p.state === s).length;

  const tasks = useMemo(() => {
    const t: Task[] = [];
    for (const p of products.filter((x) => x.state === "SUSPENDED")) {
      t.push({
        id: `sus-${p.id}`,
        level: "bad",
        product: p,
        title: (
          <>
            <b>{p.name}</b> is suspended
          </>
        ),
        detail: "Hidden from the store. Check the review notes, fix it and resubmit.",
        action: (
          <Link className="sp-btn sp-btn-pri sp-btn-sm" href={`/merchant/products?open=${p.id}`}>
            Fix and resubmit
          </Link>
        ),
      });
    }
    for (const p of products.filter((x) => x.openSubmission?.status === "CHANGES_REQUESTED")) {
      t.push({
        id: `chg-${p.id}`,
        level: "warn",
        product: p,
        title: (
          <>
            Changes requested on <b>{p.name}</b>
          </>
        ),
        detail: p.openSubmission?.reviewNote ?? "Notes from the catalog team",
        action: (
          <Link className="sp-btn sp-btn-sec sp-btn-sm" href={`/merchant/products?open=${p.id}&tab=notes`}>
            See notes
          </Link>
        ),
      });
    }
    for (const p of live) {
      const outs = sellable(p).filter(isOut);
      if (!outs.length) continue;
      t.push({
        id: `out-${p.id}`,
        level: "bad",
        product: p,
        title: (
          <>
            <b>{p.name}</b> is out of stock{outs.length < sellable(p).length ? ` (${outs.length} of ${sellable(p).length} variants)` : ""}
          </>
        ),
        detail: "Shoppers can see it but can't buy it.",
        action: (
          <button type="button" className="sp-btn sp-btn-sec sp-btn-sm" onClick={() => setStockFor({ product: p, sku: outs[0].sku })}>
            Update stock
          </button>
        ),
      });
    }
    for (const p of live) {
      const lows = sellable(p).filter(isLow);
      if (!lows.length) continue;
      t.push({
        id: `low-${p.id}`,
        level: "info",
        product: p,
        title: (
          <>
            Only <b>{Math.min(...lows.map((v) => v.stockQuantity))}</b> left of <b>{p.name}</b>
          </>
        ),
        detail: "Restock soon to stay buyable.",
        action: (
          <button type="button" className="sp-btn sp-btn-sec sp-btn-sm" onClick={() => setStockFor({ product: p, sku: lows[0].sku })}>
            Update stock
          </button>
        ),
      });
    }
    for (const c of (prices.data ?? []).filter((x) => x.status === "REJECTED" && x.decidedAt && Date.now() - new Date(x.decidedAt).getTime() < 14 * DAY)) {
      const p = products.find((x) => x.id === c.parentProductId);
      t.push({
        id: `rej-${c.reference}-${c.sku}`,
        level: "warn",
        product: p,
        title: (
          <>
            Price change not approved: <b>{c.productName}</b>
          </>
        ),
        detail: `${money(c.from)} → ${money(c.to)}${c.reviewNote ? ` · ${c.reviewNote}` : ""}`,
        action: (
          <Link className="sp-btn sp-btn-sec sp-btn-sm" href={`/merchant/products?open=${c.parentProductId}&tab=price`}>
            Review price
          </Link>
        ),
      });
    }
    for (const d of documentTasks(documents.data ?? [])) {
      t.push({
        id: `doc-${d.doc.id}`,
        level: d.level,
        title: d.title,
        detail: d.detail,
        action: (
          <Link className="sp-btn sp-btn-sec sp-btn-sm" href="/merchant/documents">
            Upload new
          </Link>
        ),
      });
    }
    const order = { bad: 0, warn: 1, info: 2 };
    return t.sort((a, b) => order[a.level] - order[b.level]);
  }, [products, live, prices.data, documents.data]);

  const hour = new Date().getHours();
  const hi = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const first = (user?.fullName ?? "").split(" ")[0];
  const pending = (prices.data ?? []).filter((c) => OPEN_SUBMISSION_STATUSES.includes(c.status));
  const recent = (prices.data ?? []).filter((c) => c.status === "APPROVED" || c.status === "REJECTED").slice(0, 3);
  const inReview = count("SUBMITTED") + count("IN_REVIEW") + count("CHANGE_PENDING");
  const e = earnings.data;

  return (
    <>
      <div className="sp-ph">
        <div>
          <h1>
            {hi}
            {first ? `, ${first}` : ""}
          </h1>
          <p>
            Here&apos;s where your store stands today.{" "}
            {catalog.data ? (tasks.length ? `${tasks.length} thing${tasks.length === 1 ? " needs" : "s need"} you.` : "Nothing needs you right now.") : null}
          </p>
        </div>
        <div className="sp-ph-a">
          <Link className="sp-btn sp-btn-sec" href="/merchant/add/bulk">
            <Ico name="upload" />
            Bulk upload
          </Link>
          <Link className="sp-btn sp-btn-pri" href="/merchant/add/product">
            <Ico name="plus" />
            Add product
          </Link>
        </div>
      </div>

      {catalog.error ? <LoadError error={catalog.error} onRetry={catalog.reload} what="your products" /> : null}
      {catalog.loading && !catalog.data ? <Loading label="Loading your store…" /> : null}

      {catalog.data ? (
        <>
          <div className="sp-dstats">
            <Link className="sp-dstat" href="/merchant/products?tab=live">
              <span className="sp-k">
                <i style={{ background: "var(--leaf)" }} />
                Live on the store
              </span>
              <b>{live.length}</b>
              <small>{count("CHANGE_PENDING") ? `${count("CHANGE_PENDING")} with a change in review` : "All up to date"}</small>
            </Link>
            <Link className="sp-dstat" href="/merchant/products?tab=inreview">
              <span className="sp-k">
                <i style={{ background: "var(--blue)" }} />
                Waiting for review
              </span>
              <b>{inReview}</b>
              <small>We reply within 2 business days</small>
            </Link>
            <a className={`sp-dstat ${tasks.length ? "sp-warn" : ""}`} href="#todo">
              <span className="sp-k">
                <i style={{ background: "var(--amber)" }} />
                Needs your action
              </span>
              <b>{tasks.length}</b>
              <small>{tasks.length ? "See the list below" : "All clear"}</small>
            </a>
            <Link className={`sp-dstat ${out.length ? "sp-bad" : ""}`} href="/merchant/products?tab=live&sort=stock">
              <span className="sp-k">
                <i style={{ background: "var(--red)" }} />
                Out of stock
              </span>
              <b>{out.length}</b>
              <small>{out.length ? "Live but can't be bought" : "Everything is buyable"}</small>
            </Link>
          </div>

          <section className="sp-card sp-todo" id="todo" aria-labelledby="todoH">
            <div className="sp-ch">
              <h2 id="todoH">Needs your action</h2>
            </div>
            {tasks.length ? (
              <ul className="sp-tlist">
                {tasks.map((t) => (
                  <li key={t.id} className={`sp-t sp-${t.level}`}>
                    {t.product ? (
                      <Thumb src={t.product.imageUrl} size={40} />
                    ) : (
                      <span className="sp-pthumb sp-doc" style={{ width: 40, height: 40 }} aria-hidden="true">
                        <Ico name="doc" />
                      </span>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <p>{t.title}</p>
                      <small>{t.detail}</small>
                    </div>
                    <div className="sp-ta">{t.action}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="sp-clear">
                <Ico name="check" />
                <div>
                  <b>You&apos;re all caught up</b>
                  <small>We&apos;ll show anything that needs you here, and email you too.</small>
                </div>
              </div>
            )}
          </section>

          <div className="sp-dgrid">
            <section className="sp-card" aria-labelledby="catH">
              <div className="sp-ch">
                <h2 id="catH">Your catalog</h2>
                <Link className="sp-lnk" href="/merchant/products">
                  All {products.length} products <Ico name="right" />
                </Link>
              </div>
              {products.length ? (
                <>
                  <div
                    className="sp-stack"
                    role="img"
                    aria-label={STATE_ORDER.filter((s) => count(s)).map((s) => `${count(s)} ${STATE[s].label}`).join(", ")}
                  >
                    {STATE_ORDER.filter((s) => count(s)).map((s) => (
                      <span key={s} style={{ flex: count(s), background: STATE[s].color }} title={`${STATE[s].label}: ${count(s)}`} />
                    ))}
                  </div>
                  <ul className="sp-legend">
                    {STATE_ORDER.map((s) => (
                      <li key={s}>
                        <Link href={`/merchant/products?tab=${TAB[s]}`}>
                          <i style={{ background: STATE[s].color }} />
                          <span>{STATE[s].label}</span>
                          <b>{count(s)}</b>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="sp-empty">
                  <Ico name="box" />
                  <p>No products yet.</p>
                  <Link className="sp-btn sp-btn-pri sp-btn-sm" href="/merchant/add">
                    Add your first product
                  </Link>
                </div>
              )}
            </section>

            <section className="sp-card" aria-labelledby="stH">
              <div className="sp-ch">
                <h2 id="stH">Stock health</h2>
                <Link className="sp-lnk" href="/merchant/add/bulk">
                  Update in bulk <Ico name="right" />
                </Link>
              </div>
              <p className="sp-cd">Stock changes go live right away. No review needed. Counted per live SKU.</p>
              <ul className="sp-health">
                <li>
                  <span className="sp-hb sp-ok">{liveVariants.length - out.length - low.length}</span>
                  <span>
                    <b>In stock</b>
                    <small>Above each SKU&apos;s low-stock line</small>
                  </span>
                </li>
                <li>
                  <span className="sp-hb sp-info">{low.length}</span>
                  <span>
                    <b>Running low</b>
                    <small>At or below the low-stock line</small>
                  </span>
                </li>
                <li>
                  <span className="sp-hb sp-bad">{out.length}</span>
                  <span>
                    <b>Out of stock</b>
                    <small>Shoppers can&apos;t buy these</small>
                  </span>
                </li>
                <li>
                  <span className="sp-hb sp-warn">{stale.length}</span>
                  <span>
                    <b>Not updated in {STALE_DAYS}+ days</b>
                    <small>Check the numbers are still right</small>
                  </span>
                </li>
              </ul>
            </section>

            <section className="sp-card" aria-labelledby="fdH">
              <div className="sp-ch">
                <h2 id="fdH">Latest from our review team</h2>
                <Link className="sp-lnk" href="/merchant/submissions">
                  Submissions <Ico name="right" />
                </Link>
              </div>
              {activity.data?.length ? (
                <ol className="sp-rfeed">
                  {activity.data.map((a) => {
                    const d = describeActivity(a);
                    return (
                      <li key={a.id}>
                        <span className={`sp-fd sp-${d.tone}`}>
                          <Ico name={d.icon} />
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <p>
                            {d.title}: <Link href={`/merchant/submissions/${a.reference}`}>{a.productName}</Link>
                          </p>
                          <small>
                            {a.note ? `${a.note.length > 90 ? `${a.note.slice(0, 90)}…` : a.note} · ` : "Catalog team · "}
                            {rel(a.at)}
                          </small>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              ) : activity.loading ? (
                <Loading />
              ) : (
                <p className="sp-muted" style={{ fontSize: 13, marginTop: 10 }}>
                  Nothing yet. When our team reviews your submissions, you&apos;ll see it here.
                </p>
              )}
            </section>

            <section className="sp-card" aria-labelledby="prH">
              <div className="sp-ch">
                <h2 id="prH">Price changes</h2>
                <Link className="sp-lnk" href="/merchant/products">
                  My products <Ico name="right" />
                </Link>
              </div>
              <p className="sp-cd">Every price change is checked by our team before shoppers see it.</p>
              <h3 className="sp-subh">In review ({pending.length})</h3>
              {pending.length ? (
                <ul className="sp-plist">
                  {pending.map((c) => (
                    <li key={`${c.reference}-${c.sku}`}>
                      <Link href={`/merchant/products?open=${c.parentProductId}&tab=price`}>
                        <span className="sp-pn">{c.productName}</span>
                        <span className="sp-pv">
                          {money(c.from)} → <b>{money(c.to)}</b> <span className={c.to < c.from ? "sp-dn" : "sp-up"}>{pct(c.from, c.to)}</span>
                        </span>
                        <Pill tone="info">Sent {rel(c.submittedAt)}</Pill>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="sp-muted" style={{ fontSize: 13 }}>
                  No price changes waiting.
                </p>
              )}
              <h3 className="sp-subh">Last 30 days</h3>
              {recent.length ? (
                <ul className="sp-plist">
                  {recent.map((c) => (
                    <li key={`${c.reference}-${c.sku}`}>
                      <Link href={`/merchant/products?open=${c.parentProductId}&tab=price`}>
                        <span className="sp-pn">{c.productName}</span>
                        <span className="sp-pv">
                          {money(c.from)} → <b>{money(c.to)}</b> <span className={c.to < c.from ? "sp-dn" : "sp-up"}>{pct(c.from, c.to)}</span>
                        </span>
                        <Pill tone={c.status === "APPROVED" ? "ok" : "bad"}>
                          {c.status === "APPROVED" ? "Approved" : "Not approved"} · {fmtDate(c.decidedAt ?? c.submittedAt)}
                        </Pill>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="sp-muted" style={{ fontSize: 13 }}>
                  None.
                </p>
              )}
            </section>

            <section className="sp-card" aria-labelledby="dcH">
              <div className="sp-ch">
                <h2 id="dcH">Documents</h2>
              </div>
              <DocumentsPanel compact />
            </section>

            <section className="sp-card" aria-labelledby="orH">
              <div className="sp-ch">
                <h2 id="orH">Orders and payouts</h2>
                <Pill tone="off">Payout schedule coming soon</Pill>
              </div>
              {e ? (
                <>
                  <p className="sp-cd">
                    Sales of your products this month. Payout dates and statements aren&apos;t available yet.
                  </p>
                  <div className="sp-earn">
                    <div>
                      <span>Gross sales</span>
                      <b>{money(e.totals.gross)}</b>
                    </div>
                    <div>
                      <span>Refunds</span>
                      <b>{money(e.totals.refunds)}</b>
                    </div>
                    <div>
                      <span>Net</span>
                      <b>{money(e.totals.net)}</b>
                    </div>
                  </div>
                  <p style={{ marginTop: 12, display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", fontSize: 14 }}>
                    <span>
                      <b>{e.openOrders}</b> paid order{e.openOrders === 1 ? "" : "s"} not shipped yet
                    </span>
                    <Link className="sp-lnk" href="/merchant/orders">
                      Orders and earnings <Ico name="right" />
                    </Link>
                  </p>
                </>
              ) : earnings.error ? (
                <p className="sp-muted" style={{ fontSize: 13 }}>
                  Sales figures aren&apos;t available right now.
                </p>
              ) : (
                <Loading />
              )}
            </section>
          </div>
        </>
      ) : null}

      <StockDialog product={stockFor?.product ?? null} sku={stockFor?.sku} onClose={() => setStockFor(null)} onSaved={catalog.reload} />
    </>
  );
}
