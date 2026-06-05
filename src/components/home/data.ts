/**
 * Sample homepage data — mirrors the "ShopHub" Figma design (node 105:2050).
 * Static content for the storefront landing page; swap for live API data later.
 */

export type Product = {
  name: string;
  price: number;
  original?: number;
  rating: number;
  reviews: number;
  badge?: string;
  /** Tailwind gradient classes used as the image placeholder. */
  swatch: string;
  /** Units remaining — drives the flash-sale stock bar. */
  stock?: number;
  /** Percentage of stock sold — flash-sale progress bar width. */
  sold?: number;
  delivery?: string;
};

export type Category = {
  name: string;
  items: string;
  swatch: string;
};

const SWATCHES = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-violet-500 to-purple-600",
  "from-sky-500 to-cyan-600",
  "from-lime-500 to-green-600",
  "from-fuchsia-500 to-rose-600",
  "from-slate-600 to-slate-800",
  "from-yellow-500 to-amber-600",
  "from-cyan-500 to-blue-600",
  "from-pink-500 to-rose-600",
];

export const swatch = (i: number) => SWATCHES[i % SWATCHES.length];

/* ── Hero category cards ── */
export const heroCategories = [
  { name: "Electronics", swatch: "from-blue-600 to-indigo-800" },
  { name: "Fashion", swatch: "from-rose-500 to-pink-700" },
  { name: "Home & Kitchen", swatch: "from-amber-500 to-orange-700" },
  { name: "Beauty", swatch: "from-fuchsia-500 to-purple-700" },
];

/* ── Flash Sale ── */
export const flashDeals: Product[] = [
  { name: "Wireless Headphones Pro", price: 89.99, original: 299.99, rating: 4.8, reviews: 2453, badge: "-70%", stock: 45, sold: 45, swatch: swatch(0) },
  { name: "Smart Watch Series 5", price: 199.99, original: 499.99, rating: 4.9, reviews: 5821, badge: "-60%", stock: 28, sold: 28, swatch: swatch(1) },
  { name: 'Premium Laptop 15"', price: 799.99, original: 1499.99, rating: 4.7, reviews: 1234, badge: "-47%", stock: 15, sold: 15, swatch: swatch(2) },
  { name: "Bluetooth Speaker", price: 49.99, original: 149.99, rating: 4.6, reviews: 3892, badge: "-67%", stock: 67, sold: 67, swatch: swatch(3) },
  { name: "Gaming Mouse RGB", price: 29.99, original: 79.99, rating: 4.8, reviews: 4521, badge: "-63%", stock: 89, sold: 89, swatch: swatch(4) },
  { name: "4K Webcam Ultra", price: 79.99, original: 199.99, rating: 4.7, reviews: 1876, badge: "-60%", stock: 34, sold: 34, swatch: swatch(5) },
  { name: "Wireless Keyboard", price: 39.99, original: 99.99, rating: 4.5, reviews: 2341, badge: "-60%", stock: 56, sold: 56, swatch: swatch(6) },
  { name: "USB-C Hub 7-in-1", price: 34.99, original: 89.99, rating: 4.6, reviews: 1567, badge: "-61%", stock: 78, sold: 78, swatch: swatch(7) },
];

/* ── Shop By Category ── */
export const categories: Category[] = [
  { name: "Electronics", items: "15K+ Items", swatch: swatch(0) },
  { name: "Fashion", items: "25K+ Items", swatch: swatch(1) },
  { name: "Home & Kitchen", items: "18K+ Items", swatch: swatch(2) },
  { name: "Beauty", items: "12K+ Items", swatch: swatch(3) },
  { name: "Sports & Fitness", items: "9K+ Items", swatch: swatch(4) },
  { name: "Books & Media", items: "45K+ Items", swatch: swatch(5) },
  { name: "Toys & Games", items: "8K+ Items", swatch: swatch(6) },
  { name: "Pet Supplies", items: "5K+ Items", swatch: swatch(7) },
  { name: "Automotive", items: "11K+ Items", swatch: swatch(8) },
  { name: "Garden & Outdoor", items: "7K+ Items", swatch: swatch(9) },
  { name: "Office Supplies", items: "14K+ Items", swatch: swatch(10) },
  { name: "Baby Products", items: "6K+ Items", swatch: swatch(11) },
];

