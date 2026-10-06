import type { ListingProduct } from "./catalog";
import { compareSizes } from "./catalog";
import { toCardModel, type CardModel } from "./storefrontCatalog";
import { deptIcon } from "./departments";

/**
 * Listing page model (design 02): one item per parent product, the facets each
 * department offers (FR-ST-04), sorting (FR-ST-05) and keyword search with
 * relevance (FR-ST-08). Pure functions, so ~1,000 SKUs filter in a few ms.
 */

/* ---------------------------------------------------------------- items */

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

export interface PlpItem {
  p: ListingProduct;
  card: CardModel;
  dept: string | null;
  deptName: string | null;
  sec: string | null;
  secName: string | null;
  type: string | null;
  brand: string | null;
  /** Prices of the variants a shopper can buy (all variants when none are in stock). */
  prices: number[];
  attrs: Partial<Record<AttrKey, string[]>>;
  isNew: boolean;
  onSale: boolean;
  /** Fraction off MRP on the card price, for the deals sort. */
  discount: number;
}

const split = (v: string | null | undefined) =>
  v ? v.split(/\s*,\s*/).map((s) => s.trim()).filter(Boolean) : [];

export function toItem(p: ListingProduct): PlpItem {
  const lead = p.variants.find((v) => v.id === p.leadId) ?? p.variants[0];
  const card = toCardModel(p, deptIcon(lead.categorySlug));
  const attrs: Partial<Record<AttrKey, string[]>> = {};
  const sheet = lead.attributes ?? {};
  (Object.keys(ATTR_FACETS) as AttrKey[]).forEach((k) => {
    const vals = split(sheet[ATTR_FACETS[k]]);
    if (k === "material" && !vals.length) {
      vals.push(...Array.from(new Set(p.variants.map((v) => v.material).filter((m): m is string => !!m))));
    }
    if (vals.length) attrs[k] = vals;
  });
  const buyable = p.variants.filter((v) => v.stockQuantity > 0);
  return {
    p,
    card,
    dept: lead.categorySlug ?? null,
    deptName: lead.categoryName ?? null,
    sec: lead.subcategorySlug ?? null,
    secName: lead.subcategoryName ?? null,
    type: p.productType,
    brand: p.brand,
    prices: Array.from(new Set((buyable.length ? buyable : p.variants).map((v) => v.price))),
    attrs,
    isNew: p.isNew,
    onSale: p.onSale,
    discount: card.was ? (card.was - card.price) / card.was : 0,
  };
}

/* --------------------------------------------------------------- facets */

export type FacetKey = "sec" | "d" | "type" | "size" | "color" | "price" | "brand" | AttrKey;

