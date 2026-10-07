"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { DayloraIcon } from "./DayloraIcons";
import { BRAND_NAME } from "./dayloraData";
import { DayloraSearch } from "./DayloraSearch";
import { catalogHref, useDepartments, type Department } from "./shop/departments";

/** "Shop by" column of the mega menu, per department. */
const shopBy = (d: Department) => [
  { t: "New arrivals", href: catalogHref({ dept: d.slug, new: true }) },
  { t: "Deals", href: catalogHref({ dept: d.slug, deals: true }), deals: true },
  { t: "Best sellers", href: catalogHref({ dept: d.slug, sort: "pop" }) },
];

interface DayloraHeaderProps {
  cartCount: number;
}

/** Sticky header, desktop nav with the "All departments" mega menu, and the mobile drawer (FR-ST-01, FR-ST-02). */
export function DayloraHeader({ cartCount }: DayloraHeaderProps) {
  const pathname = usePathname();
  const departments = useDepartments();
  const user = useAuthStore((s) => s.user);
  // Auth and cart live in localStorage: render the signed-out state until mounted to match the server HTML.
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deptMenuOpen, setDeptMenuOpen] = useState(false);
  // The mega menu opens on the first department, as in the design.
  const [activeDept, setActiveDept] = useState<string | null>(null);
  const [drawerExpanded, setDrawerExpanded] = useState<string | null>(null);
  const deptRef = useRef<HTMLLIElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  const firstName = mounted && user ? user.fullName?.trim().split(/\s+/)[0] || null : null;
  const signedIn = mounted && !!user;
  const accountHref = signedIn ? "/account" : "/login";
  const active = departments.find((d) => d.slug === activeDept) ?? departments[0];

  // Close menus on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDeptMenuOpen(false);
        setDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close the department menu on an outside click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (deptRef.current && !deptRef.current.contains(e.target as Node)) setDeptMenuOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Navigating closes everything.
  useEffect(() => {
    setDeptMenuOpen(false);
    setDrawerOpen(false);
  }, [pathname]);

  // The drawer locks page scroll through a class on <html>, and takes focus.
  useEffect(() => {
    document.documentElement.classList.toggle("drawer-open", drawerOpen);
    if (drawerOpen) closeBtnRef.current?.focus();
    return () => document.documentElement.classList.remove("drawer-open");
  }, [drawerOpen]);

  const closeAll = () => {
    setDeptMenuOpen(false);
    setDrawerOpen(false);
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

            <Link href="/" className="logo" aria-label={`${BRAND_NAME} home`}>
              <span>{BRAND_NAME}</span>
            </Link>

            <DayloraSearch id="q1" className="search-desktop" placeholder="Search products, brands and categories" />

            <Link
              href={accountHref}
              className="icon-btn"
              aria-label={signedIn ? "Your account" : "Sign in or view your account"}
              data-account
            >
              <DayloraIcon name="user" />
              <span className="label-desktop">{firstName ? `Hi, ${firstName}` : signedIn ? "Account" : "Sign in"}</span>
            </Link>

            <Link href="/cart" className="icon-btn" aria-label={`Cart, ${mounted ? cartCount : 0} items`}>
              <DayloraIcon name="cart" />
              <span className="label-desktop">Cart</span>
              <span className="cart-count" id="cartCount" aria-live="polite">
                {mounted ? cartCount : 0}
              </span>
            </Link>
          </div>

          <DayloraSearch id="q2" className="search-mobile" placeholder="Search products and brands" />
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
                  onClick={() => {
                    if (!deptMenuOpen) setActiveDept(departments[0]?.slug ?? null);
                    setDeptMenuOpen(!deptMenuOpen);
                  }}
                >
                  <DayloraIcon name="grid" />
                  All departments
                  <DayloraIcon name="chev" className="icon chev" />
                </button>
                <div
                  className={`dept-menu${deptMenuOpen ? " open" : ""}${active && active.sections.length ? " has-pane" : ""}`}
                  id="deptMenu"
                >
                  <div className="dm-list">
                    {departments.map((d) => (
                      <Link
                        key={d.slug}
                        href={catalogHref({ dept: d.slug })}
                        className={`has-sub${d.slug === active?.slug ? " active" : ""}`}
                        aria-haspopup={d.sections.length ? "true" : undefined}
                        onMouseEnter={() => setActiveDept(d.slug)}
                        onFocus={() => setActiveDept(d.slug)}
                        onClick={closeAll}
                      >
                        <DayloraIcon name={d.icon} />
                        {d.name}
                        {d.sections.length > 0 && <DayloraIcon name="chev" className="icon sub-chev" />}
                      </Link>
                    ))}
                  </div>
                  <div className="dm-pane" aria-label={active ? `${active.name} sections` : "Department sections"}>
                    {active?.sections.map((s) => (
                      <div key={s.slug} className="dm-col">
                        <h4>{s.name}</h4>
                        <Link href={catalogHref({ dept: active.slug, g: s.slug })} className="dm-all" onClick={closeAll}>
                          Shop all {s.name.toLowerCase()}
                        </Link>
                        {s.types.map((t) => (
                          <Link key={t} href={catalogHref({ dept: active.slug, g: s.slug, type: t })} onClick={closeAll}>
                            {t}
                          </Link>
                        ))}
                      </div>
                    ))}
                    {active && (
                      <div className="dm-col">
                        <h4>Shop by</h4>
                        {shopBy(active).map((i) => (
                          <Link key={i.t} href={i.href} className={i.deals ? "dm-deals" : undefined} onClick={closeAll}>
                            {i.t}
                          </Link>
                        ))}
                        <Link href={catalogHref({ dept: active.slug })} className="dm-all" onClick={closeAll}>
                          All {active.name.toLowerCase()}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </li>
              <li>
                <Link href={catalogHref({ deals: true })} className="deals-link">
                  Today&apos;s deals
                </Link>
              </li>
              <li>
                <Link href={catalogHref({ new: true })}>New arrivals</Link>
              </li>
              <li className="nav-sell">
                <Link href="/sell" aria-current={pathname === "/sell" ? "page" : undefined}>
                  <DayloraIcon name="store" />
                  Sell on {BRAND_NAME}
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </header>

      {/* Mobile drawer */}
      <div className="backdrop" id="backdrop" onClick={() => setDrawerOpen(false)} />
      <aside className="drawer" id="drawer" aria-label="Menu" aria-hidden={!drawerOpen}>
        <div className="drawer-head">
          <Link href={accountHref} onClick={closeAll}>
            <DayloraIcon name="user" />
            {firstName ? `Hi, ${firstName}` : signedIn ? "Your account" : "Sign in / Create account"}
          </Link>
          <button className="icon-btn" id="closeBtn" aria-label="Close menu" ref={closeBtnRef} onClick={() => setDrawerOpen(false)}>
            <DayloraIcon name="close" />
          </button>
        </div>
        <div className="drawer-body">
          <h3 className="t-eyebrow">Shop by department</h3>
          <div id="drawerList">
            <Link href={catalogHref({ deals: true })} className="deals-link" onClick={closeAll}>
              <DayloraIcon name="tag" />
              Deals
            </Link>
            {departments.map((d) => {
              const expanded = drawerExpanded === d.slug;
              const panelId = `drp-${d.slug}`;
              return (
                <React.Fragment key={d.slug}>
                  <button
                    className="dr-sub"
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    onClick={() => setDrawerExpanded(expanded ? null : d.slug)}
                  >
                    <DayloraIcon name={d.icon} />
                    {d.name}
                    <DayloraIcon name="chev" className="icon chev" />
                  </button>
                  <div className="dr-panel" id={panelId}>
                    <Link href={catalogHref({ dept: d.slug })} className="dm-all" style={{ marginTop: 8 }} onClick={closeAll}>
                      Shop all {d.name.toLowerCase()}
                    </Link>
                    {d.sections.map((s) => (
                      <React.Fragment key={s.slug}>
                        <h4>{s.name}</h4>
                        <Link href={catalogHref({ dept: d.slug, g: s.slug })} className="dm-all" onClick={closeAll}>
                          Shop all {s.name.toLowerCase()}
                        </Link>
                        {s.types.map((t) => (
                          <Link key={t} href={catalogHref({ dept: d.slug, g: s.slug, type: t })} onClick={closeAll}>
                            {t}
                          </Link>
                        ))}
                      </React.Fragment>
                    ))}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
          <h3 className="t-eyebrow">Help</h3>
          <Link href="/track" onClick={closeAll}>
            Orders &amp; tracking
          </Link>
          <Link href="/help?t=shipping" onClick={closeAll}>
            Shipping &amp; returns
          </Link>
          <Link href="/help?t=contact" onClick={closeAll}>
            Contact us
          </Link>
          <h3 className="t-eyebrow">Business</h3>
          <Link href="/sell" onClick={closeAll}>
            <DayloraIcon name="store" />
            Sell on {BRAND_NAME}
          </Link>
        </div>
      </aside>
    </>
  );
}
