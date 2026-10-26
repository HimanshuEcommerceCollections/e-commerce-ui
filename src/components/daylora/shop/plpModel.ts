import type { ListingProduct } from "./catalog";
import { colorHex, compareSizes } from "./catalog";
import type { CardModel as LegacyCard } from "./storefrontCatalog";
import type { CardModel } from "./storefrontCards";

/**
 * Listing page model (design 02): the facets each department offers
 * (FR-ST-04), their URL keys and labels, sorting (FR-ST-05) and the size and
 * value ordering. Filtering, counting, sorting and keyword search with
 * spelling correction (FR-ST-08) run on the server (GET /api/products/search),
 * which uses these same facet keys and search modes.
 */

/** The parent product's category attribute sheet, keyed as the URL facet. */
export const ATTR_FACETS = {
  fit: "Fit",
  material: "Material",
  conn: "Connectivity",
  diet: "Dietary",
  skin: "Skin & hair type",
  format: "Format",
  age: "Age",
  activity: "Activity",
  occasion: "Occasion",
} as const;
export type AttrKey = keyof typeof ATTR_FACETS;

/* --------------------------------------------------------------- facets */

/** URL facet keys. `sec` (section) and `d` (department) are `g` and `dept` in the API. */
export type FacetKey = "sec" | "d" | "type" | "size" | "color" | "price" | "brand" | AttrKey;

/** The search API's name for a URL facet key. */
export const apiFacetKey = (k: FacetKey) => (k === "sec" ? "g" : k === "d" ? "dept" : k);

export const PRICES = [
  { k: "u10", t: "Under $10" },
  { k: "10-25", t: "$10 – $25" },
  { k: "25-50", t: "$25 – $50" },
  { k: "50-100", t: "$50 – $100" },
  { k: "o100", t: "$100 & over" },
];

/** Which filters each department offers (the design's DEPT config, from the PRD attribute sheets). */
const DEPT_FACETS: Record<string, { gLabel: string; facets: FacetKey[] }> = {
  clothing: { gLabel: "Gender", facets: ["type", "size", "color", "price", "brand", "fit", "material"] },
  electronics: { gLabel: "Section", facets: ["type", "price", "brand", "color", "conn"] },
  "home-kitchen": { gLabel: "Section", facets: ["type", "price", "brand", "color", "material"] },
  grocery: { gLabel: "Section", facets: ["type", "price", "brand", "diet"] },
  beauty: { gLabel: "Section", facets: ["type", "price", "brand", "skin"] },
  "books-stationery": { gLabel: "Section", facets: ["type", "price", "brand", "format"] },
  "toys-kids": { gLabel: "Section", facets: ["type", "price", "brand", "age"] },
  "sports-fitness": { gLabel: "Section", facets: ["type", "price", "brand", "color", "activity"] },
  lifestyle: { gLabel: "Section", facets: ["type", "price", "brand", "occasion"] },
};
const OTHER_DEPT = { gLabel: "Section", facets: ["type", "price", "brand", "color"] as FacetKey[] };
const ALL_CFG = { gLabel: "Section", facets: ["d", "price", "brand"] as FacetKey[] };
const SEARCH_CFG = { gLabel: "Section", facets: ["d", "type", "price", "brand"] as FacetKey[] };

export function facetConfig(opts: { search: boolean; dept: string | null }) {
  if (opts.search && !opts.dept) return SEARCH_CFG;
  if (!opts.dept) return ALL_CFG;
  return DEPT_FACETS[opts.dept] ?? OTHER_DEPT;
}

export function facetLabel(k: FacetKey, gLabel: string): string {
  if (k === "sec") return gLabel;
  if (k === "d") return "Department";
  if (k === "type") return "Category";
  if (k in ATTR_FACETS) return ATTR_FACETS[k as AttrKey];
  return k.charAt(0).toUpperCase() + k.slice(1);
}

export type Selection = Partial<Record<FacetKey, Set<string>>>;

export interface Toggles {
  stock: boolean;
  sale: boolean;
}

