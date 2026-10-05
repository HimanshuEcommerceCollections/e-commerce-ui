"use client";
import { useCallback, useEffect, useState } from "react";
import adminService from "@/services/admin/admin.service";
import publicCategoryService from "@/services/public/category.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type { CategoryResponse } from "@/types/api/category.types";
import type { ProductStatus } from "@/types/api/common.types";
import type { AdminProductRow, ProductStatusCounts } from "@/types/api/admin.types";
import BulkUpdateDialog from "@/components/admin/BulkUpdateDialog";
import EditProduct from "@/components/admin/EditProduct";
import ImageIssues from "@/components/admin/ImageIssues";
import ImportDialog from "@/components/admin/ImportDialog";
import { fileNameFrom, saveFile } from "@/components/admin/files";
import { refreshAdminCounts } from "@/components/admin/refresh";
import {
  Icon,
  Pager,
  ProductPill,
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
  const [bulkOpen, setBulkOpen] = useState(false);
  const [issuesOpen, setIssuesOpen] = useState(false);
  const [brokenImages, setBrokenImages] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
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

  const loadImageCount = useCallback(() => {
    adminService
      .imageIssues({ page: 0, size: 1 })
      .then((r) => setBrokenImages(r.data.data?.totalElements ?? 0))
      .catch(() => {});
  }, []);
  useEffect(loadImageCount, [loadImageCount]);

  // NFR-06: the whole catalog as a file, in the import template's columns.
  const exportCatalog = async (format: "csv" | "xlsx") => {
    setExporting(true);
    try {
      const res = await adminService.exportCatalog(format);
      const header = res.headers["content-disposition"] as string | undefined;
      saveFile(fileNameFrom(header, `catalog-export.${format}`), res.data);
    } catch (err) {
      toast(getApiErrorMessage(err, "Couldn't export the catalog"), true);
    } finally {
      setExporting(false);
    }
  };

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
          <button className="btn btn-secondary" onClick={() => setBulkOpen(true)}>
            <Icon name="upload" />
            Bulk update
          </button>
          <details className="menu">
            <summary className="btn btn-secondary" aria-disabled={exporting}>
              <Icon name="download" />
              {exporting ? "Exporting…" : "Export"}
            </summary>
            <div className="menu-list" role="menu">
              {(["csv", "xlsx"] as const).map((f) => (
                <button
                  key={f}
                  role="menuitem"
                  disabled={exporting}
                  onClick={(e) => {
                    e.currentTarget.closest("details")?.removeAttribute("open");
                    exportCatalog(f);
                  }}
                >
                  {f === "csv" ? "CSV (.csv)" : "Excel (.xlsx)"}
                </button>
              ))}
            </div>
          </details>
          <button className={`btn ${brokenImages ? "btn-danger" : "btn-secondary"}`} onClick={() => setIssuesOpen(true)}>
            <Icon name="image" />
            Image issues{brokenImages ? ` (${brokenImages})` : ""}
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
                            {p.featured || p.brokenImages ? (
                              <span className="badges">
                                {p.featured ? <span className="pill p-info">Featured</span> : null}
                                {p.brokenImages ? (
                                  <span className="pill p-bad" title="Image URLs that failed the check (FR-IM-08)">
                                    {p.brokenImages} broken image{p.brokenImages === 1 ? "" : "s"}
                                  </span>
                                ) : null}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td>
                        {p.category?.name ?? <span className="sub">—</span>}
                        {p.subcategory ? <div className="sub">{p.subcategory.name}</div> : null}
                      </td>
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
      <ImageIssues
        open={issuesOpen}
        onClose={() => setIssuesOpen(false)}
        onChecked={() => {
          load();
          loadImageCount();
        }}
        onOpenProduct={(id) => {
          setIssuesOpen(false);
          setEditing(id);
        }}
      />
      <BulkUpdateDialog
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onUpdated={() => {
          load();
          refreshAdminCounts();
        }}
      />
      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => {
          load();
          loadImageCount();
          refreshAdminCounts();
          publicCategoryService.getAll().then((r) => setCategories(r.data.data ?? [])).catch(() => {});
        }}
      />
    </section>
  );
}

