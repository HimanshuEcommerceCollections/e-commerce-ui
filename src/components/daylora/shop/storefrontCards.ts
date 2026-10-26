import publicProductService from "@/services/public/product.service";
import type { ProductCard, ProductSearchResponse } from "@/types/api/product.types";
import { deptIcon } from "./departments";

/**
 * Product cards from the server-side search (CONTRACT A1): the homepage rails,
 * the listing page, the PDP's "More in …" rail and the header suggestions all
 * page through GET /api/products/search instead of downloading the catalog.
 */

/** Everything a product card shows, worked out once per parent product. */
export interface CardModel {
  id: string;
  /** SKU added straight to the cart (and saved) when the product has one variant. */
  skuId: string;
  brand: string;
  name: string;
  /** "Mid Wash · 5 sizes", "Charcoal", "3 colors". */
  variant: string;
  /** Lowest buyable price. */
  price: number;
  maxPrice: number;
  was: number | null;
  savePct: number;
  stock: number;
  stockState: "in" | "low" | "out";
  /** "In stock", "Only 3 left", "Out of stock". */
  stockLabel: string;
  image: string | null;
  icon: string;
  href: string;
  variantCount: number;
  /** "Choose size" when sizes differ, "Choose options" otherwise. */
  chooseLabel: string;
  isNew: boolean;
  departmentSlug: string | null;
  sectionSlug: string | null;
  productType: string | null;
  colors: { name: string; hex: string | null; imageUrl: string | null }[];
  sizes: string[];
  ratingAvg: number;
  ratingCount: number;
}

export function toCard(p: ProductCard): CardModel {
  const colors = p.colors ?? [];
  const sizes = p.sizes ?? [];
  const parts: string[] = [];
  if (p.variantCount > 1) {
    if (colors.length > 1) parts.push(`${colors.length} colors`);
    else if (colors[0]) parts.push(colors[0].name);
    if (sizes.length > 1) parts.push(`${sizes.length} sizes`);
    else if (sizes[0]) parts.push(sizes[0]);
    if (!parts.length) parts.push(`${p.variantCount} options`);
  } else {
    parts.push(...[colors[0]?.name, sizes[0]].filter((v): v is string => !!v));
  }
  const price = Number(p.minPrice);
  const mrp = p.mrp != null ? Number(p.mrp) : null;
  const was = mrp && mrp > price ? mrp : null;
  const state = p.stock <= 0 ? "out" : p.lowStock ? "low" : "in";
  return {
    id: p.parentId,
    skuId: p.productId,
    brand: p.brand ?? "",
    name: p.name,
    variant: parts.join(" · "),
    price,
    maxPrice: Number(p.maxPrice ?? p.minPrice),
    was,
    savePct: was ? p.discountPercent ?? Math.round(((was - price) / was) * 100) : 0,
    stock: p.stock,
    stockState: state,
    stockLabel: state === "out" ? "Out of stock" : state === "low" ? `Only ${p.stock} left` : "In stock",
    image: p.imageUrl,
    icon: deptIcon(p.department?.slug),
    href: `/product/${p.slug || p.productId}`,
    variantCount: p.variantCount,
    chooseLabel: sizes.length > 1 ? "Choose size" : "Choose options",
    isNew: p.isNew,
    departmentSlug: p.department?.slug ?? null,
    sectionSlug: p.section?.slug ?? null,
    productType: p.productType,
    colors,
    sizes,
    ratingAvg: Number(p.ratingAvg ?? 0),
    ratingCount: p.ratingCount ?? 0,
  };
}

export type SearchQuery = Record<string, string | number | boolean | (string | number)[] | null | undefined>;

/** Query object → URLSearchParams, repeating array values and dropping empty ones. */
export function toSearchParams(q: SearchQuery): URLSearchParams {
  const u = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => {
    if (v == null || v === false || v === "") return;
    if (Array.isArray(v)) v.forEach((x) => u.append(k, String(x)));
    else u.set(k, v === true ? "1" : String(v));
  });
  return u;
}

export async function searchProducts(q: SearchQuery | URLSearchParams): Promise<ProductSearchResponse> {
  const res = await publicProductService.search(q instanceof URLSearchParams ? q : toSearchParams(q));
  const data = res.data.data;
  return data ?? { items: [], total: 0, page: 0, size: 0, facets: {}, search: null };
}

/** The new-arrivals rule, shared by the homepage rail and /catalog?new=1 (server: created within 30 days). */
export const NEW_ARRIVALS: SearchQuery = { new: 1, sort: "new" };

/** "Rated 4.6 out of 5, 12 reviews". */
export const ratingLabel = (avg: number, count: number) =>
  `Rated ${(Math.round(avg * 10) / 10).toString()} out of 5, ${count} review${count === 1 ? "" : "s"}`;
