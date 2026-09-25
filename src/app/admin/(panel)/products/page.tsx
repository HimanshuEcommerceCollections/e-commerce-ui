"use client";
import { useCallback, useEffect, useState } from "react";
import adminService from "@/services/admin/admin.service";
import publicCategoryService from "@/services/public/category.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type { CategoryResponse } from "@/types/api/category.types";
import type { ProductStatus } from "@/types/api/common.types";
import type { AdminProductDetail, AdminProductRow, ProductStatusCounts } from "@/types/api/admin.types";
import ImportDialog from "@/components/admin/ImportDialog";
import { refreshAdminCounts } from "@/components/admin/refresh";
import {
  Drawer,
  Icon,
  Pager,
  PRODUCT_STATUS_LABEL,
  ProductPill,
  StockPill,
  Thumb,
  money,
  rangeText,
  shortDate,
  toast,
  useDebounced,
} from "@/components/admin/ui";

const SIZE = 10;
const TABS: Array<{ key: ProductStatus | "ALL"; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "ACTIVE", label: "Active" },
  { key: "DRAFT", label: "Draft" },
  { key: "INACTIVE", label: "Unpublished" },
];

const priceText = (p: AdminProductRow) =>
  p.minPrice === p.maxPrice ? money(p.minPrice) : `${money(p.minPrice)} – ${money(p.maxPrice)}`;

