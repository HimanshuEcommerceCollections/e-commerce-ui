/**
 * Clothing taxonomy from the Daylora designs: Category → Subcategory → Product type.
 *
 * The subcategory is real data: it's the second code in every SKU (PRD §4,
 * `GS-CL-MEN-001`). Product type isn't stored yet, so it's matched on words in the
 * product name until the catalog carries a Product_Type column.
 */

export interface ProductType {
  name: string;
  /** Whole words in the product name, any of which puts it in this type. */
  words: string[];
}

export interface Subcategory {
  /** URL value, `?g=men`. */
  key: string;
  label: string;
  /** Heading for the PLP, e.g. "Men's clothing". */
  title: string;
  /** SKU subcategory codes, e.g. `MEN` in `GS-CL-MEN-001`. */
  codes: string[];
  types: ProductType[];
}

const JACKETS: ProductType = { name: "Jackets & coats", words: ["jacket", "coat", "blazer", "puffer", "vest", "gilet", "parka"] };
const KNITS: ProductType = { name: "Sweaters & hoodies", words: ["sweater", "hoodie", "sweatshirt", "jumper", "cardigan", "fleece"] };

export const CLOTHING: Subcategory[] = [
  {
    key: "women",
    label: "Women",
    title: "Women's clothing",
    codes: ["WOM", "WMN"],
    types: [
      { name: "Tops", words: ["top", "blouse", "tank", "tee", "t-shirt", "shirt", "camisole"] },
      { name: "Dresses", words: ["dress", "jumpsuit"] },
      { name: "Bottoms", words: ["skirt", "trousers", "jeans", "leggings", "shorts", "pants"] },
      KNITS,
      JACKETS,
      { name: "Activewear", words: ["leggings", "bra", "training", "running", "yoga"] },
      { name: "Accessories", words: ["scarf", "hat", "beanie", "belt", "bag"] },
    ],
  },
  {
    key: "men",
    label: "Men",
    title: "Men's clothing",
    codes: ["MEN"],
    types: [
      { name: "T-shirts & polos", words: ["t-shirt", "tee", "polo", "henley"] },
      { name: "Shirts", words: ["shirt", "overshirt", "oxford"] },
      { name: "Jeans", words: ["jeans"] },
      { name: "Pants & shorts", words: ["trousers", "chino", "chinos", "shorts", "joggers", "pants"] },
      KNITS,
      JACKETS,
      { name: "Accessories", words: ["beanie", "belt", "hat", "scarf", "cap"] },
    ],
  },
  {
    key: "kids",
    label: "Kids",
    title: "Kids' clothing",
    codes: ["KID", "KDS"],
    types: [
      { name: "Tops", words: ["t-shirt", "tee", "polo", "shirt", "top"] },
      { name: "Bottoms", words: ["joggers", "dungarees", "shorts", "trousers", "jeans", "leggings"] },
      JACKETS,
    ],
  },
];

/** Subcategory of a parent product from its code: `GS-CL-MEN-001` → Men. */
export function subcategoryOf(parentCode: string): Subcategory | null {
  const code = parentCode.split("-")[2]?.toUpperCase();
  return CLOTHING.find((s) => s.codes.includes(code)) ?? null;
}

export function findSubcategory(key: string | null): Subcategory | null {
  return key ? CLOTHING.find((s) => s.key === key.toLowerCase()) ?? null : null;
}

export function matchesType(name: string, type: ProductType): boolean {
  const tokens = name.toLowerCase().split(/[\s,/()]+/);
  return type.words.some((w) => tokens.includes(w));
}

/** Catalog link for a section or product type, e.g. `/catalog?category=clothing&g=men&type=Jeans`. */
export function clothingHref(sub?: Subcategory, type?: ProductType): string {
  const q = new URLSearchParams({ category: "clothing" });
  if (sub) q.set("g", sub.key);
  if (type) q.set("type", type.name);
  return `/catalog?${q.toString()}`;
}
