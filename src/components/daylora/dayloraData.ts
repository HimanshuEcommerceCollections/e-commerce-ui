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

export interface ReviewItem {
  rating: number;
  quote: string;
  name: string;
  location: string;
  productBought: string;
  imgKey: string;
}

export interface TrustItem {
  title: string;
  description: string;
  icon: string;
}

export const BRAND_NAME = "Daylora";
export const LOW_STOCK_THRESHOLD = 5;

export const CATEGORIES: CategoryItem[] = [
  { name: "Clothing & Shoes", shortName: "Clothing", icon: "shirt", img: "/daylora/denim-jacket.jpg", href: "/catalog?category=clothing" },
  { name: "Electronics", shortName: "Electronics", icon: "audio", img: "/daylora/headphones-red.jpg", href: "/catalog?category=electronics" },
  { name: "Home & Kitchen", shortName: "Home & Kitchen", icon: "pot", img: "/daylora/cookware.jpg", href: "/catalog?category=home-kitchen" },
  { name: "Grocery", shortName: "Grocery", icon: "apple", img: null, href: "/catalog?category=grocery" },
  { name: "Beauty & Personal Care", shortName: "Beauty", icon: "bottle", img: "/daylora/skincare.jpg", href: "/catalog?category=beauty" },
  { name: "Books & Stationery", shortName: "Books", icon: "book", img: null, href: "/catalog?category=books" },
  { name: "Toys & Kids", shortName: "Toys & Kids", icon: "blocks", img: null, href: "/catalog?category=toys" },
  { name: "Sports & Fitness", shortName: "Sports", icon: "dumbbell", img: "/daylora/yoga-mat.jpg", href: "/catalog?category=sports" },
  { name: "Lifestyle", shortName: "Lifestyle", icon: "gift", img: "/daylora/lamp.jpg", href: "/catalog?category=lifestyle" },
];

export const RATINGS_MAP: Record<string, [number, number]> = {
  headphones: [4.6, 128],
  laptop: [4.4, 86],
  "office-chair": [4.7, 212],
  skincare: [4.5, 64],
  lamp: [4.3, 41],
  "yoga-mat": [4.8, 305],
  mouse: [4.5, 410],
  keyboard: [4.2, 97],
  "usb-hub": [4.4, 153],
  cookware: [4.7, 188],
  blender: [4.1, 72],
  "coffee-maker": [4.6, 59],
  "denim-jacket": [4.3, 18],
  sneakers: [4.5, 26],
  "smart-hub": [4.0, 12],
  earbuds: [4.4, 33],
  "laptop-stand": [4.8, 21],
  "robot-vacuum": [4.2, 15],
};

export const REVIEWS: ReviewItem[] = [
  {
    rating: 5,
    quote: "Assembly took 15 minutes and my back thanks me every workday. Great value for the price.",
    name: "Megan R.",
    location: "Austin, TX",
    productBought: "Ergonomic Office Chair",
    imgKey: "office-chair",
  },
  {
    rating: 5,
    quote: "Heats evenly and cleans up easily. Arrived two days early and was packed really well.",
    name: "David L.",
    location: "Columbus, OH",
    productBought: "Stainless Steel Cookware Set",
    imgKey: "cookware",
  },
  {
    rating: 4,
    quote: "Handles pet hair better than I expected, and the app setup was simple.",
    name: "Priya S.",
    location: "Denver, CO",
    productBought: "Robot Vacuum Cleaner",
    imgKey: "robot-vacuum",
  },
];

export const TRUST_ITEMS: TrustItem[] = [
  {
    title: "Free shipping on $35+",
    description: "Fast delivery to your door, tracked every step.",
    icon: "truck",
  },
  {
    title: "Free 30-day returns",
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