export const PRICES = [
  { k: "u10", t: "Under $10", f: (x: number) => x < 10 },
  { k: "10-25", t: "$10 – $25", f: (x: number) => x >= 10 && x < 25 },
  { k: "25-50", t: "$25 – $50", f: (x: number) => x >= 25 && x < 50 },
  { k: "50-100", t: "$50 – $100", f: (x: number) => x >= 50 && x < 100 },
  { k: "o100", t: "$100 & over", f: (x: number) => x >= 100 },
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

export function facetValues(k: FacetKey, x: PlpItem): string[] {
  switch (k) {
    case "sec": return x.sec ? [x.sec] : [];
    case "d": return x.dept ? [x.dept] : [];
    case "type": return x.type ? [x.type] : [];
    case "size": return x.p.sizes;
    case "color": return x.p.colors;
    case "price": return PRICES.filter((r) => x.prices.some(r.f)).map((r) => r.k);
    case "brand": return x.brand ? [x.brand] : [];
    default: return x.attrs[k] ?? [];
  }
}

export type Selection = Partial<Record<FacetKey, Set<string>>>;

export interface Toggles {
  stock: boolean;
  sale: boolean;
}

/** Disjunctive matching: a facet's own selection is skipped when counting its options. */
export function matches(x: PlpItem, keys: FacetKey[], sel: Selection, t: Toggles, skip?: FacetKey): boolean {
  for (const k of keys) {
    const s = sel[k];
    if (k === skip || !s || !s.size) continue;
    if (!facetValues(k, x).some((v) => s.has(v))) return false;
  }
  if (t.stock && x.card.stockState === "out") return false;
  if (t.sale && !x.onSale) return false;
  return true;
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

export function sorter(sort: SortKey, opts: { scores: Map<string, number> | null; deals: boolean }) {
  const pop = (x: PlpItem) =>
    x.p.popularity + (x.isNew ? 8 : 0) + (x.p.featured ? 4 : 0) + (opts.deals ? x.discount * 40 : 0);
  const tie = (a: PlpItem, b: PlpItem) => a.p.rank - b.p.rank;
  switch (sort) {
    case "pop": return (a: PlpItem, b: PlpItem) => b.p.popularity - a.p.popularity || tie(a, b);
    case "new": return (a: PlpItem, b: PlpItem) => b.p.createdAt - a.p.createdAt || tie(a, b);
    case "asc": return (a: PlpItem, b: PlpItem) => a.card.price - b.card.price || tie(a, b);
    case "desc": return (a: PlpItem, b: PlpItem) => b.card.price - a.card.price || tie(a, b);
    default: {
      const s = opts.scores;
      if (s) return (a: PlpItem, b: PlpItem) => (s.get(b.p.parentId) ?? 0) - (s.get(a.p.parentId) ?? 0) || tie(a, b);
      return (a: PlpItem, b: PlpItem) => pop(b) - pop(a) || tie(a, b);
    }
  }
}

/* --------------------------------------------------------------- search */

const STOP = new Set(["a", "an", "the", "and", "for", "of", "with", "in", "on", "to", "&"]);
/** US shopper words → catalog words (design). */
const SYN: Record<string, string> = {
  tee: "tshirt", tees: "tshirt", "t-shirt": "tshirt", trouser: "pant", trousers: "pant", jumper: "sweater",
  pullover: "sweater", earphone: "earbud", headset: "headphone", mens: "men", ladies: "women", womens: "women",
  lady: "women", guy: "men", sneaker: "shoe", trainer: "shoe", cellphone: "phone", mobile: "phone",
  notepad: "notebook", journal: "notebook", perfume: "parfum", cologne: "parfum", lipstick: "lip",
  tumbler: "bottle", flask: "bottle", kid: "kids", child: "kids", children: "kids", pot: "cookware",
  jean: "jeans", denims: "denim", hoody: "hoodie",
};
const stem = (w: string) => {
  w = w.toLowerCase().replace(/['’]/g, "");
  return w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w;
};
export const toks = (t: string) =>
  String(t).toLowerCase().replace(/[^a-z0-9%'’-]+/g, " ").split(/[\s-]+/).filter((w) => w && !STOP.has(w)).map(stem);
const dtoks = (t: string) => [
  ...toks(t),
  ...(String(t).toLowerCase().match(/[a-z]+-[a-z]+/g) ?? []).map((w) => stem(w.replace("-", ""))),
];

type Query = string | string[];
interface Doc { id: string; pop: number; f: [number, string[]][]; skus: string[] }

/** Field weights: a hit in the name beats one in the keywords (design). */
function docOf(x: PlpItem): Doc {
  const v = x.p.variants;
  const keywords = Array.from(new Set(v.map((s) => s.searchKeywords).filter(Boolean))).join(" ");
  const fields: [number, string][] = [
    [4, x.p.name],
    [3, x.type ?? ""],
    [3, x.brand ?? ""],
    [2, x.secName ?? ""],
    [1, x.deptName ?? ""],
    [1, x.p.colors.join(" ")],
    [1, Object.values(x.attrs).flat().join(" ")],
    [1, keywords],
  ];
  return {
    id: x.p.parentId,
    pop: x.p.popularity,
    f: fields.map(([w, t]) => [w, dtoks(t)]),
    skus: [x.p.code, ...v.map((s) => s.sku)].map((s) => s.toLowerCase()),
  };
}

const hit = (q: string, w: string) => (q.length >= 3 ? w.startsWith(q) : w === q);
function tokScore1(q: string, d: Doc) {
  let best = 0;
  d.f.forEach(([wt, ws]) => ws.forEach((w) => {
    if (w === q) best = Math.max(best, wt * 1.5);
    else if (hit(q, w)) best = Math.max(best, wt);
  }));
  return best;
}
function tokScore(q: Query, d: Doc): number {
  if (Array.isArray(q)) return Math.max(...q.map((v) => tokScore(v, d)));
  if (q.length > 3 && q.endsWith("y")) return Math.max(tokScore1(q, d), tokScore1(q.slice(0, -1) + "ie", d));
  return tokScore1(q, d);
}
function run(docs: Doc[], qt: Query[], mode: "and" | "or") {
  const out = new Map<string, number>();
  docs.forEach((d) => {
    let sc = 0, ok = 0;
    qt.forEach((q) => { const s = tokScore(q, d); if (s) { ok++; sc += s; } });
    if (mode === "and" ? ok === qt.length : ok > 0) out.set(d.id, sc + d.pop / 100 + (ok === qt.length ? 5 : 0));
  });
  return out;
}
function lev(a: string, b: string) {
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 2) return 9;
  let p = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const c = [i];
    for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    p = c;
  }
  return p[n];
}

export interface SearchResult {
  /** parentId → relevance score. */
  scores: Map<string, number>;
  mode: "exact" | "corrected" | "partial" | "none";
  /** What the results are for: the query, or its spelling correction. */
  shown: string;
}

export interface SearchIndex {
  docs: Doc[];
  vocab: Map<string, string>;
}

export function buildIndex(items: PlpItem[]): SearchIndex {
  const vocab = new Map<string, string>();
  items.forEach((x) =>
    [x.p.name, x.type, x.brand, x.secName, x.deptName, ...x.p.colors]
      .filter(Boolean)
      .join(" ")
      .split(/[^A-Za-z0-9']+/)
      .forEach((w) => {
        if (w.length > 2) {
          const k = stem(w);
          if (!vocab.has(k)) vocab.set(k, w.toLowerCase());
        }
      }),
  );
  return { docs: items.map(docOf), vocab };
}

/**
 * FR-ST-08: every word must match (AND) across name, type, brand, section,
 * department, colours, attributes and Search_Keywords; an exact SKU matches
 * too. No hits → spelling correction, then any-word matches.
 */
export function search(index: SearchIndex, raw: string, exact = false): SearchResult {
  const query = raw.trim().slice(0, 80);
  const lower = query.toLowerCase();
  const bySku = index.docs.filter((d) => d.skus.includes(lower));
  if (bySku.length) return { scores: new Map(bySku.map((d) => [d.id, 100])), mode: "exact", shown: query };

  const qt: Query[] = toks(query).map((w) => (SYN[w] ? [w, stem(SYN[w])] : w));
  if (!qt.length) return { scores: new Map(), mode: "none", shown: query };
  let res = run(index.docs, qt, "and");
  if (res.size) return { scores: res, mode: "exact", shown: query };
  if (exact) return { scores: res, mode: "none", shown: query };

  const keys = Array.from(index.vocab.keys());
  const correct = (q: string) => {
    if (keys.some((v) => hit(q, v))) return q;
    let best: string | null = null, bd = 9;
    for (const v of keys) {
      const d = lev(q, v);
      if (d < bd || (best && d === bd && v.length < best.length)) { bd = d; best = v; }
    }
    return best && bd <= (q.length > 5 ? 2 : 1) ? best : q;
  };
  const fixed = qt.map((q) => (Array.isArray(q) ? q : correct(q)));
  if (JSON.stringify(fixed) !== JSON.stringify(qt)) {
    res = run(index.docs, fixed, "and");
    if (res.size) {
      const shown = fixed.map((w) => (Array.isArray(w) ? w[0] : index.vocab.get(w) ?? w)).join(" ");
      return { scores: res, mode: "corrected", shown };
    }
  }
  if (qt.length > 1) {
    res = run(index.docs, fixed, "or");
    if (res.size) return { scores: res, mode: "partial", shown: query };
  }
  return { scores: new Map(), mode: "none", shown: query };
}

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
