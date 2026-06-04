import Image from "next/image";
import AnnouncementBar from "@/components/AnnouncementBar";

const catLinks = [
  "Women's",
  "Men's",
  "Electronics",
  "Home & Living",
  "Beauty",
  "Sports",
  "Brands",
  "More",
];

/*
  Spacing is derived from Figma spec (1440px canvas):
  - Left padding: 80px  (px-20)
  - Logo ends:   ~165px
  - Search starts: 260px  → gap = 95px  (marginLeft on search-bar)
  - Right icons: ml-auto pushes them to the right edge; inner gaps match spec:
      wish → cart: 10px,  cart → sign-in: 14px
*/
export default function Navbar() {
  return (
    <>
      <AnnouncementBar />

      <nav className="navbar-root">
        {/* ── Logo ── */}
        <div className="navbar-logo">
          Nexus
          <span className="navbar-logo-dot" />
        </div>

        {/* ── Search bar: fixed 752 × 40, offset 95px from logo end ── */}
        <div className="search-bar" style={{ marginLeft: 95 }}>
          {/* Category selector */}
          <button className="search-cat-btn">
            All Categories
            <span style={{ marginLeft: 4 }}>▾</span>
          </button>

          {/* Divider */}
          <div
            style={{
              width: 1,
              height: 24,
              background: "#E2E8F0",
              alignSelf: "center",
              flexShrink: 0,
            }}
          />

          {/* Text input */}
          <input
            className="search-input"
            placeholder="Search for products, brands and more..."
          />

          {/* Search button — 45 × 40, blue, rounded right */}
          <button
            className="search-submit-btn"
            style={{ borderRadius: "0 8px 8px 0" }}
          >
            <Image
              src="/headersicons/search-ic.png"
              alt="Search"
              width={22}
              height={22}
            />
          </button>
        </div>

        {/* ── Right: Wishlist · Cart · Sign In ── */}
        <div
          className="flex items-center ml-auto"
          style={{ gap: 0 }}
        >
          {/* Wishlist */}
          <div className="navbar-icon-btn" style={{ marginRight: 10 }}>
            <Image
              src="/headersicons/wish-ic.png"
              alt="Wishlist"
              width={24}
              height={24}
            />
            <span className="navbar-wishlist-label">Wishlist</span>
          </div>

          {/* Cart area */}
          <div className="cart-area" style={{ marginRight: 14 }}>
            <Image
              src="/headersicons/cart-ic.png"
              alt="Cart"
              width={22}
              height={22}
            />
            <div className="cart-badge">3</div>
          </div>

          {/* Sign In / Join */}
          <button className="signin-btn">Sign In / Join</button>
        </div>
      </nav>

      {/* ── Category nav strip ── */}
      <div className="cat-nav">
        {/* Deals button: bolt-nav.png (18×18) at 6px from left, 13px gap to text */}
        <button className="cat-nav-deals-btn">
          <Image
            src="/catnavIcon/bolt-nav.png"
            alt=""
            width={18}
            height={18}
          />
          <span>Today&apos;s Deals</span>
        </button>

        {/* Category links — 16px gap from deals-btn, ~28px gap between links */}
        <div className="cat-nav-links">
          {catLinks.map((link, i) => (
            <a
              key={link}
              className={
                i === catLinks.length - 1 ? "cat-nav-link-dim" : "cat-nav-link"
              }
            >
              {link}
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
