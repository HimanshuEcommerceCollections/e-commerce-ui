import publicProductService from "@/services/public/product.service";
import type { ProductSummaryResponse } from "@/types/api/product.types";
import { LOW_STOCK_THRESHOLD } from "../dayloraData";

export { LOW_STOCK_THRESHOLD };

/** Swatch colours for common colour names. Unknown names get a neutral swatch. */
export const COLOR_HEX: Record<string, string> = {
  Black: "#1F2328", White: "#F5F5F2", Navy: "#1E3A5F", "Heather Gray": "#9CA3AF", Gray: "#9CA3AF",
  Grey: "#9CA3AF", Charcoal: "#3F4448", Olive: "#6B7045", Khaki: "#C3A77A", Camel: "#B98A5A",
  Beige: "#D9C7A7", Cream: "#EFE6D2", Sage: "#A3B18A", Green: "#3F7D4E", Burgundy: "#7A2E3A",
  Maroon: "#7A2E3A", Blush: "#E8B4B8", Pink: "#E8A0B4", Rust: "#B5562F", Orange: "#E07A2F",
  Yellow: "#E8C547", Sky: "#BFD4EA", Blue: "#2F5DA8", "Light Wash": "#A9C1DA", "Mid Wash": "#5F7FA3",
  "Dark Rinse": "#2B3E5A", Red: "#B42318", Silver: "#C4CAD0", Gold: "#C9A54C", Brown: "#6B4A32",
  Oak: "#B98A5A", Teal: "#1F7A7A", Purple: "#6B4C9A", Indigo: "#2E3F6E", Stone: "#B8B0A2",
  Ecru: "#E6DCC5", Slate: "#5E6B78", Sand: "#D8C3A0", Mustard: "#C99A2E", Lavender: "#B8A6D9",
  Mint: "#A8D8C0", Coral: "#E8745F", Ivory: "#F4EFE2", Tan: "#C49A6C", Berry: "#8E2C55",
  Bronze: "#9C6B30", Chalk: "#EEEBE3", Cocoa: "#7A4A32", Champagne: "#E9DCC0", Wine: "#6E2436", Denim: "#4A6A8E",
};

const NEUTRAL = "#D0D5DC";

function lookupColor(name: string): string | undefined {
  const key = Object.keys(COLOR_HEX).find((k) => k.toLowerCase() === name.toLowerCase());
  return key ? COLOR_HEX[key] : undefined;
}

/**
 * Swatch for a colour name. Unknown names fall back to their words, last first:
 * "Dark Indigo" → Indigo, "Black Stripe" → Black, "Camel Check" → Camel.
 */
export function colorHex(name: string | null | undefined): string {
  if (!name) return NEUTRAL;
  const words = name.trim().split(/\s+/).reverse();
  for (const candidate of [name.trim(), ...words]) {
    const hex = lookupColor(candidate);
    if (hex) return hex;
  }
  return NEUTRAL;
}

/** Letter sizes in wearing order; anything else sorts numerically, then alphabetically. */
const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "2XL", "3XL"];

