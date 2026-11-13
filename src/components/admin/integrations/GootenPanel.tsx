"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import gootenService from "@/services/admin/gooten.service";
import publicCategoryService from "@/services/public/category.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type { CategoryTreeNode } from "@/types/api/category.types";
import type { ProductStatus } from "@/types/api/common.types";
import type {
  GootenCatalogRow,
  GootenLink,
  GootenOrderRow,
  GootenProductDetail,
  GootenShipMethod,
  GootenStatus,
} from "@/types/api/gooten.types";
import {
  Drawer,
  Icon,
  OrderPill,
  PRODUCT_STATUS_LABEL,
  StatusPill,
  Thumb,
  money,
  toast,
  useDebounced,
  usePageTitle,
  whenText,
} from "@/components/admin/ui";
import { useAdminSession } from "@/components/admin/useAdminSession";

type Tab = "catalog" | "products" | "orders";

const SHIP_LABEL: Record<GootenShipMethod, string> = { STANDARD: "Standard", EXPEDITED: "Expedited", OVERNIGHT: "Overnight" };
const SUBMISSION_STATE: Record<string, [string, string]> = {
  SUBMITTED: ["Sent", "p-info"],
  FAILED: ["Rejected", "p-bad"],
};

/** The Gooten integration's tab (Admin › Integrations › <name>). */
export default function GootenPanel({ name }: { name: string }) {
  usePageTitle(name);
  const { isAdmin } = useAdminSession();
  const [tab, setTab] = useState<Tab>("catalog");
  const [status, setStatus] = useState<GootenStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [reload, setReload] = useState(0);

  const loadStatus = useCallback(async () => {
    setChecking(true);
    setStatusError(null);
    try {
      setStatus((await gootenService.status()).data.data);
    } catch (err) {
      setStatusError(getApiErrorMessage(err, "Couldn't load the Gooten connection"));
    } finally {
      setChecking(false);
    }
  }, []);
  useEffect(() => {
    loadStatus();
  }, [loadStatus, reload]);

  const conn = status?.connection;
  return (
    <section aria-labelledby="h-vendors">
      <div className="page-head">
        <div>
          <h1 id="h-vendors">{name}</h1>
          <p>Print-on-demand products from Gooten: import them into the catalog, and send paid orders for Gooten to print and ship.</p>
        </div>
        <div className="actions">
          <button className="btn btn-secondary" onClick={loadStatus} disabled={checking}>
            <Icon name="refresh" />
            {checking ? "Checking…" : "Test connection"}
          </button>
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <span>Connection</span>
          <b>{status ? (conn?.ok ? "Connected" : "Error") : statusError ? "Error" : "…"}</b>
        </div>
        <div className="stat">
          <span>Mode</span>
          <b>{status ? (status.testMode ? "Test" : "Live") : "…"}</b>
        </div>
        <div className="stat">
          <span>Gooten products</span>
          <b>{conn?.products?.toLocaleString() ?? "—"}</b>
        </div>
        <div className="stat">
          <span>In our catalog</span>
          <b>{status?.importedProducts ?? "—"}</b>
        </div>
        <div className="stat">
          <span>Orders sent</span>
          <b>{status?.ordersSent ?? "—"}</b>
        </div>
      </div>

      <ConnectionPanel status={status} error={statusError} isAdmin={isAdmin} />

      {status && !status.integration ? null : (
      <div className="panel">
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === "catalog"} onClick={() => setTab("catalog")}>Gooten catalog</button>
          <button role="tab" aria-selected={tab === "products"} onClick={() => setTab("products")}>Our Gooten products</button>
          {isAdmin ? (
            <button role="tab" aria-selected={tab === "orders"} onClick={() => setTab("orders")}>Orders</button>
          ) : null}
        </div>
        {tab === "catalog" ? (
          <CatalogTab key={`c${reload}`} onImported={() => setReload((n) => n + 1)} />
        ) : tab === "products" ? (
          <ProductsTab key={`p${reload}`} />
        ) : (
          <OrdersTab key={`o${reload}`} testMode={status?.testMode ?? true} onSent={() => setReload((n) => n + 1)} />
        )}
      </div>
      )}
    </section>
  );
}

