"use client";
import { useState } from "react";
import { MapPin, Search, ShoppingCart, Package, User } from "lucide-react";

interface NavUser {
  name: string;
}

interface NavbarProps {
  user: NavUser | null;
  cartCount?: number;
  onLoginClick: () => void;
  onSignupClick: () => void;
}

const SEARCH_CATEGORIES = ["All", "Electronics", "Fashion", "Home", "Beauty", "Mobiles", "Books", "Toys"];

export default function Navbar({ user, cartCount = 0, onLoginClick, onSignupClick }: NavbarProps) {
  const [location] = useState<string>("Lucknow 226012");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [category, setCategory] = useState<string>("All");

  return (
    <nav className="navbar">

      {/* Left — Logo + Deliver */}
      <div className="navbar-left">
        <span className="nexus-logo">
          Nexus<span className="nexus-logo-dot">.</span>
        </span>
        <div className="navbar-deliver">
          <span className="navbar-deliver-label">Deliver to</span>
          <span className="navbar-deliver-location">
            <MapPin size={11} className="navbar-deliver-icon shrink-0" />
            {location}
          </span>
        </div>
      </div>

      {/* Center — Search (takes all remaining space) */}
      <div className="navbar-center">
        <div className="navbar-search">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="navbar-search-select"
          >
            {SEARCH_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, brands and more..."
            className="navbar-search-input"
          />
          <button className="navbar-search-btn">
            <Search size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Right — Auth / User actions */}
      <div className="navbar-right hidden md:flex">
        {user ? (
          <>
            <button className="navbar-icon-btn">
              <Package size={18} />
              <span>Orders</span>
            </button>
            <div className="navbar-divider" />
            <button className="navbar-icon-btn">
              <ShoppingCart size={18} />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="navbar-cart-badge">{cartCount}</span>
              )}
            </button>
            <div className="navbar-divider" />
            <button className="navbar-icon-btn">
              <User size={18} />
              <span>{user.name?.split(" ")[0] ?? "Account"}</span>
            </button>
          </>
        ) : (
          <>
            <button onClick={onLoginClick} className="btn btn-outline">
              Login
            </button>
            <button onClick={onSignupClick} className="btn btn-primary">
              Sign Up
            </button>
          </>
        )}
      </div>

    </nav>
  );
}