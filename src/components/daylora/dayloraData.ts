export interface CategoryItem {
  name: string;
  shortName: string;
  icon: string;
  img?: string | null;
  href: string;
}

export interface ProductItem {
  id: string;
  brand: string;
  name: string;
  variant: string;
  price: number;
  wasPrice?: number | null;
  stock: number;
  icon: string;
  imgKey: string;
  badge?: string | null;
  href?: string;
  /** Live catalog: remote image URL (sample items use imgKey under /daylora). */
  imageUrl?: string | null;
  /** Live catalog: the SKU the card's button adds to the cart. */
  skuId?: string;
  /** Live catalog: more than one variant sends the shopper to the PDP to choose. */
  variantCount?: number;
}

export interface TrustItem {
  title: string;
  description: string;
  icon: string;
}

export const BRAND_NAME = "Ecommerce Collections";
export const LOW_STOCK_THRESHOLD = 5;

export const CATEGORIES: CategoryItem[] = [
  { name: "Clothing", shortName: "Clothing", icon: "shirt", img: "/daylora/denim-jacket.jpg", href: "/catalog?dept=clothing" },
  { name: "Electronics", shortName: "Electronics", icon: "audio", img: "/daylora/headphones-red.jpg", href: "/catalog?dept=electronics" },
  { name: "Home & Kitchen", shortName: "Home & Kitchen", icon: "pot", img: "/daylora/cookware.jpg", href: "/catalog?dept=home-kitchen" },
  { name: "Grocery", shortName: "Grocery", icon: "apple", img: null, href: "/catalog?dept=grocery" },
  { name: "Beauty & Personal Care", shortName: "Beauty", icon: "bottle", img: "/daylora/skincare.jpg", href: "/catalog?dept=beauty" },
  { name: "Books & Stationery", shortName: "Books", icon: "book", img: null, href: "/catalog?dept=books-stationery" },
  { name: "Toys & Kids", shortName: "Toys & Kids", icon: "blocks", img: null, href: "/catalog?dept=toys-kids" },
  { name: "Sports & Fitness", shortName: "Sports", icon: "dumbbell", img: "/daylora/yoga-mat.jpg", href: "/catalog?dept=sports-fitness" },
  { name: "Lifestyle", shortName: "Lifestyle", icon: "gift", img: "/daylora/lamp.jpg", href: "/catalog?dept=lifestyle" },
];

/** "$35" / "$35.50": the free-shipping threshold as the shell shows it. */
const wholeUsd = (n: number) => "$" + (Number.isInteger(n) ? String(n) : n.toFixed(2));

/** Free-shipping copy from the store's threshold (store config); null when shipping is never free. */
export function shippingPromise(threshold: number | string | null | undefined): { short: string; title: string } | null {
  if (threshold == null) return null;
  const n = Number(threshold);
  if (!Number.isFinite(n)) return null;
  if (n <= 0) return { short: "on every order", title: "Free shipping on every order" };
  return { short: `on orders ${wholeUsd(n)}+`, title: `Free shipping on ${wholeUsd(n)}+` };
}

/** Trust band; the shipping and returns titles come from the store config (see DayloraTrust). */
export const TRUST_ITEMS: TrustItem[] = [
  {
    title: "Free shipping",
    description: "Fast delivery to your door, tracked every step.",
    icon: "truck",
  },
  {
    title: "Free returns",
    description: "Changed your mind? Send it back, no hassle.",
    icon: "return",
  },
  {
    title: "Secure checkout",
    description: "Encrypted payments. We never store your card.",
    icon: "shield",
  },
  {
    title: "Help 7 days a week",
    description: "Chat or email our team, 8am–8pm ET.",
    icon: "headset",
  },
];