/** Size options grouped as in the design: letter sizes, waist, women's numeric. */
const LETTERS = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "2XL", "3XL"];
export function sizeGroups(values: string[]): { title: string; sizes: string[] }[] {
  const letters: string[] = [], waist: string[] = [], numeric: string[] = [], other: string[] = [];
  values.forEach((v) => {
    const n = Number(v);
    if (LETTERS.includes(v.toUpperCase())) letters.push(v);
    else if (!Number.isNaN(n) && n >= 24) waist.push(v);
    else if (!Number.isNaN(n)) numeric.push(v);
    else other.push(v);
  });
  return [
    { title: "Letter sizes", sizes: letters.sort(compareSizes) },
    { title: "Waist (jeans & pants)", sizes: waist.sort(compareSizes) },
    { title: "Women's numeric", sizes: numeric.sort(compareSizes) },
    { title: "Other sizes", sizes: other.sort(compareSizes) },
  ].filter((g) => g.sizes.length);
}

/** Option order inside a facet. */
export function orderValues(k: FacetKey, vals: string[]): string[] {
  if (k === "price") return PRICES.map((r) => r.k).filter((v) => vals.includes(v));
  if (k === "fit") {
    const order = ["Slim", "Regular", "Relaxed"];
    return [...vals].sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99) || a.localeCompare(b));
  }
  if (k === "age") return [...vals].sort((a, b) => parseInt(a) - parseInt(b));
  if (k === "size") return [...vals].sort(compareSizes);
  return [...vals].sort((a, b) => a.localeCompare(b));
}

/* ----------------------------------------------------------------- sort */

/** FR-ST-05. */
export const SORTS = [
  { k: "rel", t: "Relevance" },
  { k: "pop", t: "Best selling" },
  { k: "new", t: "Newest" },
  { k: "asc", t: "Price: low to high" },
  { k: "desc", t: "Price: high to low" },
] as const;
export type SortKey = (typeof SORTS)[number]["k"];
export const isSort = (s: string | null): s is SortKey => SORTS.some((x) => x.k === s);

/* ---------------------------------------------------------------- icons */

/** Swatch-free product-type icons (design TYPE_ICON); others use the department's. */
export const TYPE_ICON: Record<string, string> = {
  "T-shirts & polos": "shirt", Tops: "shirt", Shirts: "shirt", Activewear: "shirt", "Sleep & lounge": "shirt",
  Jeans: "pants", "Pants & shorts": "pants", Bottoms: "pants", Dresses: "dress",
  "Sweaters & hoodies": "hoodie", "Jackets & coats": "jacket",
};

/** Department card tints for products without a photo (design DEPT_TINT). */
export const DEPT_TINT: Record<string, string> = {
  electronics: "#DCE3EC", "home-kitchen": "#ECE6DC", grocery: "#E4EEDC", beauty: "#F1E3E4",
  "books-stationery": "#E6E3EF", "toys-kids": "#F3ECD6", "sports-fitness": "#DCEBE6", lifestyle: "#EFE4DA",
};

/* --------------------------------------------------------------- legacy */

/**
 * The listing card's former input (a parent built from downloaded SKUs).
 * Kept so callers that still build one keep working; new code passes a
 * CardModel from `toCard()` instead.
 */
export interface PlpItem {
  p: ListingProduct;
  card: LegacyCard;
  dept: string | null;
  deptName: string | null;
  sec: string | null;
  secName: string | null;
  type: string | null;
  brand: string | null;
  prices: number[];
  attrs: Partial<Record<AttrKey, string[]>>;
  isNew: boolean;
  onSale: boolean;
  discount: number;
}

export function itemToCard(x: PlpItem): CardModel {
  return {
    ...x.card,
    maxPrice: Math.max(x.card.price, ...x.prices),
    sectionSlug: x.sec,
    colors: x.p.colors.map((name) => ({ name, hex: colorHex(name), imageUrl: null })),
    sizes: x.p.sizes,
    ratingAvg: 0,
    ratingCount: 0,
  };
}
