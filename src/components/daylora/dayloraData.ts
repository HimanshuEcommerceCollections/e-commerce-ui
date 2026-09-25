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

export const FEATURED_PRODUCTS: ProductItem[] = [
  {
    id: "GS-EL-AUD-001",
    brand: "SoundCo",
    name: "Wireless Headphones Pro",
    variant: "Matte Black",
    price: 149.99,
    wasPrice: 199.99,
    stock: 3,
    icon: "audio",
    imgKey: "headphones",
    badge: null,
  },
  {
    id: "GS-EL-LAP-002",
    brand: "Novatech",
    name: "Premium Laptop, 15 in",
    variant: "16 GB · 512 GB SSD",
    price: 899.00,
    wasPrice: 1099.00,
    stock: 12,
    icon: "book",
    imgKey: "laptop",
    badge: null,
  },
  {
    id: "GS-HK-FUR-003",
    brand: "ErgoWorks",
    name: "Ergonomic Office Chair",
    variant: "Mesh · Black",
    price: 229.99,
    wasPrice: 299.99,
    stock: 20,
    icon: "gift",
    imgKey: "office-chair",
    badge: null,
  },
  {
    id: "GS-BP-SKI-004",
    brand: "GlowLab",
    name: "Luxury Skincare Set",
    variant: "4-piece",
    price: 64.00,
    wasPrice: 80.00,
    stock: 0,
    icon: "bottle",
    imgKey: "skincare",
    badge: null,
  },
  {
    id: "GS-HK-LGT-005",
    brand: "Lumen",
    name: "Modern LED Accent Lamp",
    variant: "Oak · Warm white",
    price: 89.99,
    wasPrice: null,
    stock: 15,
    icon: "gift",
    imgKey: "lamp",
    badge: null,
  },
  {
    id: "GS-SF-YOG-006",
    brand: "FitCore",
    name: "Premium Yoga Mat, 6 mm",
    variant: "Sage",
    price: 34.99,
    wasPrice: 44.99,
    stock: 30,
    icon: "dumbbell",
    imgKey: "yoga-mat",
    badge: null,
  },
];

export const DEALS_PRODUCTS: ProductItem[] = [
  {
    id: "GS-EL-MOU-007",
    brand: "SoundCo",
    name: "Gaming Mouse RGB",
    variant: "Wired · 7 buttons",
    price: 29.99,
    wasPrice: 59.99,
    stock: 40,
    icon: "audio",
    imgKey: "mouse",
  },
  {
    id: "GS-EL-KEY-008",
    brand: "KeyLab",
    name: "Wireless Keyboard",
    variant: "Full size · White",
    price: 39.99,
    wasPrice: 69.99,
    stock: 25,
    icon: "audio",
    imgKey: "keyboard",
  },
  {
    id: "GS-EL-HUB-009",
    brand: "Novatech",
    name: "USB-C Hub 7-in-1",
    variant: "Space Gray",
    price: 24.99,
    wasPrice: 49.99,
    stock: 4,
    icon: "audio",
    imgKey: "usb-hub",
  },
  {
    id: "GS-HK-COO-010",
    brand: "HomeCraft",
    name: "Stainless Steel Cookware Set",
    variant: "10-piece",
    price: 119.99,
    wasPrice: 199.99,
    stock: 18,
    icon: "pot",
    imgKey: "cookware",
  },
  {
    id: "GS-HK-BLE-011",
    brand: "BlendGo",
    name: "Portable Blender",
    variant: "20 oz · Mint",
    price: 29.99,
    wasPrice: 49.99,
    stock: 35,
    icon: "pot",
    imgKey: "blender",
  },
  {
    id: "GS-HK-COF-012",
    brand: "BrewMaster",
    name: "Espresso Machine",
    variant: "2-group · Black",
    price: 349.99,
    wasPrice: 449.99,
    stock: 0,
    icon: "pot",
    imgKey: "coffee-maker",
  },
];

export const NEW_ARRIVALS: ProductItem[] = [
  {
    id: "GS-CL-JAC-013",
    brand: "Basix",
    name: "Vintage Denim Jacket",
    variant: "Mid Wash · 5 sizes",
    price: 69.99,
    wasPrice: null,
    stock: 22,
    icon: "shirt",
    imgKey: "denim-jacket",
    badge: "New",
  },
  {
    id: "GS-CL-SNE-014",
    brand: "Stride",
    name: "Designer Sneakers",
    variant: "White · 8 sizes",
    price: 89.99,
    wasPrice: null,
    stock: 16,
    icon: "shirt",
    imgKey: "sneakers",
    badge: "New",
  },
  {
    id: "GS-EL-HUB-015",
    brand: "SmartLink",
    name: "Smart Home Hub",
    variant: "Charcoal",
    price: 99.99,
    wasPrice: 129.99,
    stock: 2,
    icon: "audio",
    imgKey: "smart-hub",
    badge: "New",
  },
  {
    id: "GS-EL-EAR-016",
    brand: "SoundCo",
    name: "Wireless Earbuds Pro",
    variant: "White",
    price: 79.99,
    wasPrice: null,
    stock: 28,
    icon: "audio",
    imgKey: "earbuds",
    badge: "New",
  },
  {
    id: "GS-EL-STA-017",
    brand: "ErgoWorks",
    name: "Premium Laptop Stand",
    variant: "Aluminum",
    price: 39.99,
    wasPrice: null,
    stock: 45,
    icon: "book",
    imgKey: "laptop-stand",
    badge: "New",
  },
  {
    id: "GS-HK-ROB-018",
    brand: "CleanBot",
    name: "Robot Vacuum Cleaner",
    variant: "Wi-Fi · Self-charging",
    price: 249.99,
    wasPrice: 299.99,
    stock: 9,
    icon: "gift",
    imgKey: "robot-vacuum",
    badge: "New",
  },
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
