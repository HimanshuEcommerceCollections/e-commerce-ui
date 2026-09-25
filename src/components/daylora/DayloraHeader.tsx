"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DayloraIcon } from "./DayloraIcons";
import { BRAND_NAME, CATEGORIES } from "./dayloraData";

interface DayloraHeaderProps {
  cartCount: number;
}

export function DayloraHeader({ cartCount }: DayloraHeaderProps) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deptMenuOpen, setDeptMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const deptRef = useRef<HTMLLIElement>(null);

  // Close menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDeptMenuOpen(false);
        setDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close department menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (deptRef.current && !deptRef.current.contains(e.target as Node)) {
        setDeptMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Sync drawer-open class on html tag for overflow locking
  useEffect(() => {
    if (drawerOpen) {
      document.documentElement.classList.add("drawer-open");
    } else {
      document.documentElement.classList.remove("drawer-open");
    }
    return () => {
      document.documentElement.classList.remove("drawer-open");
    };
  }, [drawerOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <header className="header" data-note="FR-ST-01 · Header">
        <div className="daylora-container">
          <div className="header-row">
            <button
              className="icon-btn menu-btn"
              id="menuBtn"
              aria-label="Open menu"
              aria-controls="drawer"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
            >
              <DayloraIcon name="menu" />
            </button>

            <Link href="/" className="logo" aria-label="Home">
              <span className="logo-mark">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 3h12l3 6-9 12L3 9l3-6z" />
                </svg>
              </span>
              <span>{BRAND_NAME}</span>
            </Link>

            <form
              className="search search-desktop"
              role="search"
              onSubmit={handleSearchSubmit}
            >
              <label className="sr-only" htmlFor="q1">
                Search
              </label>
              <input
                id="q1"
                type="search"
                placeholder="Search products, brands and categories"
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" aria-label="Search">
                <DayloraIcon name="search" />
              </button>
            </form>

            <Link
              href="/login"
              className="icon-btn"
              aria-label="Sign in or view your account"
            >
              <DayloraIcon name="user" />
              <span className="label-desktop">Sign in</span>
            </Link>

            <Link href="/cart" className="icon-btn" aria-label="Cart">
              <DayloraIcon name="cart" />
              <span className="label-desktop">Cart</span>
              <span className="cart-count" id="cartCount" aria-live="polite">
                {cartCount}
              </span>
            </Link>
          </div>

          <form
            className="search search-mobile"
            role="search"
            onSubmit={handleSearchSubmit}
          >
            <label className="sr-only" htmlFor="q2">
              Search
            </label>
            <input
              id="q2"
              type="search"
              placeholder="Search products and brands"
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" aria-label="Search">
              <DayloraIcon name="search" />
            </button>
          </form>
        </div>

        {/* NAVIGATION (desktop) */}
        <nav className="nav" aria-label="Main" data-note="FR-ST-01 · Navigation">
          <div className="daylora-container">
            <ul id="navList">
              <li className="has-menu" ref={deptRef}>
                <button
                  className="all"
                  id="deptBtn"
                  aria-expanded={deptMenuOpen}
                  aria-controls="deptMenu"
                  onClick={() => setDeptMenuOpen(!deptMenuOpen)}
                >
                  <DayloraIcon name="grid" />
                  All departments
                  <DayloraIcon name="chev" className="icon chev" />
                </button>
                <div className={`dept-menu ${deptMenuOpen ? "open" : ""}`} id="deptMenu">
                  {CATEGORIES.map((c) => (
                    <Link
                      key={c.name}
                      href={c.href}
                      onClick={() => setDeptMenuOpen(false)}
                    >
                      <DayloraIcon name={c.icon} />
                      {c.name}
                    </Link>
                  ))}
                </div>
              </li>
              <li>
                <a href="#deals" className="deals-link">
                  Today&apos;s deals
                </a>
              </li>
              <li>
                <a href="#new">New arrivals</a>
              </li>
              <li className="nav-sell">
                <Link href="/seller/register">
                  <DayloraIcon name="store" />
                  Sell on {BRAND_NAME}
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </header>

      {/* Mobile drawer */}
      <div
        className="backdrop"
        id="backdrop"
        onClick={() => setDrawerOpen(false)}
      />
      <aside
        className="drawer"
        id="drawer"
        aria-label="Menu"
        aria-hidden={!drawerOpen}
      >
        <div className="drawer-head">
          <Link href="/login" onClick={() => setDrawerOpen(false)}>
            <DayloraIcon name="user" />
            Sign in / Create account
          </Link>
          <button
            className="icon-btn"
            id="closeBtn"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          >
            <DayloraIcon name="close" />
          </button>
        </div>
        <div className="drawer-body">
          <h3 className="t-eyebrow">Shop by department</h3>
          <div id="drawerList">
            <a
              href="#deals"
              className="deals-link"
              onClick={() => setDrawerOpen(false)}
            >
              <DayloraIcon name="tag" />
              Deals
            </a>
            {CATEGORIES.map((c) => (
              <Link
                key={c.name}
                href={c.href}
                onClick={() => setDrawerOpen(false)}
              >
                <DayloraIcon name={c.icon} />
                {c.name}
              </Link>
            ))}
          </div>
          <h3 className="t-eyebrow">Help</h3>
          <Link href="/catalog" onClick={() => setDrawerOpen(false)}>
            Orders &amp; tracking
          </Link>
          <Link href="/catalog" onClick={() => setDrawerOpen(false)}>
            Shipping &amp; returns
          </Link>
          <Link href="/catalog" onClick={() => setDrawerOpen(false)}>
            Contact us
          </Link>
          <h3 className="t-eyebrow">Business</h3>
          <Link href="/seller/register" onClick={() => setDrawerOpen(false)}>
            <DayloraIcon name="store" />
            Sell on {BRAND_NAME}
          </Link>
        </div>
      </aside>
    </>
  );
}