export default function AdminProductsPage() {
  const [tab, setTab] = useState<ProductStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<AdminProductRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [counts, setCounts] = useState<ProductStatusCounts | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    publicCategoryService.getAll().then((r) => setCategories(r.data.data ?? [])).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setError(null);
    const filter = { search: q || undefined, categoryId: categoryId || undefined };
    try {
      const [list, c] = await Promise.all([
        adminService.listProducts({ ...filter, status: tab === "ALL" ? undefined : tab, page, size: SIZE, sort: "updatedAt,desc" }),
        adminService.productStatusCounts(filter),
      ]);
      const data = list.data.data!;
      setRows(data.content);
      setTotal(data.totalElements);
      setPages(data.totalPages);
      setCounts(c.data.data);
    } catch (err) {
      setRows([]);
      setError(getApiErrorMessage(err, "Couldn't load products"));
    }
  }, [q, categoryId, tab, page]);

  useEffect(() => {
    load();
  }, [load]);

  // A new filter starts from the first page.
  useEffect(() => setPage(0), [q, categoryId, tab]);

  const toggle = (id: string, on: boolean) =>
    setSelected((s) => {
      const n = new Set(s);
      if (on) n.add(id);
      else n.delete(id);
      return n;
    });
  const allOnPage = !!rows?.length && rows.every((r) => selected.has(r.id));

  const bulk = async (status: ProductStatus) => {
    setBusy(true);
    try {
      const res = await adminService.setStatus(Array.from(selected), status);
      const n = res.data.data!.products;
      toast(`${n} product${n === 1 ? "" : "s"} ${status === "ACTIVE" ? "published" : "unpublished"}`);
      setSelected(new Set());
      await load();
    } catch (err) {
      toast(getApiErrorMessage(err, "Couldn't update the products"), true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="h-products">
      <div className="page-head">
        <div>
          <h1 id="h-products">Products</h1>
          <p>
            {counts ? `${counts.ALL.toLocaleString()} products` : "Loading…"}
            {counts ? " · import the catalog from the template to add more" : ""}
          </p>
        </div>
        <div className="actions">
          <button className="btn btn-secondary" onClick={() => setImportOpen(true)}>
            <Icon name="upload" />
            Import products
          </button>
          <button
            className="btn btn-primary"
            onClick={() => toast("Products are added through the import template; manual entry isn't a launch path.")}
          >
            <Icon name="plus" />
            Add product
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}>
              {t.label}
              <span className="c">{counts ? counts[t.key] : "…"}</span>
            </button>
          ))}
        </div>
        <div className="toolbar">
          <label className="search">
            <Icon name="search" />
            <span className="sr-only">Search products</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, SKU, code or brand" />
          </label>
          <select className="sel" aria-label="Category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className={`bulk ${selected.size ? "show" : ""}`} role="region" aria-label="Bulk actions">
          <b>{selected.size} selected</b>
          <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => bulk("ACTIVE")}>Publish</button>
          <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => bulk("INACTIVE")}>Unpublish</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setSelected(new Set())}>Clear</button>
        </div>
        <div className="twrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 44 }}>
                  <input
                    type="checkbox"
                    className="chk"
                    aria-label="Select all on this page"
                    checked={allOnPage}
                    onChange={(e) => rows?.forEach((r) => toggle(r.id, e.target.checked))}
                  />
                </th>
                <th>Product</th>
                <th>Category</th>
                <th className="num">Variants</th>
                <th className="num">Price</th>
                <th className="num">Stock</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows === null ? (
                <tr className="loading-row"><td colSpan={8}>Loading products…</td></tr>
              ) : error ? (
                <tr className="empty-row"><td colSpan={8}><span className="err-text">{error}</span></td></tr>
              ) : rows.length === 0 ? (
                <tr className="empty-row">
                  <td colSpan={8}>
                    {q || categoryId || tab !== "ALL"
                      ? "No products match. Try a different search or filter."
                      : "No products yet. Use Import products to upload the catalog."}
                  </td>
                </tr>
              ) : (
                rows.map((p) => {
                  const on = selected.has(p.id);
                  return (
                    <tr key={p.id} className={`click ${on ? "selected" : ""}`} onClick={() => setEditing(p.id)}>
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="chk"
                          checked={on}
                          onChange={(e) => toggle(p.id, e.target.checked)}
                          aria-label={`Select ${p.name}`}
                        />
                      </td>
                      <td>
                        <div className="pcell">
                          <Thumb src={p.primaryImageUrl} />
                          <div>
                            <strong>{p.name}</strong>
                            <span className="sub">{p.code}{p.brand ? ` · ${p.brand}` : ""}</span>
                          </div>
                        </div>
                      </td>
                      <td>{p.category?.name ?? <span className="sub">—</span>}</td>
                      <td className="num">{p.variantCount}</td>
                      <td className="num">{priceText(p)}</td>
                      <td className="num">
                        {p.totalStock.toLocaleString()}
                        {p.lowStockVariants ? <div className="sub qty-low">{p.lowStockVariants} low / out</div> : null}
                      </td>
                      <td><ProductPill status={p.status} /></td>
                      <td className="sub">{shortDate(p.updatedAt)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="tfoot">
          <span>{rows ? rangeText(page, SIZE, rows.length, total, "products") : ""}</span>
          <Pager page={page} pages={pages} onPage={setPage} />
        </div>
      </div>

      <EditProduct
        id={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
          refreshAdminCounts();
        }}
      />
      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => {
          load();
          refreshAdminCounts();
          publicCategoryService.getAll().then((r) => setCategories(r.data.data ?? [])).catch(() => {});
        }}
      />
    </section>
  );
}

type VariantDraft = { price: string; status: ProductStatus };

function EditProduct({ id, onClose, onSaved }: { id: string | null; onClose: () => void; onSaved: () => void }) {
  const [p, setP] = useState<AdminProductDetail | null>(null);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [variants, setVariants] = useState<Record<string, VariantDraft>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setP(null);
    setError(null);
    if (!id) return;
    adminService
      .getProduct(id)
      .then((r) => {
        const d = r.data.data!;
        setP(d);
        setName(d.name);
        setBrand(d.brand ?? "");
        setVariants(Object.fromEntries(d.variants.map((v) => [v.id, { price: v.price.toFixed(2), status: v.status }])));
      })
      .catch((err) => setError(getApiErrorMessage(err, "Couldn't load the product")));
  }, [id]);

  const setAll = (status: ProductStatus) =>
    setVariants((vs) => Object.fromEntries(Object.entries(vs).map(([k, v]) => [k, { ...v, status }])));

  const save = async () => {
    if (!p) return;
    const bad = Object.values(variants).some((v) => !(parseFloat(v.price) > 0));
    if (!name.trim()) return setError("Product name is required.");
    if (bad) return setError("Every price must be a number greater than 0.");
    setSaving(true);
    setError(null);
    try {
      if (name.trim() !== p.name || brand.trim() !== (p.brand ?? "")) {
        await adminService.updateProduct(p.id, { name: name.trim(), brand: brand.trim() });
      }
      for (const v of p.variants) {
        const d = variants[v.id];
        const price = Math.round(parseFloat(d.price) * 100) / 100;
        const change: { price?: number; status?: ProductStatus } = {};
        if (price !== v.price) change.price = price;
        if (d.status !== v.status) change.status = d.status;
        if (Object.keys(change).length) await adminService.updateVariant(v.id, change);
      }
      toast("Product saved");
      onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err, "Couldn't save the product"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={!!id}
      onClose={onClose}
      title={p?.name ?? "Product"}
      sub={p ? <><code>{p.code}</code> · {p.category?.name ?? "No category"}</> : null}
      foot={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={!p || saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </>
      }
    >
      {!p ? (
        error ? <p className="err-text">{error}</p> : <p className="sub">Loading…</p>
      ) : (
        <>
          {error ? <div className="note warn" role="alert"><Icon name="info" /><span>{error}</span></div> : null}
          <div className="form">
            <div className="fld">
              <label htmlFor="eName">Product name</label>
              <input className={`inp ${name.trim() ? "" : "bad"}`} id="eName" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="row2">
              <div className="fld">
                <label htmlFor="eBrand">Brand</label>
                <input className="inp" id="eBrand" value={brand} onChange={(e) => setBrand(e.target.value)} />
              </div>
              <div className="fld">
                <label htmlFor="eStatus">Status (all variants)</label>
                <select className="sel inp" id="eStatus" value="" onChange={(e) => e.target.value && setAll(e.target.value as ProductStatus)}>
                  <option value="">Set every variant…</option>
                  {(["ACTIVE", "DRAFT", "INACTIVE"] as const).map((s) => (
                    <option key={s} value={s}>{PRODUCT_STATUS_LABEL[s]}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="d-sec">
            <h3>Variants ({p.variants.length} SKUs)</h3>
            <div className="items">
              {p.variants.map((v) => {
                const d = variants[v.id];
                return (
                  <div className="vrow" key={v.id}>
                    <div style={{ minWidth: 0 }}>
                      <strong>{v.variantName ?? ([v.color, v.size].filter(Boolean).join(" / ") || "Default")}</strong>
                      <span className="sub" style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        <code>{v.sku}</code> {v.stockQuantity} on hand <StockPill status={v.stockStatus} />
                      </span>
                    </div>
                    <input
                      className={`inp ${parseFloat(d.price) > 0 ? "" : "bad"}`}
                      aria-label={`Price of ${v.sku}`}
                      inputMode="decimal"
                      value={d.price}
                      onChange={(e) => setVariants((vs) => ({ ...vs, [v.id]: { ...d, price: e.target.value } }))}
                    />
                    <select
                      className="sel inp"
                      aria-label={`Status of ${v.sku}`}
                      value={d.status}
                      onChange={(e) => setVariants((vs) => ({ ...vs, [v.id]: { ...d, status: e.target.value as ProductStatus } }))}
                    >
                      {(["ACTIVE", "DRAFT", "INACTIVE", "ARCHIVED"] as const).map((s) => (
                        <option key={s} value={s}>{PRODUCT_STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
            <p className="sub" style={{ marginTop: 8 }}>Stock is changed on the Inventory page, with a reason.</p>
          </div>

          {p.description ? (
            <div className="d-sec">
              <h3>Description</h3>
              <p style={{ whiteSpace: "pre-line" }}>{p.description}</p>
            </div>
          ) : null}

          <div className="note">
            <Icon name="info" />
            <span>MRP, tax rate and SEO fields aren&apos;t stored yet; they&apos;re listed as ignored columns when you import.</span>
          </div>
        </>
      )}
    </Drawer>
  );
}
