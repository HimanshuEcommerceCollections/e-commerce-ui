"use client";
import { useState } from "react";
import { Search, ShoppingCart, Package, User } from "lucide-react";
import type { User as AuthUser } from "@/components/shared/ClientLayout";

interface NavbarProps {
  user?:          AuthUser | null;
  cartCount?:     number;
  onLoginClick?:  () => void;
  onSignupClick?: () => void;
}

const SEARCH_CATEGORIES = ["All", "Electronics", "Fashion", "Home", "Beauty", "Mobiles", "Books", "Toys"];

export default function Navbar({
  user          = null,
  cartCount     = 0,
  onLoginClick  = () => {},
  onSignupClick = () => {},
}: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [category,    setCategory]    = useState<string>("All");

  /* Display name: prefer firstName, fall back to displayName (nullable), then email */
  const displayName = user
    ? (user.firstName || user.displayName || user.email)
    : null;

  return (
    <nav className="navbar">

      {/* Left — Logo only */}
      <div className="navbar-left">
        <span className="nexus-logo">
          Nexus<span className="nexus-logo-dot">.</span>
        </span>
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
            className="absolute w-full h-full left-0 top-0 bg-[#F8FAFC] border border-[#E5E7EB] rounded-full py-0 pl-[58px] pr-[19px] [font-family:'Inter',sans-serif] not-italic font-normal text-[19.22px] leading-[23px] text-[rgba(17,24,39,1)] outline-none box-border placeholder:text-[rgba(17,24,39,0.5)]"
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
                <span className="flex justify-center items-center absolute w-[24px] h-[24px] bg-[#F97316] rounded-full left-[9.61px] top-[-4.81px] z-[2]">{cartCount}</span>
              )}
            </button>
            <div className="navbar-divider" />
            <button className="navbar-icon-btn">
              <User size={18} />
              <span>{displayName}</span>
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
