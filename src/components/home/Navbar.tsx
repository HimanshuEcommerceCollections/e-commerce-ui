"use client";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import Logo from "@/components/shared/Logo";

export default function Navbar() {
  const router = useRouter();

  /* Account actions are gated: if there's no logged-in user (no token),
     send them to /login; otherwise continue to the requested page. */
  const requireAuth = (authedPath: string) => () => {
    const { isAuthenticated } = useAuthStore.getState();
    router.push(isAuthenticated ? authedPath : "/login");
  };

  return (
    <nav className="navbar-root">
      <div className="navbar-inner">

        {/* Logo */}
        <Logo size="lg" />

        {/* Search Bar */}
        <div className="navbar-search-wrapper">
          <div className="navbar-search-inner">
            <svg className="navbar-search-icon" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="navbar-search-input"
              type="text"
              placeholder="Search for products, brands, and more..."
            />
          </div>
        </div>

        {/* Nav Actions */}
        <div className="navbar-actions">

          {/* Account */}
          <button className="navbar-action-btn" onClick={requireAuth("/account")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span className="navbar-action-label">Account</span>
          </button>

          {/* Orders */}
          <button className="navbar-action-btn" onClick={requireAuth("/orders")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            <span className="navbar-action-label">Orders</span>
          </button>

          {/* Wishlist */}
          <button className="navbar-action-btn" onClick={requireAuth("/wishlist")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
            <span className="navbar-action-label">Wishlist</span>
          </button>

          {/* Cart */}
          <button className="navbar-action-btn" onClick={requireAuth("/cart")}>
            <div className="navbar-cart-badge">
              <span className="navbar-cart-badge-text">3</span>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <span className="navbar-action-label">Cart</span>
          </button>

        </div>
      </div>
    </nav>
  );
}
