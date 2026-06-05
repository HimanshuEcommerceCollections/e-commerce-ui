import { Search, ShoppingCart, User, Package, Heart } from "lucide-react";
import Container from "./Container";

const actions = [
  { label: "Account", icon: User },
  { label: "Orders", icon: Package },
  { label: "Wishlist", icon: Heart },
];

/** Storefront top navigation: logo, search, and account actions. */
export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white">
      <Container className="flex h-16 items-center gap-4 lg:gap-8">
        {/* Logo */}
        <a href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <ShoppingCart width={22} height={22} />
          </span>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">
            ShopHub
          </span>
        </a>

        {/* Search */}
        <div className="relative hidden flex-1 md:block">
          <Search
            width={20}
            height={20}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            placeholder="Search for products, brands, and more..."
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Actions */}
        <nav className="flex shrink-0 items-center gap-5 sm:gap-6">
          {actions.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className="flex flex-col items-center gap-0.5 text-slate-700 transition-colors hover:text-blue-600"
            >
              <Icon width={22} height={22} />
              <span className="hidden text-[11px] font-medium sm:block">{label}</span>
            </button>
          ))}

          <button className="flex flex-col items-center gap-0.5 text-slate-700 transition-colors hover:text-blue-600">
            <span className="relative">
              <ShoppingCart width={22} height={22} />
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
                3
              </span>
            </span>
            <span className="hidden text-[11px] font-medium sm:block">Cart</span>
          </button>
        </nav>
      </Container>
    </header>
  );
}