/* ── Trending Products ── */
export const trendingProducts: Product[] = [
  { name: "Premium Laptop Stand", price: 49.99, original: 89.99, rating: 4.8, reviews: 3241, badge: "Sale", delivery: "Jun 6", swatch: swatch(0) },
  { name: "Ergonomic Office Chair", price: 299.99, original: 599.99, rating: 4.9, reviews: 1876, badge: "Best Seller", delivery: "Jun 7", swatch: swatch(8) },
  { name: "Vintage Denim Jacket", price: 79.99, original: 149.99, rating: 4.7, reviews: 892, badge: "Trending", delivery: "Jun 6", swatch: swatch(1) },
  { name: "Stainless Steel Cookware", price: 159.99, original: 299.99, rating: 4.8, reviews: 2341, badge: "Sale", delivery: "Jun 8", swatch: swatch(2) },
  { name: "Luxury Skincare Set", price: 129.99, original: 249.99, rating: 4.9, reviews: 4523, badge: "Popular", delivery: "Jun 6", swatch: swatch(3) },
  { name: "Modern Floor Lamp", price: 89.99, original: 179.99, rating: 4.6, reviews: 567, badge: "New", delivery: "Jun 9", swatch: swatch(9) },
  { name: "Wireless Earbuds Pro", price: 149.99, original: 249.99, rating: 4.8, reviews: 6789, badge: "Best Seller", delivery: "Jun 6", swatch: swatch(5) },
  { name: "Smart Home Hub", price: 99.99, original: 199.99, rating: 4.7, reviews: 3456, badge: "Sale", delivery: "Jun 7", swatch: swatch(11) },
  { name: "Yoga Mat Premium", price: 39.99, original: 79.99, rating: 4.8, reviews: 2134, badge: "Popular", delivery: "Jun 6", swatch: swatch(4) },
  { name: "Coffee Maker Deluxe", price: 189.99, original: 349.99, rating: 4.9, reviews: 1892, badge: "Sale", delivery: "Jun 8", swatch: swatch(2) },
  { name: "Designer Sneakers", price: 119.99, original: 249.99, rating: 4.7, reviews: 4521, badge: "Trending", delivery: "Jun 7", swatch: swatch(6) },
  { name: "Portable Blender", price: 44.99, original: 89.99, rating: 4.6, reviews: 1234, badge: "New", delivery: "Jun 6", swatch: swatch(10) },
];

/* ── Promo banners ── */
export const promoBanners = [
  { tag: "MEGA SALE", title: "Electronics Event", subtitle: "Up to 60% off tech essentials", cta: "Shop Now", swatch: "from-blue-700 via-indigo-700 to-violet-800" },
  { tag: "SUMMER REFRESH", title: "Home Makeover", subtitle: "Transform your space", cta: "Explore", swatch: "from-emerald-600 via-teal-700 to-cyan-800" },
];

/* ── Best Sellers ── */
export const bestSellers = [
  { rank: 1, name: 'Ultra HD Smart TV 55"', price: 599.99, rating: 4.8, reviews: 8234, purchased: "12,453", swatch: swatch(0) },
  { rank: 2, name: "Robot Vacuum Cleaner", price: 349.99, rating: 4.9, reviews: 15234, purchased: "23,451", swatch: swatch(8) },
  { rank: 3, name: "Memory Foam Mattress", price: 799.99, rating: 4.8, reviews: 6789, purchased: "9,876", swatch: swatch(4) },
  { rank: 4, name: "Air Fryer XL", price: 129.99, rating: 4.9, reviews: 23456, purchased: "34,521", swatch: swatch(2) },
  { rank: 5, name: "Instant Pot 8-Qt", price: 99.99, rating: 4.8, reviews: 18765, purchased: "28,934", swatch: swatch(9) },
  { rank: 6, name: "Weighted Blanket Queen", price: 79.99, rating: 4.7, reviews: 5432, purchased: "8,765", swatch: swatch(5) },
];