export function compareSizes(a: string, b: string): number {
  const ia = SIZE_ORDER.indexOf(a.toUpperCase());
  const ib = SIZE_ORDER.indexOf(b.toUpperCase());
  if (ia >= 0 && ib >= 0) return ia - ib;
  if (ia >= 0) return -1;
  if (ib >= 0) return 1;
  const na = parseFloat(a), nb = parseFloat(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  return a.localeCompare(b);
}

export const usd = (n: number) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export type StockState = "in" | "low" | "out";

/** In, low or out of stock, using the SKU's own low-stock threshold when it has one (FR-AD-03). */
export function stockState(qty: number, threshold?: number | null): StockState {
  if (qty <= 0) return "out";
  return qty <= (threshold ?? LOW_STOCK_THRESHOLD) ? "low" : "in";
}

const words = (value: string) =>
  value.normalize("NFKD").replace(/[^A-Za-z0-9\s]/g, " ").trim().split(/\s+/).filter(Boolean);

/**
 * Parent name from a variant SKU name, using the importer's rule: `Tee — Black, M`
 * becomes `Tee` when the trailing part names the SKU's colour or size.
 */
export function baseProductName(name: string, color: string | null, size: string | null): string {
  const match = /^(.*\S)\s*(?:\s[—–|-]\s|\()\s*([^—–|(]+?)\)?\s*$/.exec(name);
  if (!match) return name;
  const tail = ` ${words(match[2]).join(" ").toLowerCase()} `;
  const names = (v: string | null) => !!v && tail.includes(` ${words(v).join(" ").toLowerCase()} `);
  return names(color) || names(size) ? match[1] : name;
}

/** New arrivals: created within this many days. */
const NEW_DAYS = 30;

/** One PLP card: a parent product with its live variant SKUs (FR-ST-03). */
export interface ListingProduct {
  parentId: string;
  /** Parent product code, e.g. `GS-CL-MEN-001`. */
  code: string;
  name: string;
  brand: string | null;
  category: string | null;
  variants: ProductSummaryResponse[];
  /** SKU the card links to: the first in-stock variant, else the first. */
  leadId: string;
  /** The lead SKU's page, by its clean slug when it has one (NFR-04). */
  href: string;
  subcategory: string | null;
  productType: string | null;
  /** The highest MRP above the lowest price, for the struck-through price. */
  mrp: number | null;
  /** Units sold across variants (FR-ST-05 popularity). */
  popularity: number;
  /** Shown in the featured rail (FR-ST-01). */
  featured: boolean;
  image: string | null;
  minPrice: number;
  maxPrice: number;
  colors: string[];
  sizes: string[];
  stock: number;
  createdAt: number;
  isNew: boolean;
  /** Some variant is priced below its MRP. */
  onSale: boolean;
  /** Position in the API's default order, used for "Relevance". */
  rank: number;
}

export function groupByParent(skus: ProductSummaryResponse[], now = Date.now()): ListingProduct[] {
  const byParent = new Map<string, ProductSummaryResponse[]>();
  for (const s of skus) {
    const list = byParent.get(s.parentId);
    if (list) list.push(s);
    else byParent.set(s.parentId, [s]);
  }
  let rank = 0;
  return Array.from(byParent.entries()).map(([parentId, variants]) => {
    const first = variants[0];
    const lead = variants.find((v) => v.stockQuantity > 0) ?? first;
    const prices = variants.map((v) => v.price);
    const createdAt = Math.min(...variants.map((v) => Date.parse(v.createdAt)));
    const uniq = (vals: (string | null)[]) => Array.from(new Set(vals.filter((v): v is string => !!v)));
    const minPrice = Math.min(...prices);
    const mrps = variants.map((v) => v.mrp ?? 0).filter((m) => m > minPrice);
    return {
      parentId,
      code: first.parentCode,
      name: first.parentName ?? baseProductName(first.name, first.color, first.size),
      brand: first.brand,
      category: first.categoryName,
      subcategory: first.subcategoryName ?? null,
      productType: first.productType ?? null,
      variants,
      leadId: lead.id,
      href: `/product/${lead.urlSlug ?? lead.id}`,
      mrp: mrps.length ? Math.max(...mrps) : null,
      popularity: variants.reduce((n, v) => n + (v.unitsSold ?? 0), 0),
      featured: variants.some((v) => v.featured),
      image: lead.primaryImageUrl ?? variants.find((v) => v.primaryImageUrl)?.primaryImageUrl ?? null,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      colors: uniq(variants.map((v) => v.color)),
      sizes: uniq(variants.map((v) => v.size)).sort(compareSizes),
      stock: variants.reduce((n, v) => n + Math.max(0, v.stockQuantity), 0),
      createdAt,
      isNew: now - createdAt < NEW_DAYS * 86_400_000,
      onSale: variants.some((v) => !!v.mrp && v.mrp > v.price),
      rank: rank++,
    };
  });
}

/**
 * FR-ST-08: keyword search across name, brand, category, subcategory, product
 * type, the catalog's Search_Keywords, SKU and variant attributes. Every word
 * must match somewhere.
 */
export function matchesQuery(p: ListingProduct, q: string): boolean {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const hay = [
    p.name, p.brand, p.category, p.subcategory, p.productType,
    ...p.variants.flatMap((v) => [v.name, v.sku, v.color, v.size, v.variantName, v.material, v.searchKeywords]),
  ].filter(Boolean).join(" ").toLowerCase();
  return terms.every((t) => hay.includes(t));
}

/**
 * Relevance for a search: name and brand hits weigh more than keyword hits,
 * so "black tee" puts black tees above products that only mention black.
 */
export function relevance(p: ListingProduct, q: string): number {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const name = p.name.toLowerCase();
  const brand = (p.brand ?? "").toLowerCase();
  const type = (p.productType ?? "").toLowerCase();
  return terms.reduce((score, t) => score + (name.includes(t) ? 3 : 0) + (brand.includes(t) ? 2 : 0) + (type.includes(t) ? 2 : 0), 0);
}

/** Every active SKU. Pages through the API; 1,000 SKUs fit in one request. */
export async function loadAllSkus(): Promise<ProductSummaryResponse[]> {
  const all: ProductSummaryResponse[] = [];
  for (let page = 0; ; page++) {
    const res = await publicProductService.getAll({ page, size: 1000, sort: "createdAt,desc" });
    const data = res.data.data;
    if (!data) break;
    all.push(...data.content);
    if (page + 1 >= data.totalPages) break;
  }
  return all;
}
