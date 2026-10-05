"use client";
import { useEffect, useState } from "react";
import adminService from "@/services/admin/admin.service";
import publicCategoryService from "@/services/public/category.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type { CategoryTreeNode } from "@/types/api/category.types";
import type { ProductStatus } from "@/types/api/common.types";
import type { AdminProductDetail, AdminProductUpdate, AdminVariant, AdminVariantUpdate } from "@/types/api/admin.types";
import { Drawer, Icon, PRODUCT_STATUS_LABEL, StockPill, money, toast } from "./ui";

type VariantDraft = { price: string; mrp: string; taxRate: string; low: string; status: ProductStatus };

const num = (s: string) => (s.trim() === "" ? null : Number(s));
const round2 = (n: number) => Math.round(n * 100) / 100;
const draftOf = (v: AdminVariant): VariantDraft => ({
  price: v.price.toFixed(2),
  mrp: v.mrp ? v.mrp.toFixed(2) : "",
  taxRate: v.taxRate === null || v.taxRate === undefined ? "" : String(v.taxRate),
  low: v.ownLowStockThreshold === null || v.ownLowStockThreshold === undefined ? "" : String(v.ownLowStockThreshold),
  status: v.status,
});

/** A problem with a variant's draft, or null. The server checks again (FR-AD-05). */
function variantProblem(d: VariantDraft): string | null {
  const price = num(d.price);
  const mrp = num(d.mrp);
  const tax = num(d.taxRate);
  const low = num(d.low);
  if (price === null || !(price > 0)) return "Price must be greater than 0.";
  if (mrp !== null && (Number.isNaN(mrp) || mrp < 0)) return "MRP must be 0 or more (empty clears it).";
  if (mrp && price > mrp) return "Price can't be above MRP.";
  if (tax !== null && (Number.isNaN(tax) || tax < 0 || tax > 100)) return "Tax rate is a percent from 0 to 100.";
  if (low !== null && (!Number.isInteger(low) || low < 0)) return "Low-stock level must be a whole number.";
  return null;
}

/** Only the fields that changed, as PATCH /api/admin/variants/:id takes them. */
function variantChanges(v: AdminVariant, d: VariantDraft): AdminVariantUpdate {
  const c: AdminVariantUpdate = {};
  const price = round2(Number(d.price));
  if (price !== v.price) c.price = price;
  const mrp = num(d.mrp);
  if ((mrp ? round2(mrp) : null) !== (v.mrp || null)) c.mrp = mrp ? round2(mrp) : 0;
  const tax = num(d.taxRate);
  if (tax !== null && tax !== v.taxRate) c.taxRate = tax;
  const low = num(d.low);
  if (low === null && v.ownLowStockThreshold !== null) c.clearLowStockThreshold = true;
  else if (low !== null && low !== v.ownLowStockThreshold) c.lowStockThreshold = low;
  if (d.status !== v.status) c.status = d.status;
  return c;
}

let treeCache: CategoryTreeNode[] | null = null;

