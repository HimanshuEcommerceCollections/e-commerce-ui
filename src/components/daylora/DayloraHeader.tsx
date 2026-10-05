"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DayloraIcon } from "./DayloraIcons";
import { BRAND_NAME, CATEGORIES, type CategoryItem } from "./dayloraData";
import { CLOTHING, clothingHref } from "./shop/taxonomy";

/** Departments with a sections pane in the mega menu. Only Clothing has a taxonomy so far. */
const hasPane = (c: CategoryItem) => c.shortName === "Clothing";

const SHOP_BY = [
  { t: "New arrivals", href: "/catalog?category=clothing&new=1" },
  { t: "Deals", href: "/catalog?category=clothing&deals=1", deals: true },
];

interface DayloraHeaderProps {
  cartCount: number;
}

export function DayloraHeader({ cartCount }: DayloraHeaderProps) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deptMenuOpen, setDeptMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // Mega menu opens on Clothing, the department with sections (design default).
  const [activeDept, setActiveDept] = useState<string | null>(CATEGORIES.find(hasPane)?.name ?? null);
  const [drawerDeptOpen, setDrawerDeptOpen] = useState(false);
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
                <div
                  className={`dept-menu ${deptMenuOpen ? "open" : ""} ${
                    CATEGORIES.some((c) => c.name === activeDept && hasPane(c)) ? "has-pane" : ""
                  }`}
                  id="deptMenu"
                >
                  <div className="dm-list">
                    {CATEGORIES.map((c) => (
                      <Link
                        key={c.name}
                        href={hasPane(c) ? clothingHref() : c.href}
                        className={c.name === activeDept ? "active" : undefined}
                        aria-haspopup={hasPane(c) ? "true" : undefined}
                        onMouseEnter={() => setActiveDept(c.name)}
                        onFocus={() => setActiveDept(c.name)}
                        onClick={() => setDeptMenuOpen(false)}
                      >
                        <DayloraIcon name={c.icon} />
                        {c.name}
                        {hasPane(c) && <DayloraIcon name="chev" className="icon sub-chev" />}
                      </Link>
                    ))}
                  </div>
                  <div className="dm-pane" aria-label="Department sections">
                    {CLOTHING.map((s) => (
                      <div key={s.key} className="dm-col">
                        <h4>{s.label}</h4>
                        <Link href={clothingHref(s)} className="dm-all" onClick={() => setDeptMenuOpen(false)}>
                          Shop all {s.label.toLowerCase()}
                        </Link>
                        {s.types.map((t) => (
                          <Link key={t.name} href={clothingHref(s, t)} onClick={() => setDeptMenuOpen(false)}>
                            {t.name}
                          </Link>
                        ))}
                      </div>
                    ))}
                    <div className="dm-col">
                      <h4>Shop by</h4>
                      {SHOP_BY.map((i) => (
                        <Link key={i.t} href={i.href} className={i.deals ? "dm-deals" : undefined} onClick={() => setDeptMenuOpen(false)}>
                          {i.t}
                        </Link>
                      ))}
                      <Link href={clothingHref()} className="dm-all" onClick={() => setDeptMenuOpen(false)}>
                        All clothing
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
              <li>
                <Link href="/catalog?deals=1" className="deals-link">
                  Today&apos;s deals
                </Link>
              </li>
              <li>
                <Link href="/catalog?new=1">New arrivals</Link>
              </li>
              <li className="nav-sell">
                <Link href="/seller/signup">
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
            <Link
              href="/catalog?deals=1"
              className="deals-link"
              onClick={() => setDrawerOpen(false)}
            >
              <DayloraIcon name="tag" />
              Deals
            </Link>
            {CATEGORIES.map((c) =>
              hasPane(c) ? (
                <React.Fragment key={c.name}>
                  <button
                    className="dr-sub"
                    aria-expanded={drawerDeptOpen}
                    aria-controls="drawer-clothing"
                    onClick={() => setDrawerDeptOpen(!drawerDeptOpen)}
                  >
                    <DayloraIcon name={c.icon} />
                    {c.name}
                    <DayloraIcon name="chev" className="icon chev" />
                  </button>
                  <div className="dr-panel" id="drawer-clothing">
                    <Link href={clothingHref()} className="dm-all" style={{ marginTop: 8 }} onClick={() => setDrawerOpen(false)}>
                      Shop all clothing
                    </Link>
                    {CLOTHING.map((s) => (
                      <React.Fragment key={s.key}>
                        <h4>{s.label}</h4>
                        <Link href={clothingHref(s)} className="dm-all" onClick={() => setDrawerOpen(false)}>
                          Shop all {s.label.toLowerCase()}
                        </Link>
                        {s.types.map((t) => (
                          <Link key={t.name} href={clothingHref(s, t)} onClick={() => setDrawerOpen(false)}>
                            {t.name}
                          </Link>
                        ))}
                      </React.Fragment>
                    ))}
                  </div>
                </React.Fragment>
              ) : (
                <Link key={c.name} href={c.href} onClick={() => setDrawerOpen(false)}>
                  <DayloraIcon name={c.icon} />
                  {c.name}
                </Link>
              ),
            )}
          </div>
          <h3 className="t-eyebrow">Help</h3>
          <Link href="/orders" onClick={() => setDrawerOpen(false)}>
            Orders &amp; tracking
          </Link>
          <Link href="/help/shipping" onClick={() => setDrawerOpen(false)}>
            Shipping &amp; returns
          </Link>
          <Link href="/help/contact" onClick={() => setDrawerOpen(false)}>
            Contact us
          </Link>
          <h3 className="t-eyebrow">Business</h3>
          <Link href="/seller/signup" onClick={() => setDrawerOpen(false)}>
            <DayloraIcon name="store" />
            Sell on {BRAND_NAME}
          </Link>
        </div>
      </aside>
    </>
  );
}