function ConnectionPanel({ status, error, isAdmin }: { status: GootenStatus | null; error: string | null; isAdmin: boolean }) {
  if (error) {
    return (
      <div className="note" style={{ marginBottom: 24 }}>
        <span className="err-text">{error}</span>
      </div>
    );
  }
  if (!status) return null;
  const conn = status.connection;
  const settings = isAdmin ? (
    <Link className="link" href={status.integration ? `/admin/integrations?edit=${status.integration.slug}` : "/admin/integrations?add=GOOTEN"}>
      {status.integration ? "Edit keys in API integrations" : "Connect Gooten in API integrations"}
    </Link>
  ) : (
    <span>Ask an admin to update it under Settings › API integrations.</span>
  );
  if (!status.integration) {
    return (
      <div className="note" style={{ marginBottom: 24 }}>
        Gooten isn&apos;t connected yet. Add its recipe ID and partner billing key to start importing products. {settings}
      </div>
    );
  }
  return (
    <div className="panel" style={{ marginBottom: 24 }}>
      <div className="pad">
        <dl className="kv">
          <dt>Status</dt>
          <dd>
            {conn.ok ? (
              <span className="pill p-ok">Connected · {conn.products} products available</span>
            ) : (
              <span className="pill p-bad">{conn.error ?? "Not connected"}</span>
            )}
          </dd>
          <dt>Recipe ID</dt>
          <dd>{status.recipeIdConfigured ? <span className="pill p-ok">Set</span> : <span className="err-text">Not set</span>}</dd>
          <dt>Partner billing key</dt>
          <dd>
            {status.billingKeyConfigured ? <span className="pill p-ok">Set</span> : <span className="err-text">Not set: orders can&apos;t be sent</span>}
          </dd>
          <dt>Order mode</dt>
          <dd>
            {status.testMode ? (
              <span className="pill p-warn">Test mode: Gooten checks orders but doesn&apos;t print, ship or bill them</span>
            ) : (
              <span className="pill p-ok">Live: orders are printed, shipped and billed to the partner account</span>
            )}
          </dd>
          <dt>Currency</dt>
          <dd>{status.currency}</dd>
        </dl>
        <p className="sub" style={{ marginTop: 12 }}>
          Keys and test mode are stored encrypted with the {status.integration.name} integration. {settings}
        </p>
      </div>
    </div>
  );
}

// ── Catalog ─────────────────────────────────────────────────────────────────

function CatalogTab({ onImported }: { onImported: () => void }) {
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const [category, setCategory] = useState("");
  const [rows, setRows] = useState<GootenCatalogRow[] | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let live = true;
    setRows(null);
    setError(null);
    gootenService
      .catalog({ search: q || undefined, category: category || undefined })
      .then((r) => {
        if (!live) return;
        setRows(r.data.data!.products);
        setCategories(r.data.data!.categories);
      })
      .catch((err) => {
        if (!live) return;
        setRows([]);
        setError(getApiErrorMessage(err, "Couldn't load the Gooten catalog"));
      });
    return () => {
      live = false;
    };
  }, [q, category, reload]);

  return (
    <>
      <div className="toolbar">
        <label className="search">
          <Icon name="search" />
          <span className="sr-only">Search Gooten products</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Gooten products (mugs, hoodies, posters…)" />
        </label>
        <select className="sel" aria-label="Gooten category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="twrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th className="num">Suggested retail</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows === null ? (
              <tr className="loading-row"><td colSpan={5}>Loading the Gooten catalog…</td></tr>
            ) : error ? (
              <tr className="empty-row"><td colSpan={5}><span className="err-text">{error}</span></td></tr>
            ) : rows.length === 0 ? (
              <tr className="empty-row"><td colSpan={5}>No Gooten products match.</td></tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id} className="click" tabIndex={0} onClick={() => setOpen(p.id)} onKeyDown={(e) => e.key === "Enter" && setOpen(p.id)}>
                  <td>
                    <div className="pcell">
                      <Thumb src={p.imageUrl} />
                      <div>
                        <strong>{p.name}</strong>
                        <span className="sub trunc">{p.shortDescription ?? `Gooten #${p.id}`}</span>
                      </div>
                    </div>
                  </td>
                  <td className="sub">{p.categories.join(", ") || "—"}</td>
                  <td className="num">{p.retailPrice !== null ? money(p.retailPrice, p.currency) : "—"}</td>
                  <td>{p.importedParentId ? <span className="pill p-ok">In catalog</span> : <span className="pill p-grey">Not imported</span>}</td>
                  <td>
                    <button className="btn btn-sm btn-secondary" onClick={(e) => { e.stopPropagation(); setOpen(p.id); }}>
                      {p.importedParentId ? "View" : "Import"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="tfoot">
        <span>{rows ? `${rows.length} Gooten product${rows.length === 1 ? "" : "s"}` : ""}</span>
      </div>
      <ImportDrawer
        productId={open}
        onClose={() => setOpen(null)}
        onImported={() => {
          setOpen(null);
          setReload((n) => n + 1);
          onImported();
        }}
      />
    </>
  );
}

