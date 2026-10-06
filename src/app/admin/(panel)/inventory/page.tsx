"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import adminService from "@/services/admin/admin.service";
import publicCategoryService from "@/services/public/category.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type { CategoryResponse } from "@/types/api/category.types";
import type { AdminInventoryRow, InventoryStats, StockMovement, StockMovementSource } from "@/types/api/admin.types";
import BulkUpdateDialog from "@/components/admin/BulkUpdateDialog";
import { refreshAdminCounts } from "@/components/admin/refresh";
import { Drawer, Icon, PRODUCT_STATUS_LABEL, Pager, StockPill, dateTime, money, rangeText, toast, useDebounced, usePageTitle } from "@/components/admin/ui";

const SIZE = 15;
const REASONS = ["Stock received", "Damaged / lost", "Count correction", "Return to stock"];

export default function AdminInventoryPage() {
  usePageTitle("Inventory");
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const [categoryId, setCategoryId] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<AdminInventoryRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [adjust, setAdjust] = useState<{ row: AdminInventoryRow; top: number; left: number } | null>(null);
  const [history, setHistory] = useState<AdminInventoryRow | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const hostRef = useRef<HTMLElement>(null);

  useEffect(() => {
    publicCategoryService.getAll().then((r) => setCategories(r.data.data ?? [])).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [list, s] = await Promise.all([
        adminService.listInventory({
          search: q || undefined,
          categoryId: categoryId || undefined,
          stock: lowOnly ? "low" : undefined,
          sort: lowOnly ? "stockQuantity" : "sku",
          page,
          size: SIZE,
        }),
        adminService.inventoryStats(),
      ]);
      const data = list.data.data!;
      setRows(data.content);
      setTotal(data.totalElements);
      setPages(data.totalPages);
      setStats(s.data.data);
    } catch (err) {
      setRows([]);
      setError(getApiErrorMessage(err, "Couldn't load inventory"));
    }
  }, [q, categoryId, lowOnly, page]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => setPage(0), [q, categoryId, lowOnly]);

  const openAdjust = (row: AdminInventoryRow, button: HTMLElement) => {
    const host = hostRef.current!.getBoundingClientRect();
    const r = button.getBoundingClientRect();
    setAdjust({
      row,
      top: r.bottom - host.top + 8,
      left: Math.max(0, Math.min(r.right - host.left - 280, host.width - 280)),
    });
  };

  return (
    <section ref={hostRef} aria-labelledby="h-inventory" style={{ position: "relative" }}>
      <div className="page-head">
        <div>
          <h1 id="h-inventory">Inventory</h1>
          <p>Stock by SKU. Stock deducts on confirmed orders and restores on cancellation.</p>
        </div>
        <div className="actions">
          <button className="btn btn-secondary" onClick={() => setBulkOpen(true)}>
            <Icon name="upload" />
            Bulk update price &amp; stock
          </button>
        </div>
      </div>

      <div className="stats">
        <div className="stat"><span>Total SKUs</span><b>{stats ? stats.skus.toLocaleString() : "…"}</b></div>
        <div className="stat"><span>Units on hand</span><b>{stats ? stats.units.toLocaleString() : "…"}</b></div>
        <button className="stat" aria-pressed={lowOnly} onClick={() => setLowOnly((v) => !v)}>
          <span><i style={{ background: "var(--warn)" }} />Low stock</span>
          <b>{stats ? stats.lowStock : "…"}</b>
        </button>
        <button className="stat" aria-pressed={lowOnly} onClick={() => setLowOnly((v) => !v)}>
          <span><i style={{ background: "var(--bad)" }} />Out of stock</span>
          <b>{stats ? stats.outOfStock : "…"}</b>
        </button>
      </div>

      <div className="panel">
        <div className="toolbar">
          <label className="search">
            <Icon name="search" />
            <span className="sr-only">Search SKUs</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by SKU or product" />
          </label>
          <select className="sel" aria-label="Category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <label className="switch">
            <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
            Low &amp; out of stock only
          </label>
        </div>
        <div className="twrap">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product</th>
                <th>Variant</th>
                <th>Warehouse</th>
                <th className="num">On hand</th>
                <th className="num">Low at</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows === null ? (
                <tr className="loading-row"><td colSpan={8}>Loading inventory…</td></tr>
              ) : error ? (
                <tr className="empty-row"><td colSpan={8}><span className="err-text">{error}</span></td></tr>
              ) : rows.length === 0 ? (
                <tr className="empty-row"><td colSpan={8}>No SKUs match.</td></tr>
              ) : (
                rows.map((s) => (
                  <tr key={s.id}>
                    <td><code>{s.sku}</code></td>
                    <td style={{ whiteSpace: "normal", minWidth: 180 }}>
                      {s.productName}
                      <div className="sub">
                        {[s.categoryName, money(s.price), s.status !== "ACTIVE" ? PRODUCT_STATUS_LABEL[s.status] : null].filter(Boolean).join(" · ")}
                      </div>
                    </td>
                    <td>{s.variantName ?? <span className="sub">—</span>}</td>
                    <td className="sub">{s.warehouseId ?? "—"}</td>
                    <td className={`num ${s.stockStatus === "OUT_OF_STOCK" ? "qty-out" : s.stockStatus === "LOW_STOCK" ? "qty-low" : ""}`}>
                      {s.stockQuantity}
                    </td>
                    <td className="num sub">
                      {s.lowStockThreshold}
                      {s.ownLowStockThreshold === null ? <div>default</div> : null}
                    </td>
                    <td><StockPill status={s.stockStatus} /></td>
                    <td className="num">
                      <span className="actrow">
                        <button className="btn btn-secondary btn-sm" onClick={() => setHistory(s)} aria-label={`Stock history of ${s.sku}`} title="Stock history">
                          <Icon name="clock" size={16} />
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={(e) => openAdjust(s, e.currentTarget)}>
                          Adjust
                        </button>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="tfoot">
          <span>{rows ? rangeText(page, SIZE, rows.length, total, "SKUs") : ""}</span>
          <Pager page={page} pages={pages} onPage={setPage} />
        </div>
      </div>

      {adjust ? (
        <AdjustPopover
          key={adjust.row.id}
          row={adjust.row}
          style={{ top: adjust.top, left: adjust.left }}
          onClose={() => setAdjust(null)}
          onSaved={(updated, before) => {
            toast(`${updated.sku}: ${before} → ${updated.stockQuantity}`);
            setAdjust(null);
            load();
            refreshAdminCounts();
          }}
        />
      ) : null}

      <StockHistory row={history} onClose={() => setHistory(null)} />
      <BulkUpdateDialog
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onUpdated={() => {
          load();
          refreshAdminCounts();
        }}
      />
    </section>
  );
}

const SOURCE: Record<StockMovementSource, string> = {
  ADJUSTMENT: "Adjustment",
  BULK_UPDATE: "Bulk update",
  IMPORT: "Import",
  RETURN: "Return",
};
const HISTORY_SIZE = 20;

/** Every stock change outside checkout, newest first (FR-AD-03). */
function StockHistory({ row, onClose }: { row: AdminInventoryRow | null; onClose: () => void }) {
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<StockMovement[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setPage(0), [row]);

  useEffect(() => {
    setItems(null);
    setError(null);
    if (!row) return;
    adminService
      .stockMovements(row.id, { page, size: HISTORY_SIZE })
      .then((r) => {
        const d = r.data.data!;
        setItems(d.content);
        setTotal(d.totalElements);
        setPages(d.totalPages);
      })
      .catch((err) => setError(getApiErrorMessage(err, "Couldn't load the stock history")));
  }, [row, page]);

  return (
    <Drawer
      open={!!row}
      onClose={onClose}
      title="Stock history"
      sub={row ? <><code>{row.sku}</code> · {row.stockQuantity} on hand</> : null}
      foot={<button className="btn btn-secondary" onClick={onClose}>Close</button>}
    >
      {error ? (
        <p className="err-text">{error}</p>
      ) : !items ? (
        <p className="sub">Loading…</p>
      ) : items.length === 0 ? (
        <p className="sub">No stock changes recorded yet. Orders deduct stock on payment and aren&apos;t listed here.</p>
      ) : (
        <>
          <div className="items">
            {items.map((m) => {
              const d = dateTime(m.createdAt);
              return (
                <div className="item" key={m.id}>
                  <div>
                    <strong>{m.reason || SOURCE[m.source] || m.source}</strong>
                    <span className="sub">
                      {SOURCE[m.source] ?? m.source} · {d.date}, {d.time}
                      {m.actor ? ` · ${m.actor}` : ""}
                    </span>
                  </div>
                  <span style={{ textAlign: "right" }}>
                    <b className={m.delta < 0 ? "qty-low" : "qty-up"}>{m.delta > 0 ? `+${m.delta}` : m.delta}</b>
                    <div className="sub">→ {m.quantityAfter}</div>
                  </span>
                </div>
              );
            })}
          </div>
          <div className="tfoot" style={{ padding: 0 }}>
            <span>{rangeText(page, HISTORY_SIZE, items.length, total, "changes")}</span>
            <Pager page={page} pages={pages} onPage={setPage} />
          </div>
        </>
      )}
    </Drawer>
  );
}

function AdjustPopover({
  row,
  style,
  onClose,
  onSaved,
}: {
  row: AdminInventoryRow;
  style: { top: number; left: number };
  onClose: () => void;
  onSaved: (updated: AdminInventoryRow, before: number) => void;
}) {
  const [qty, setQty] = useState("0");
  const [reason, setReason] = useState(REASONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.select();
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    // Registered after this click finishes, so the opening click doesn't close it.
    const t = setTimeout(() => document.addEventListener("mousedown", onDown));
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const delta = parseInt(qty, 10) || 0;
  const step = (d: number) => setQty(String(delta + d));

  const save = async () => {
    if (!delta) return onClose();
    if (row.stockQuantity + delta < 0) {
      setError(`Only ${row.stockQuantity} on hand.`);
      return;
    }
    setSaving(true);
    try {
      const res = await adminService.adjustStock(row.id, delta, reason);
      onSaved(res.data.data!, row.stockQuantity);
    } catch (err) {
      setError(getApiErrorMessage(err, "Couldn't adjust stock"));
      setSaving(false);
    }
  };

  return (
    <div className="pop show" ref={ref} style={style} role="dialog" aria-label="Adjust stock">
      <div>
        <strong>{row.sku}</strong>
        <div className="sub">
          {row.productName}
          {row.variantName ? ` · ${row.variantName}` : ""} · {row.stockQuantity} on hand
        </div>
      </div>
      <div className="fld">
        <label htmlFor="adjQty">Change quantity by</label>
        <div className="stepper">
          <button onClick={() => step(-1)} aria-label="Decrease">−</button>
          <input
            id="adjQty"
            ref={inputRef}
            value={qty}
            inputMode="numeric"
            onChange={(e) => setQty(e.target.value.replace(/[^\d-]/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && save()}
          />
          <button onClick={() => step(1)} aria-label="Increase">+</button>
        </div>
        <span className="sub">New on hand: {Math.max(0, row.stockQuantity + delta)}</span>
      </div>
      <div className="fld">
        <label htmlFor="adjReason">Reason</label>
        <select className="sel" id="adjReason" value={reason} onChange={(e) => setReason(e.target.value)}>
          {REASONS.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>
      {error ? <p className="err-text">{error}</p> : null}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
