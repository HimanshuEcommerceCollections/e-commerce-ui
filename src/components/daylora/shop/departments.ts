import { useEffect, useState } from "react";
import publicCategoryService from "@/services/public/category.service";
import type { CategoryTreeNode } from "@/types/api/category.types";

/**
 * Storefront departments (FR-ST-02). The live tree comes from
 * GET /api/categories/tree; the frozen taxonomy below (CONTRACT §2) is the
 * fallback while it loads or when the API is unreachable, so the header,
 * menu and footer never render empty.
 */

export interface DeptSection {
  name: string;
  slug: string;
  /** Product types with live products, e.g. "Jeans". Empty in the fallback. */
  types: string[];
}

export interface Department {
  name: string;
  /** Footer label, e.g. "Beauty". */
  shortName: string;
  slug: string;
  icon: string;
  sections: DeptSection[];
}

const ICONS: Record<string, string> = {
  clothing: "shirt",
  electronics: "audio",
  "home-kitchen": "pot",
  grocery: "apple",
  beauty: "bottle",
  "books-stationery": "book",
  "toys-kids": "blocks",
  "sports-fitness": "dumbbell",
  lifestyle: "gift",
};

const SHORT_NAMES: Record<string, string> = {
  beauty: "Beauty",
  "books-stationery": "Books",
  "sports-fitness": "Sports",
};

export const deptIcon = (slug: string | null | undefined) => (slug && ICONS[slug]) || "box";

const fallback = (name: string, slug: string, sections: [string, string][]): Department => ({
  name,
  shortName: SHORT_NAMES[slug] ?? name,
  slug,
  icon: deptIcon(slug),
  sections: sections.map(([n, s]) => ({ name: n, slug: s, types: [] })),
});

/** The frozen taxonomy, in menu order. */
export const FALLBACK_DEPARTMENTS: Department[] = [
  fallback("Clothing", "clothing", [["Women", "clothing-women"], ["Men", "clothing-men"]]),
  fallback("Electronics", "electronics", [["Audio & smart tech", "electronics-audio-smart-tech"], ["Computer & phone", "electronics-computer-phone"]]),
  fallback("Home & Kitchen", "home-kitchen", [["Kitchen", "home-kitchen-kitchen"], ["Home", "home-kitchen-home"]]),
  fallback("Grocery", "grocery", [["Pantry", "grocery-pantry"], ["Drinks & treats", "grocery-drinks-treats"]]),
  fallback("Beauty & Personal Care", "beauty", [["Beauty", "beauty-beauty"], ["Personal care", "beauty-personal-care"]]),
  fallback("Books & Stationery", "books-stationery", [["Books", "books-stationery-books"], ["Stationery", "books-stationery-stationery"]]),
  fallback("Toys & Kids", "toys-kids", [["Toys", "toys-kids-toys"], ["Kids & baby", "toys-kids-kids-baby"]]),
  fallback("Sports & Fitness", "sports-fitness", [["Fitness", "sports-fitness-fitness"], ["Outdoors", "sports-fitness-outdoors"]]),
  fallback("Lifestyle", "lifestyle", [["Gifts", "lifestyle-gifts"], ["Everyday", "lifestyle-everyday"]]),
];

function fromTree(tree: CategoryTreeNode[]): Department[] {
  return [...tree]
    .sort((a, b) => a.position - b.position)
    .map((d) => ({
      name: d.name,
      shortName: SHORT_NAMES[d.slug] ?? d.name,
      slug: d.slug,
      icon: deptIcon(d.slug),
      sections: [...(d.subcategories ?? [])]
        .sort((a, b) => a.position - b.position)
        .map((s) => ({ name: s.name, slug: s.slug, types: (s.productTypes ?? []).map((t) => t.name) })),
    }));
}

let cached: Department[] | null = null;
let pending: Promise<Department[]> | null = null;

/** The department tree, fetched once per page load and shared by every caller. */
export function loadDepartments(): Promise<Department[]> {
  if (cached) return Promise.resolve(cached);
  pending ??= publicCategoryService
    .getTree()
    .then((res) => {
      const tree = res.data.data ?? [];
      cached = tree.length ? fromTree(tree) : FALLBACK_DEPARTMENTS;
      return cached;
    })
    .catch(() => {
      pending = null; // try again on the next mount
      return FALLBACK_DEPARTMENTS;
    });
  return pending;
}

/** Departments for rendering: the fallback first, the live tree once it arrives. */
export function useDepartments(): Department[] {
  const [depts, setDepts] = useState<Department[]>(cached ?? FALLBACK_DEPARTMENTS);
  useEffect(() => {
    let live = true;
    loadDepartments().then((d) => live && setDepts(d));
    return () => {
      live = false;
    };
  }, []);
  return depts;
}

/** Catalog link (CONTRACT §7): `/catalog?dept=clothing&g=clothing-men&type=Jeans`. */
export function catalogHref(params: {
  dept?: string;
  g?: string;
  type?: string;
  q?: string;
  sort?: string;
  deals?: boolean;
  new?: boolean;
} = {}): string {
  const q = new URLSearchParams();
  if (params.dept) q.set("dept", params.dept);
  if (params.g) q.set("g", params.g);
  if (params.type) q.set("type", params.type);
  if (params.q) q.set("q", params.q);
  if (params.sort) q.set("sort", params.sort);
  if (params.deals) q.set("deals", "1");
  if (params.new) q.set("new", "1");
  const s = q.toString();
  return s ? `/catalog?${s}` : "/catalog";
}