/** Product and variant editing (FR-AD-01, FR-AD-05). */
export default function EditProduct({ id, onClose, onSaved }: { id: string | null; onClose: () => void; onSaved: () => void }) {
  const [p, setP] = useState<AdminProductDetail | null>(null);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [productType, setProductType] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [featured, setFeatured] = useState(false);
  const [variants, setVariants] = useState<Record<string, VariantDraft>>({});
  const [tree, setTree] = useState<CategoryTreeNode[]>(treeCache ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (treeCache) return;
    publicCategoryService
      .getTree()
      .then((r) => {
        treeCache = r.data.data ?? [];
        setTree(treeCache);
      })
      .catch(() => {});
  }, []);

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
        setProductType(d.productType ?? "");
        setShortDescription(d.shortDescription ?? "");
        setSubcategoryId(d.subcategory?.id ?? "");
        setFeatured(!!d.featured);
        setVariants(Object.fromEntries(d.variants.map((v) => [v.id, draftOf(v)])));
      })
      .catch((err) => setError(getApiErrorMessage(err, "Couldn't load the product")));
  }, [id]);

  const subcategories = tree.find((c) => c.id === p?.category?.id)?.subcategories ?? [];

  const setAll = (status: ProductStatus) =>
    setVariants((vs) => Object.fromEntries(Object.entries(vs).map(([k, v]) => [k, { ...v, status }])));
  const setDraft = (vid: string, patch: Partial<VariantDraft>) =>
    setVariants((vs) => ({ ...vs, [vid]: { ...vs[vid], ...patch } }));

  const save = async () => {
    if (!p) return;
    if (!name.trim()) return setError("Product name is required.");
    for (const v of p.variants) {
      const problem = variantProblem(variants[v.id]);
      if (problem) return setError(`${v.sku}: ${problem}`);
    }
    setSaving(true);
    setError(null);
    try {
      const change: AdminProductUpdate = {};
      if (name.trim() !== p.name) change.name = name.trim();
      if (brand.trim() !== (p.brand ?? "")) change.brand = brand.trim();
      if (productType.trim() !== (p.productType ?? "")) change.productType = productType.trim();
      if (shortDescription.trim() !== (p.shortDescription ?? "")) change.shortDescription = shortDescription.trim();
      if (subcategoryId && subcategoryId !== (p.subcategory?.id ?? "")) change.subcategoryId = subcategoryId;
      if (featured !== !!p.featured) change.featured = featured;
      if (Object.keys(change).length) await adminService.updateProduct(p.id, change);
      for (const v of p.variants) {
        const c = variantChanges(v, variants[v.id]);
        if (Object.keys(c).length) await adminService.updateVariant(v.id, c);
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
      sub={
        p ? (
          <>
            <code>{p.code}</code> · {p.category?.name ?? "No category"}
            {p.subcategory ? ` › ${p.subcategory.name}` : ""}
          </>
        ) : null
      }
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
          {p.brokenImages ? (
            <div className="note warn">
              <Icon name="image" />
              <span>
                {p.brokenImages} image URL{p.brokenImages === 1 ? "" : "s"} failed the check (FR-IM-08). Open a variant&apos;s
                images below to see which.
              </span>
            </div>
          ) : null}
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
                <label htmlFor="eType">Product type</label>
                <input className="inp" id="eType" value={productType} onChange={(e) => setProductType(e.target.value)} />
              </div>
            </div>
            <div className="row2">
              <div className="fld">
                <label htmlFor="eSub">Subcategory</label>
                <select className="sel inp" id="eSub" value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value)}>
                  {!subcategoryId ? <option value="">None</option> : null}
                  {subcategories.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                  {p.subcategory && !subcategories.some((s) => s.id === p.subcategory!.id) ? (
                    <option value={p.subcategory.id}>{p.subcategory.name}</option>
                  ) : null}
                </select>
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
            <div className="fld">
              <label htmlFor="eShort">Short description</label>
              <textarea
                className="inp"
                id="eShort"
                value={shortDescription}
                maxLength={1000}
                onChange={(e) => setShortDescription(e.target.value)}
              />
            </div>
            <label className="switch">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
              Featured on the homepage
            </label>
          </div>

          <div className="d-sec">
            <h3>Variants ({p.variants.length} SKUs)</h3>
            <div className="items">
              {p.variants.map((v) => (
                <VariantCard key={v.id} v={v} d={variants[v.id]} onChange={(patch) => setDraft(v.id, patch)} />
              ))}
            </div>
            <p className="sub" style={{ marginTop: 8 }}>
              Stock is changed on the Inventory page, with a reason. Leave MRP or the low-stock level empty to clear it.
            </p>
          </div>

          {p.keyFeatures?.length ? (
            <div className="d-sec">
              <h3>Key features</h3>
              <ul className="bullets">
                {p.keyFeatures.map((f) => <li key={f}>{f}</li>)}
              </ul>
            </div>
          ) : null}

          {p.attributes && Object.keys(p.attributes).length ? (
            <div className="d-sec">
              <h3>Category attributes</h3>
              <dl className="kv">
                {Object.entries(p.attributes).map(([k, val]) => (
                  <div key={k} style={{ display: "contents" }}>
                    <dt>{k.replaceAll("_", " ")}</dt>
                    <dd>{String(val)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          {p.description ? (
            <div className="d-sec">
              <h3>Description</h3>
              <p style={{ whiteSpace: "pre-line" }}>{p.description}</p>
            </div>
          ) : null}
        </>
      )}
    </Drawer>
  );
}

function VariantCard({ v, d, onChange }: { v: AdminVariant; d: VariantDraft; onChange: (patch: Partial<VariantDraft>) => void }) {
  const problem = variantProblem(d);
  const images = v.images ?? [];
  const broken = images.filter((i) => i.checkStatus === "BROKEN").length;
  const priceBad = !(Number(d.price) > 0) || (!!num(d.mrp) && Number(d.price) > Number(d.mrp));
  return (
    <div className="vcard">
      <div>
        <strong>{v.variantName ?? ([v.color, v.size].filter(Boolean).join(" / ") || "Default")}</strong>
        <span className="sub" style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <code>{v.sku}</code> {v.stockQuantity} on hand <StockPill status={v.stockStatus} />
          {broken ? <span className="pill p-bad">{broken} broken image{broken === 1 ? "" : "s"}</span> : null}
        </span>
      </div>
      <div className="vgrid">
        <div className="fld">
          <label htmlFor={`pr-${v.id}`}>Price</label>
          <input
            id={`pr-${v.id}`}
            className={`inp ${priceBad ? "bad" : ""}`}
            inputMode="decimal"
            value={d.price}
            onChange={(e) => onChange({ price: e.target.value })}
          />
        </div>
        <div className="fld">
          <label htmlFor={`mrp-${v.id}`}>MRP</label>
          <input id={`mrp-${v.id}`} className="inp" inputMode="decimal" placeholder="—" value={d.mrp} onChange={(e) => onChange({ mrp: e.target.value })} />
        </div>
        <div className="fld">
          <label htmlFor={`tax-${v.id}`}>Tax %</label>
          <input
            id={`tax-${v.id}`}
            className="inp"
            inputMode="decimal"
            placeholder="—"
            value={d.taxRate}
            onChange={(e) => onChange({ taxRate: e.target.value })}
          />
        </div>
        <div className="fld">
          <label htmlFor={`low-${v.id}`}>Low at</label>
          <input
            id={`low-${v.id}`}
            className="inp"
            inputMode="numeric"
            placeholder={v.ownLowStockThreshold === null ? `${v.lowStockThreshold} (default)` : "Default"}
            value={d.low}
            onChange={(e) => onChange({ low: e.target.value.replace(/[^\d]/g, "") })}
          />
        </div>
        <div className="fld">
          <label htmlFor={`st-${v.id}`}>Status</label>
          <select id={`st-${v.id}`} className="sel inp" value={d.status} onChange={(e) => onChange({ status: e.target.value as ProductStatus })}>
            {(["ACTIVE", "DRAFT", "INACTIVE", "ARCHIVED"] as const).map((s) => (
              <option key={s} value={s}>{PRODUCT_STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>
      </div>
      {problem ? <span className="err-text">{problem}</span> : null}
      <details>
        <summary className="sub" style={{ cursor: "pointer" }}>
          SEO, cost and images ({images.length})
        </summary>
        <dl className="kv" style={{ marginTop: 8 }}>
          <dt>Slug</dt>
          <dd>{v.urlSlug ? <code>{v.urlSlug}</code> : "—"}</dd>
          <dt>SEO title</dt>
          <dd>{v.seoTitle ?? "—"}</dd>
          <dt>Meta description</dt>
          <dd className="sub">{v.metaDescription ?? "—"}</dd>
          <dt>Tax code</dt>
          <dd>{v.taxCode ?? "—"}</dd>
          <dt>Cost</dt>
          <dd>{money(v.cost)}</dd>
        </dl>
        {images.length ? (
          <ul className="imgs">
            {images.map((i, n) => (
              <li key={`${i.url}-${n}`}>
                <span className={`pill ${i.checkStatus === "BROKEN" ? "p-bad" : i.checkStatus === "OK" ? "p-ok" : "p-grey"}`}>
                  {i.checkStatus === "BROKEN" ? "Broken" : i.checkStatus === "OK" ? "OK" : "Not checked"}
                </span>
                <div>
                  <a className="sub url" href={i.url} target="_blank" rel="noreferrer">{i.url}</a>
                  {i.checkError ? <span className="err-text">{i.checkError}</span> : null}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </details>
    </div>
  );
}