/* ── Shop By Room ── */
export const rooms = [
  { name: "Living Room", desc: "Modern comfort meets style", swatch: "from-amber-500 to-orange-700" },
  { name: "Bedroom", desc: "Your personal sanctuary", swatch: "from-violet-500 to-purple-700" },
  { name: "Kitchen", desc: "Cook with confidence", swatch: "from-rose-500 to-red-700" },
  { name: "Workspace", desc: "Productivity perfected", swatch: "from-blue-500 to-indigo-700" },
  { name: "Outdoor Space", desc: "Embrace the outdoors", swatch: "from-emerald-500 to-green-700" },
  { name: "Kids Room", desc: "Play and grow", swatch: "from-sky-500 to-cyan-700" },
];

/* ── Popular Brands ── */
export const brands = ["Apple", "Samsung", "Sony", "Nike", "Adidas", "Levi's", "Dyson", "KitchenAid", "LG", "Bose", "HP", "Dell"];

/* ── Recommended For You ── */
export const recommended: Product[] = [
  { name: "Premium Laptop Stand", price: 49.99, rating: 4.8, reviews: 3241, swatch: swatch(0) },
  { name: "Ergonomic Office Chair", price: 299.99, rating: 4.9, reviews: 1876, swatch: swatch(8) },
  { name: "Vintage Denim Jacket", price: 79.99, rating: 4.7, reviews: 892, swatch: swatch(1) },
  { name: "Stainless Steel Cookware", price: 159.99, rating: 4.8, reviews: 2341, swatch: swatch(2) },
  { name: "Luxury Skincare Set", price: 129.99, rating: 4.9, reviews: 4523, swatch: swatch(3) },
  { name: "Modern Floor Lamp", price: 89.99, rating: 4.6, reviews: 567, swatch: swatch(9) },
  { name: "Wireless Earbuds Pro", price: 149.99, rating: 4.8, reviews: 6789, swatch: swatch(5) },
  { name: "Smart Home Hub", price: 99.99, rating: 4.7, reviews: 3456, swatch: swatch(11) },
];

/* ── Testimonials ── */
export const testimonials = [
  { quote: "Absolutely love shopping here! Fast shipping and great quality products. The customer service is top-notch and always ready to help.", name: "Sarah Johnson", initial: "S", swatch: "from-rose-500 to-pink-600" },
  { quote: "Best online shopping experience ever. Customer service is amazing and the delivery is always on time. Highly recommended to everyone!", name: "Michael Chen", initial: "M", swatch: "from-blue-500 to-indigo-600" },
  { quote: "The product selection is amazing and everything arrives beautifully packaged. I've been a loyal customer for years now.", name: "Emma Williams", initial: "E", swatch: "from-emerald-500 to-teal-600" },
];

export const testimonialStats = [
  { value: "5M+", label: "Happy Customers" },
  { value: "1M+", label: "Product Reviews" },
  { value: "98%", label: "Satisfaction Rate" },
];

/* ── App download feature list ── */
export const appFeatures = [
  "Real-time order tracking",
  "Personalized recommendations",
  "Faster checkout",
  "App-only exclusive deals",
];

/* ── Footer ── */
export const footerColumns = [
  { heading: "Shop", links: ["Electronics", "Fashion", "Home & Kitchen", "Beauty", "Sports"] },
  { heading: "Customer Service", links: ["Orders", "Returns", "Shipping", "Track Order", "Contact Us"] },
  { heading: "Company", links: ["About Us", "Careers", "Investors", "Privacy Policy", "Terms of Service"] },
];

export const paymentMethods = ["Visa", "Mastercard", "Amex", "PayPal"];
