"use client";
import { useEffect, useState } from "react";
import adminService from "@/services/admin/admin.service";
import publicCategoryService from "@/services/public/category.service";
import { getApiErrorMessage } from "@/lib/apiError";
import type { CategoryTreeNode } from "@/types/api/category.types";
import type { ProductStatus } from "@/types/api/common.types";
import type { AdminProductCreate } from "@/types/api/admin.types";
import { Drawer, Icon, PRODUCT_STATUS_LABEL, toast } from "./ui";

type VariantDraft = {
  key: number;
  sku: string;
  color: string;
  size: string;
  variantName: string;
  price: string;
  mrp: string;
  taxRate: string;
  stock: string;
  low: string;
  images: string;
};

let nextKey = 1;
const blankVariant = (): VariantDraft => ({
  key: nextKey++,
  sku: "",
  color: "",
  size: "",
  variantName: "",
  price: "",
  mrp: "",
  taxRate: "",
  stock: "0",
  low: "",
  images: "",
});

const num = (s: string) => (s.trim() === "" ? undefined : Number(s));
const urls = (s: string) =>
  s
    .split(/[\n,]+/)
    .map((u) => u.trim())
    .filter(Boolean);

/** Problems with one variant, or null. The server validates again with the import rules. */
function variantProblem(v: VariantDraft): string | null {
  const price = num(v.price);
  const mrp = num(v.mrp);
  const tax = num(v.taxRate);
  const stock = num(v.stock);
  const low = num(v.low);
  if (price === undefined || !(price > 0)) return "Selling price must be greater than 0.";
  if (mrp !== undefined && (Number.isNaN(mrp) || mrp < price)) return "MRP can't be below the selling price.";
  if (tax !== undefined && (Number.isNaN(tax) || tax < 0 || tax > 100)) return "Tax rate is a percent from 0 to 100.";
  if (stock === undefined || !Number.isInteger(stock) || stock < 0) return "Stock must be a whole number, 0 or more.";
  if (low !== undefined && (!Number.isInteger(low) || low < 0)) return "Low-stock level must be a whole number.";
  const list = urls(v.images);
  if (!list.length) return "Add at least one image URL (FR-IM-03).";
  if (list.some((u) => !/^https?:\/\//i.test(u))) return "Image URLs must start with http:// or https://.";
  if (list.length > 5) return "At most 5 image URLs per SKU.";
  return null;
}

let treeCache: CategoryTreeNode[] | null = null;

/**
 * Manual product entry (FR-AD-01): one parent with one or more variant SKUs.
 * The catalog still loads through the import (FR-IM-01); this is for single additions.
 * A blank SKU is generated from the category codes (GS-CL-MEN-001-BLK-M).
 */
export default function AddProduct({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (parentId: string) => void }) {
  const [tree, setTree] = useState<CategoryTreeNode[]>(treeCache ?? []);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [productType, setProductType] = useState("");
  const [status, setStatus] = useState<ProductStatus>("DRAFT");
  const [featured, setFeatured] = useState(false);
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [variants, setVariants] = useState<VariantDraft[]>([blankVariant()]);
  const [error, setError] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || treeCache) return;
    publicCategoryService
      .getTree()
      .then((r) => {
        treeCache = r.data.data ?? [];
        setTree(treeCache);
      })
      .catch(() => setError("Couldn't load the categories."));
  }, [open]);

  // A fresh form each time the drawer opens.
  useEffect(() => {
    if (!open) return;
    setName("");
    setBrand("");
    setCategoryId("");
    setSubcategoryId("");
    setProductType("");
    setStatus("DRAFT");
    setFeatured(false);
    setShortDescription("");
    setDescription("");
    setVariants([blankVariant()]);
    setError(null);
    setRowErrors({});
    setTried(false);
  }, [open]);

  const subcategories = tree.find((c) => c.id === categoryId)?.subcategories ?? [];
  const setV = (key: number, patch: Partial<VariantDraft>) =>
    setVariants((vs) => vs.map((v) => (v.key === key ? { ...v, ...patch } : v)));

  const save = async () => {
    setTried(true);
    setRowErrors({});
    if (!name.trim()) return setError("Product name is required.");
    if (!subcategoryId) return setError("Choose a category and subcategory (FR-IM-04).");
    const bad = variants.findIndex((v) => variantProblem(v));
    if (bad >= 0) return setError(`Variant ${bad + 1}: ${variantProblem(variants[bad])}`);
    const skus = variants.map((v) => v.sku.trim().toUpperCase()).filter(Boolean);
    if (new Set(skus).size !== skus.length) return setError("Two variants have the same SKU (FR-IM-05).");
    setError(null);
    const body: AdminProductCreate = {
      name: name.trim(),
      brand: brand.trim() || undefined,
      subcategoryId,
      productType: productType.trim() || undefined,
      shortDescription: shortDescription.trim() || undefined,
      description: description.trim() || undefined,
      status,
      featured,
      variants: variants.map((v) => ({
        sku: v.sku.trim() || undefined,
        variantName: v.variantName.trim() || undefined,
        color: v.color.trim() || undefined,
        size: v.size.trim() || undefined,
        price: Number(v.price),
        mrp: num(v.mrp),
        taxRate: num(v.taxRate),
        stockQuantity: Number(v.stock),
        lowStockThreshold: num(v.low),
        imageUrls: urls(v.images),
      })),
    };
    setSaving(true);
    try {
      const res = await adminService.createProduct(body);
      const p = res.data.data!;
      toast(`${p.name} added · ${p.variants.length} SKU${p.variants.length === 1 ? "" : "s"}`);
      onCreated(p.id);
    } catch (err) {
      // Per-variant problems come back as { "variants[i]": reason }.
      const fields = (err as { response?: { data?: { data?: Record<string, string> } } })?.response?.data?.data;
      const perRow: Record<number, string> = {};
      if (fields && typeof fields === "object") {
        for (const [k, reason] of Object.entries(fields)) {
          const m = /^variants\[(\d+)\]$/.exec(k);
          if (m) perRow[Number(m[1])] = reason;
        }
      }
      setRowErrors(perRow);
      const first = Object.entries(fields ?? {})[0];
      setError(
        Object.keys(perRow).length
          ? "Some variants need fixing; see below."
          : first
            ? `${first[0]}: ${first[1]}`
            : getApiErrorMessage(err, "Couldn't add the product")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Add product"
      sub="One product with its variant SKUs. To add many, use Import products."
      foot={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? "Adding…" : "Add product"}
          </button>
        </>
      }
    >
      {error ? (
        <div className="note warn" role="alert">
          <Icon name="info" />
          <span>{error}</span>
        </div>
      ) : null}
      <div className="form">
        <div className="fld">
          <label htmlFor="apName">Product name <span className="req">*</span></label>
          <input className={`inp ${tried && !name.trim() ? "bad" : ""}`} id="apName" value={name} onChange={(e) => setName(e.target.value)} maxLength={255} />
        </div>
        <div className="row2">
          <div className="fld">
            <label htmlFor="apCat">Category <span className="req">*</span></label>
            <select
              className={`sel inp ${tried && !categoryId ? "bad" : ""}`}
              id="apCat"
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
            <label htmlFor="apSub">Subcategory <span className="req">*</span></label>
            <select
              className={`sel inp ${tried && !subcategoryId ? "bad" : ""}`}
              id="apSub"
              value={subcategoryId}
              disabled={!categoryId}
              onChange={(e) => setSubcategoryId(e.target.value)}
            >
              <option value="">{categoryId ? "Choose…" : "Pick a category first"}</option>
              {subcategories.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="row2">
          <div className="fld">
            <label htmlFor="apBrand">Brand</label>
            <input className="inp" id="apBrand" value={brand} onChange={(e) => setBrand(e.target.value)} />
          </div>
          <div className="fld">
            <label htmlFor="apType">Product type</label>
            <input className="inp" id="apType" value={productType} onChange={(e) => setProductType(e.target.value)} placeholder="e.g. Jeans" />
          </div>
        </div>
        <div className="row2">
          <div className="fld">
            <label htmlFor="apStatus">Status</label>
            <select className="sel inp" id="apStatus" value={status} onChange={(e) => setStatus(e.target.value as ProductStatus)}>
              {(["DRAFT", "ACTIVE", "INACTIVE"] as const).map((s) => (
                <option key={s} value={s}>{PRODUCT_STATUS_LABEL[s]}</option>
              ))}
            </select>
            <span className="hint">Draft stays hidden from the storefront.</span>
          </div>
          <div className="fld" style={{ justifyContent: "center" }}>
            <label className="switch">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
              Featured on the homepage
            </label>
          </div>
        </div>
        <div className="fld">
          <label htmlFor="apShort">Short description</label>
          <textarea className="inp" id="apShort" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} maxLength={1000} />
        </div>
        <div className="fld">
          <label htmlFor="apDesc">Long description</label>
          <textarea className="inp" id="apDesc" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>

      <div className="d-sec">
        <h3>Variants ({variants.length} SKU{variants.length === 1 ? "" : "s"})</h3>
        <div className="items">
          {variants.map((v, i) => {
            const problem = tried ? variantProblem(v) : null;
            const server = rowErrors[i];
            return (
              <div className="vedit" key={v.key}>
                <div className="vedit-h">
                  <strong>Variant {i + 1}</strong>
                  {variants.length > 1 ? (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setVariants((vs) => vs.filter((x) => x.key !== v.key))}
                      aria-label={`Remove variant ${i + 1}`}
                    >
                      <Icon name="trash" size={16} />
                      Remove
                    </button>
                  ) : null}
                </div>
                <div className="vgrid">
                  <div className="fld">
                    <label htmlFor={`sku-${v.key}`}>SKU</label>
                    <input className="inp" id={`sku-${v.key}`} value={v.sku} onChange={(e) => setV(v.key, { sku: e.target.value })} placeholder="Generated if blank" />
                  </div>
                  <div className="fld">
                    <label htmlFor={`col-${v.key}`}>Colour</label>
                    <input className="inp" id={`col-${v.key}`} value={v.color} onChange={(e) => setV(v.key, { color: e.target.value })} />
                  </div>
                  <div className="fld">
                    <label htmlFor={`size-${v.key}`}>Size</label>
                    <input className="inp" id={`size-${v.key}`} value={v.size} onChange={(e) => setV(v.key, { size: e.target.value })} />
                  </div>
                  <div className="fld">
                    <label htmlFor={`pr-${v.key}`}>Selling price *</label>
                    <input className="inp" id={`pr-${v.key}`} inputMode="decimal" value={v.price} onChange={(e) => setV(v.key, { price: e.target.value })} />
                  </div>
                  <div className="fld">
                    <label htmlFor={`mrp-${v.key}`}>MRP</label>
                    <input className="inp" id={`mrp-${v.key}`} inputMode="decimal" value={v.mrp} onChange={(e) => setV(v.key, { mrp: e.target.value })} />
                  </div>
                  <div className="fld">
                    <label htmlFor={`tax-${v.key}`}>Tax %</label>
                    <input className="inp" id={`tax-${v.key}`} inputMode="decimal" value={v.taxRate} onChange={(e) => setV(v.key, { taxRate: e.target.value })} />
                  </div>
                  <div className="fld">
                    <label htmlFor={`stk-${v.key}`}>Stock *</label>
                    <input className="inp" id={`stk-${v.key}`} inputMode="numeric" value={v.stock} onChange={(e) => setV(v.key, { stock: e.target.value.replace(/[^\d]/g, "") })} />
                  </div>
                  <div className="fld">
                    <label htmlFor={`low-${v.key}`}>Low at</label>
                    <input className="inp" id={`low-${v.key}`} inputMode="numeric" value={v.low} placeholder="Default" onChange={(e) => setV(v.key, { low: e.target.value.replace(/[^\d]/g, "") })} />
                  </div>
                  <div className="fld">
                    <label htmlFor={`vn-${v.key}`}>Variant name</label>
                    <input className="inp" id={`vn-${v.key}`} value={v.variantName} onChange={(e) => setV(v.key, { variantName: e.target.value })} placeholder="Colour / size" />
                  </div>
                </div>
                <div className="fld">
                  <label htmlFor={`img-${v.key}`}>Image URLs * <span className="hint">(one per line, up to 5)</span></label>
                  <textarea
                    className="inp"
                    id={`img-${v.key}`}
                    value={v.images}
                    onChange={(e) => setV(v.key, { images: e.target.value })}
                    placeholder="https://cdn.example.com/products/GS-CL-MEN-001-01.jpg"
                  />
                </div>
                {problem || server ? <span className="err-text" role="alert">{server ?? problem}</span> : null}
              </div>
            );
          })}
        </div>
        <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => setVariants((vs) => [...vs, { ...blankVariant(), price: vs[vs.length - 1]?.price ?? "", mrp: vs[vs.length - 1]?.mrp ?? "", taxRate: vs[vs.length - 1]?.taxRate ?? "" }])}>
          <Icon name="plus" size={16} />
          Add variant
        </button>
        <p className="sub" style={{ marginTop: 8 }}>
          Image URLs are checked after saving; a broken one is flagged, not rejected (FR-IM-08).
        </p>
      </div>
    </Drawer>
  );
}