let treeCache: CategoryTreeNode[] | null = null;
const STATUSES: ProductStatus[] = ["DRAFT", "ACTIVE", "INACTIVE"];

function ImportDrawer({ productId, onClose, onImported }: { productId: number | null; onClose: () => void; onImported: () => void }) {
  const [p, setP] = useState<GootenProductDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tree, setTree] = useState<CategoryTreeNode[]>(treeCache ?? []);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [markup, setMarkup] = useState("50");
  const [status, setStatus] = useState<ProductStatus>("DRAFT");
  const [printFileUrl, setPrintFileUrl] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (productId === null) return;
    setP(null);
    setError(null);
    setFormError(null);
    setPrintFileUrl("");
    setBrand("");
    gootenService
      .product(productId)
      .then((r) => {
        const d = r.data.data!;
        setP(d);
        setName(d.name);
        setSelected(new Set(d.variants.slice(0, 100).map((v) => v.sku)));
      })
      .catch((err) => setError(getApiErrorMessage(err, "Couldn't load this Gooten product")));
    if (!treeCache) {
      publicCategoryService
        .getTree()
        .then((r) => {
          treeCache = r.data.data ?? [];
          setTree(treeCache);
        })
        .catch(() => setFormError("Couldn't load the categories."));
    }
  }, [productId]);

  const markupNum = Number(markup);
  const priceOf = (cost: number | null) => (cost === null || !(markupNum >= 0) ? null : Math.round(cost * (1 + markupNum / 100) * 100) / 100);
  const subcategories = tree.find((c) => c.id === categoryId)?.subcategories ?? [];
  const allOn = !!p && p.variants.length > 0 && p.variants.every((v) => selected.has(v.sku));
  const toggle = (sku: string, on: boolean) =>
    setSelected((s) => {
      const n = new Set(s);
      if (on) n.add(sku);
      else n.delete(sku);
      return n;
    });

  const save = async () => {
    if (!p) return;
    if (!subcategoryId) return setFormError("Choose a category and subcategory for the product.");
    if (!(markupNum >= 0)) return setFormError("Enter a markup of 0% or more.");
    if (!selected.size) return setFormError("Select at least one variant.");
    if (selected.size > 100) return setFormError("Select at most 100 variants per product.");
    if (printFileUrl && !/^https?:\/\//i.test(printFileUrl.trim())) return setFormError("The print file URL must start with http:// or https://.");
    setFormError(null);
    setBusy(true);
    try {
      const r = await gootenService.importProduct(p.id, {
        subcategoryId,
        markupPercent: markupNum,
        status,
        skus: Array.from(selected),
        name: name.trim() || undefined,
        brand: brand.trim() || undefined,
        printFileUrl: printFileUrl.trim() || undefined,
      });
      toast(`${r.data.data!.name} imported with ${r.data.data!.variants} variants`);
      onImported();
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Couldn't import this product"));
    } finally {
      setBusy(false);
    }
  };

  const imported = !!p?.importedParentId;
  return (
    <Drawer
      open={productId !== null}
      onClose={onClose}
      title={p?.name ?? "Gooten product"}
      sub={p ? `Gooten #${p.id} · ${p.variants.length} variants${p.retailPrice !== null ? ` · suggested retail ${money(p.retailPrice, p.currency)}` : ""}` : null}
      foot={
        imported ? (
          <>
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
            <Link className="btn btn-primary" href="/admin/products">Open Products</Link>
          </>
        ) : (
          <>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={busy || !p}>
              {busy ? "Importing…" : `Import ${selected.size} variant${selected.size === 1 ? "" : "s"}`}
            </button>
          </>
        )
      }
    >
      {error ? (
        <span className="err-text">{error}</span>
      ) : !p ? (
        <p className="sub">Loading from Gooten…</p>
      ) : (
        <>
          {p.images.length ? (
            <div className="d-sec">
              <div className="imgs" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {p.images.slice(0, 4).map((u) => (
                  <Thumb key={u} src={u} />
                ))}
              </div>
            </div>
          ) : null}
          {p.description ? (
            <div className="d-sec">
              <h3>About</h3>
              <p className="sub" style={{ whiteSpace: "pre-line" }}>{p.description}</p>
            </div>
          ) : null}

          {imported ? (
            <div className="note">This product is already in the catalog. Find it on the Products page, or set its print file under Our Gooten products.</div>
          ) : (
            <div className="d-sec">
              <h3>Add to catalog</h3>
              <div className="form">
                <div className="row2">
                  <div className="fld">
                    <label htmlFor="gi-name">Product name</label>
                    <input className="inp" id="gi-name" value={name} maxLength={255} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="fld">
                    <label htmlFor="gi-brand">Brand (optional)</label>
                    <input className="inp" id="gi-brand" value={brand} maxLength={100} onChange={(e) => setBrand(e.target.value)} />
                  </div>
                </div>
                <div className="row2">
                  <div className="fld">
                    <label htmlFor="gi-cat">Category <span className="req">*</span></label>
                    <select
                      className="sel inp"
                      id="gi-cat"
                      value={categoryId}
                      onChange={(e) => {
                        setCategoryId(e.target.value);
                        setSubcategoryId("");
                      }}
                    >
                      <option value="">Choose…</option>
                      {tree.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="fld">
                    <label htmlFor="gi-sub">Subcategory <span className="req">*</span></label>
                    <select className="sel inp" id="gi-sub" value={subcategoryId} disabled={!categoryId} onChange={(e) => setSubcategoryId(e.target.value)}>
                      <option value="">{categoryId ? "Choose…" : "Pick a category first"}</option>
                      {subcategories.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="row2">
                  <div className="fld">
                    <label htmlFor="gi-markup">Markup on Gooten cost (%)</label>
                    <input className="inp" id="gi-markup" inputMode="decimal" value={markup} onChange={(e) => setMarkup(e.target.value)} />
                    <span className="hint">Our price = Gooten cost × (1 + markup). Shipping is charged separately at checkout.</span>
                  </div>
                  <div className="fld">
                    <label htmlFor="gi-status">Status</label>
                    <select className="sel inp" id="gi-status" value={status} onChange={(e) => setStatus(e.target.value as ProductStatus)}>
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{PRODUCT_STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                    <span className="hint">Draft keeps it off the storefront until you review it.</span>
                  </div>
                </div>
                <div className="fld">
                  <label htmlFor="gi-art">Print file URL (optional)</label>
                  <input className="inp" id="gi-art" type="url" placeholder="https://…/design.png" value={printFileUrl} onChange={(e) => setPrintFileUrl(e.target.value)} />
                  <span className="hint">The artwork Gooten prints on every unit. Needed before orders for this product can be sent; you can add it later.</span>
                </div>
              </div>
            </div>
          )}

          <div className="d-sec">
            <h3>Variants ({p.variants.length})</h3>
            <div className="twrap">
              <table>
                <thead>
                  <tr>
                    {!imported ? (
                      <th>
                        <input
                          type="checkbox"
                          className="chk"
                          aria-label="Select all variants"
                          checked={allOn}
                          onChange={(e) => setSelected(new Set(e.target.checked ? p.variants.slice(0, 100).map((v) => v.sku) : []))}
                        />
                      </th>
                    ) : null}
                    <th>Variant</th>
                    <th>Gooten SKU</th>
                    <th className="num">Gooten cost</th>
                    {!imported ? <th className="num">Our price</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {p.variants.map((v) => (
                    <tr key={v.sku}>
                      {!imported ? (
                        <td>
                          <input type="checkbox" className="chk" aria-label={`Select ${v.name}`} checked={selected.has(v.sku)} onChange={(e) => toggle(v.sku, e.target.checked)} />
                        </td>
                      ) : null}
                      <td>
                        <div className="pcell">
                          {v.imageUrl ? <Thumb src={v.imageUrl} /> : null}
                          <span>{v.name}</span>
                        </div>
                      </td>
                      <td><code>{v.sku}</code></td>
                      <td className="num">{v.cost !== null ? money(v.cost, p.currency) : "—"}</td>
                      {!imported ? <td className="num">{priceOf(v.cost) !== null ? money(priceOf(v.cost)!, p.currency) : "—"}</td> : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {formError ? <p className="err-text" role="alert">{formError}</p> : null}
        </>
      )}
    </Drawer>
  );
}

// ── Our Gooten products ─────────────────────────────────────────────────────

function ProductsTab() {
  const [rows, setRows] = useState<GootenLink[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<GootenLink | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setRows((await gootenService.links()).data.data ?? []);
    } catch (err) {
      setRows([]);
      setError(getApiErrorMessage(err, "Couldn't load the Gooten products"));
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const priceText = (l: GootenLink) =>
    l.minPrice === null ? "—" : l.minPrice === l.maxPrice ? money(l.minPrice) : `${money(l.minPrice)} – ${money(l.maxPrice)}`;

  return (
    <>
      <div className="twrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Gooten product</th>
              <th className="num">Variants</th>
              <th className="num">Price</th>
              <th className="num">Markup</th>
              <th>Print file</th>
              <th>Imported</th>
            </tr>
          </thead>
          <tbody>
            {rows === null ? (
              <tr className="loading-row"><td colSpan={7}>Loading…</td></tr>
            ) : error ? (
              <tr className="empty-row"><td colSpan={7}><span className="err-text">{error}</span></td></tr>
            ) : rows.length === 0 ? (
              <tr className="empty-row"><td colSpan={7}>Nothing imported yet. Pick a product on the Gooten catalog tab.</td></tr>
            ) : (
              rows.map((l) => (
                <tr key={l.id} className="click" tabIndex={0} onClick={() => setEditing(l)} onKeyDown={(e) => e.key === "Enter" && setEditing(l)}>
                  <td>
                    <strong>{l.name}</strong>
                    <div className="sub">{l.code} · {l.statuses.map((s) => PRODUCT_STATUS_LABEL[s] ?? s).join(", ")}</div>
                  </td>
                  <td className="sub">{l.vendorName} (#{l.vendorProductId})</td>
                  <td className="num">{l.variants}</td>
                  <td className="num">{priceText(l)}</td>
                  <td className="num">{l.markupPercent}%</td>
                  <td>{l.printFileUrl ? <span className="pill p-ok">Set</span> : <span className="pill p-warn">Missing</span>}</td>
                  <td className="sub">{whenText(l.createdAt)}{l.importedBy ? <div>{l.importedBy}</div> : null}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <PrintFileDrawer
        link={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
        }}
      />
    </>
  );
}

function PrintFileDrawer({ link, onClose, onSaved }: { link: GootenLink | null; onClose: () => void; onSaved: () => void }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    setValue(link?.printFileUrl ?? "");
    setErr(null);
  }, [link]);

  const save = async () => {
    if (!link) return;
    const v = value.trim();
    if (!/^https?:\/\//i.test(v)) return setErr("Enter an http:// or https:// URL.");
    setBusy(true);
    try {
      await gootenService.updateLink(link.id, { printFileUrl: v });
      toast("Print file saved");
      onSaved();
    } catch (e) {
      setErr(getApiErrorMessage(e, "Couldn't save the print file"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      open={!!link}
      onClose={onClose}
      title={link?.name ?? ""}
      sub={link ? `Gooten ${link.vendorName} · ${link.variants} variants` : null}
      foot={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</button>
        </>
      }
    >
      <div className="form">
        <div className="fld">
          <label htmlFor="pf-url">Print file URL</label>
          <input className={`inp ${err ? "bad" : ""}`} id="pf-url" type="url" placeholder="https://…/design.png" value={value} onChange={(e) => setValue(e.target.value)} />
          {err ? <span className="err-text">{err}</span> : <span className="hint">A public, high-resolution image. Gooten downloads it and prints it on every unit of this product.</span>}
        </div>
        {link?.printFileUrl ? (
          <div className="fld">
            <label>Current file</label>
            <Thumb src={link.printFileUrl} />
          </div>
        ) : null}
      </div>
    </Drawer>
  );
}

// ── Orders ──────────────────────────────────────────────────────────────────

function OrdersTab({ testMode, onSent }: { testMode: boolean; onSent: () => void }) {
  const [rows, setRows] = useState<GootenOrderRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<Record<string, GootenShipMethod>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setRows((await gootenService.orders()).data.data ?? []);
    } catch (err) {
      setRows([]);
      setError(getApiErrorMessage(err, "Couldn't load orders"));
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const send = async (o: GootenOrderRow) => {
    const ship = method[o.orderId] ?? "STANDARD";
    const what = testMode ? "as a TEST order (not printed or billed)" : "for printing and shipping. Your Gooten partner account will be billed";
    if (!window.confirm(`Send order ${o.orderNumber} to Gooten ${what}?`)) return;
    setBusy(o.orderId);
    try {
      const r = await gootenService.submitOrder(o.orderId, ship);
      toast(`Sent to Gooten as ${r.data.data!.vendorOrderId}`);
      onSent();
      load();
    } catch (err) {
      toast(getApiErrorMessage(err, "Gooten didn't accept the order"), true);
      load();
    } finally {
      setBusy(null);
    }
  };

  const refresh = async (o: GootenOrderRow) => {
    if (!o.submission) return;
    setBusy(o.orderId);
    try {
      const r = await gootenService.refresh(o.submission.id);
      const d = r.data.data!;
      toast(`Gooten status: ${d.status}${d.tracking.length ? ` · tracking ${d.tracking.join(", ")}` : ""}`);
      load();
    } catch (err) {
      toast(getApiErrorMessage(err, "Couldn't refresh from Gooten"), true);
    } finally {
      setBusy(null);
    }
  };

  const sorted = useMemo(() => rows ?? [], [rows]);
  return (
    <>
      {testMode ? (
        <div className="note" style={{ borderRadius: 0 }}>
          Test mode is on: Gooten validates orders sent from here but won&apos;t print, ship or bill them. Turn test mode off in Settings › API integrations to go live.
        </div>
      ) : null}
      <div className="twrap">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Ship to</th>
              <th>Gooten items</th>
              <th>Order status</th>
              <th>Gooten</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows === null ? (
              <tr className="loading-row"><td colSpan={6}>Loading orders…</td></tr>
            ) : error ? (
              <tr className="empty-row"><td colSpan={6}><span className="err-text">{error}</span></td></tr>
            ) : sorted.length === 0 ? (
              <tr className="empty-row"><td colSpan={6}>No orders with Gooten products yet.</td></tr>
            ) : (
              sorted.map((o) => {
                const sent = o.submission?.vendorOrderId ? o.submission : null;
                const last = o.attempts[0];
                return (
                  <tr key={o.orderId}>
                    <td>
                      <Link className="link" href={`/admin/orders?id=${o.orderId}`}>{o.orderNumber}</Link>
                      <div className="sub">{whenText(o.createdAt)}</div>
                    </td>
                    <td>
                      {o.recipient}
                      <div className="sub">{o.shipTo}</div>
                    </td>
                    <td className="sub">
                      {o.items.map((i) => (
                        <div key={i.sku}>{i.quantity} × {i.productName}</div>
                      ))}
                    </td>
                    <td><OrderPill status={o.status} /></td>
                    <td>
                      {sent ? (
                        <>
                          <StatusPill map={SUBMISSION_STATE} status={sent.status} />
                          <div className="sub">
                            <code>{sent.vendorOrderId}</code>
                            {sent.testMode ? " · test" : ""} · {SHIP_LABEL[sent.shipMethod] ?? sent.shipMethod}
                          </div>
                        </>
                      ) : last?.status === "FAILED" ? (
                        <>
                          <StatusPill map={SUBMISSION_STATE} status="FAILED" />
                          <div className="sub err-text" style={{ maxWidth: 280 }}>{last.error}</div>
                        </>
                      ) : (
                        <span className="pill p-grey">Not sent</span>
                      )}
                    </td>
                    <td>
                      {sent ? (
                        <button className="btn btn-sm btn-secondary" onClick={() => refresh(o)} disabled={busy === o.orderId}>
                          <Icon name="refresh" />
                          Refresh
                        </button>
                      ) : (
                        <div className="actrow" style={{ justifyContent: "flex-end", gap: 6 }}>
                          <select
                            className="sel"
                            aria-label={`Shipping for ${o.orderNumber}`}
                            value={method[o.orderId] ?? "STANDARD"}
                            onChange={(e) => setMethod((m) => ({ ...m, [o.orderId]: e.target.value as GootenShipMethod }))}
                          >
                            {(Object.keys(SHIP_LABEL) as GootenShipMethod[]).map((k) => (
                              <option key={k} value={k}>{SHIP_LABEL[k]}</option>
                            ))}
                          </select>
                          <button className="btn btn-sm btn-primary" onClick={() => send(o)} disabled={busy === o.orderId}>
                            {busy === o.orderId ? "Sending…" : "Send to Gooten"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
