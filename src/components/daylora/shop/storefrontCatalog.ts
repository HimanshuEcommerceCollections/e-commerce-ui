import publicProductService from "@/services/public/product.service";
import type { ProductSummaryResponse } from "@/types/api/product.types";
import { groupByParent, stockState, type ListingProduct, type StockState } from "./catalog";

/**
 * The live catalog for the homepage rails and header search suggestions.
 * One request (size ≤ 2000, CONTRACT §4) per page load, shared by every caller.
 */
let cached: ListingProduct[] | null = null;
let pending: Promise<ListingProduct[]> | null = null;

export function loadStorefrontCatalog(): Promise<ListingProduct[]> {
  if (cached) return Promise.resolve(cached);
  pending ??= (async () => {
    const all: ProductSummaryResponse[] = [];
    for (let page = 0; ; page++) {
      const res = await publicProductService.getAll({ page, size: 2000, sort: "createdAt,desc" });
      const data = res.data.data;
      if (!data) break;
      all.push(...data.content);
      if (page + 1 >= data.totalPages) break;
    }
    cached = groupByParent(all);
    return cached;
  })().catch((e) => {
    pending = null; // let a later caller retry
    throw e;
  });
  return pending;
}

/** Everything a product card shows, worked out once per parent product. */
export interface CardModel {
  id: string;
  /** SKU added straight to the cart when the product has one variant. */
  skuId: string;
  brand: string;
  name: string;
  /** "Mid Wash · 5 sizes", "Charcoal", "3 colors". */
  variant: string;
  price: number;
  was: number | null;
  savePct: number;
  stock: number;
  stockState: StockState;
  /** Threshold-aware stock line: "In stock", "Only 3 left", "Out of stock". */
  stockLabel: string;
  image: string | null;
  icon: string;
  href: string;
  variantCount: number;
  /** "Choose size" when sizes differ, "Choose options" otherwise. */
  chooseLabel: string;
  isNew: boolean;
  departmentSlug: string | null;
  productType: string | null;
}

/** Highest saving among the variants, as a fraction of MRP. */
export function bestDiscount(p: ListingProduct): number {
  return p.variants.reduce((best, v) => (v.mrp && v.mrp > v.price ? Math.max(best, (v.mrp - v.price) / v.mrp) : best), 0);
}

export function toCardModel(p: ListingProduct, icon: string, opts: { dealPrice?: boolean } = {}): CardModel {
  const inStock = p.variants.filter((v) => v.stockQuantity > 0);
  const pool = inStock.length ? inStock : p.variants;
  // Price shown: the cheapest variant, or for a deal the variant with the biggest saving.
  const priced = opts.dealPrice
    ? [...pool].sort((a, b) => disc(b) - disc(a) || a.price - b.price)[0]
    : [...pool].sort((a, b) => a.price - b.price)[0];
  const was = priced.mrp && priced.mrp > priced.price ? priced.mrp : null;
  const lead = p.variants.find((v) => v.id === p.leadId) ?? p.variants[0];

  const parts: string[] = [];
  if (p.variants.length > 1) {
    if (p.colors.length > 1) parts.push(`${p.colors.length} colors`);
    else if (p.colors[0]) parts.push(p.colors[0]);
    if (p.sizes.length > 1) parts.push(`${p.sizes.length} sizes`);
    else if (p.sizes[0]) parts.push(p.sizes[0]);
    if (!parts.length) parts.push(`${p.variants.length} options`);
  } else {
    const v = p.variants[0];
    parts.push(v.variantName || [v.color, v.size].filter(Boolean).join(" · "));
  }

  const threshold = lead.lowStockThreshold;
  const state = stockState(p.stock, threshold);
  return {
    id: p.parentId,
    skuId: lead.id,
    brand: p.brand ?? "",
    name: p.name,
    variant: parts.filter(Boolean).join(" · "),
    price: priced.price,
    was,
    savePct: was ? Math.round(((was - priced.price) / was) * 100) : 0,
    stock: p.stock,
    stockState: state,
    stockLabel: state === "out" ? "Out of stock" : state === "low" ? `Only ${p.stock} left` : "In stock",
    image: priced.primaryImageUrl ?? p.image,
    icon,
    href: p.href,
    variantCount: p.variants.length,
    chooseLabel: p.sizes.length > 1 ? "Choose size" : "Choose options",
    isNew: p.isNew,
    departmentSlug: lead.categorySlug ?? null,
    productType: p.productType,
  };
}

const disc = (v: ProductSummaryResponse) => (v.mrp && v.mrp > v.price ? (v.mrp - v.price) / v.mrp : 0);
