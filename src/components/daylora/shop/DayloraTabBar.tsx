"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { DayloraIcon } from "../DayloraIcons";
import { catalogHref } from "./departments";

type Tab = "home" | "cats" | "deals" | "new" | "cart";

/** Homepage sections the Deals and New tabs scroll to (and the scroll-spy watches). */
const SPY: Tab[] = ["deals", "new"];

interface TabBarProps {
  cartCount: number;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
}

const TabIcon = ({ name }: { name: string }) => (
  <span className="tb-ic">
    <DayloraIcon name={name} />
  </span>
);

/**
 * App-mode bottom tab bar (design 01-homepage_1_2 v3): phones only (≤767px, CSS),
 * Home · Departments · Deals · New · Cart. On the homepage, Deals and New scroll
 * to their sections and a scroll-spy keeps the active tab in step.
 */
function TabBarView({ cartCount, drawerOpen, setDrawerOpen, catalogTab }: TabBarProps & { catalogTab: Tab | null }) {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const [mounted, setMounted] = useState(false);
  const [spy, setSpy] = useState<Tab>("home");
  const catsRef = useRef<HTMLButtonElement>(null);
  const openedHere = useRef(false);

  useEffect(() => setMounted(true), []);

  // Scroll-spy: highlight Deals / New while those homepage sections are on screen.
  useEffect(() => {
    if (!onHome) return;
    let frame = 0;
    const measure = () => {
      const y = window.scrollY + window.innerHeight * 0.35;
      let cur: Tab = "home";
      for (const k of SPY) {
        const s = document.getElementById(k);
        if (s && s.offsetTop <= y && s.offsetTop + s.offsetHeight > y) cur = k;
      }
      setSpy(cur);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [onHome]);

  // Focus returns to the Departments tab when the sheet it opened closes.
  useEffect(() => {
    if (drawerOpen || !openedHere.current) return;
    openedHere.current = false;
    const a = document.activeElement;
    if (!a || a === document.body || a.closest("#drawer")) catsRef.current?.focus({ preventScroll: true });
  }, [drawerOpen]);

  const current: Tab | null = drawerOpen
    ? "cats"
    : onHome
      ? spy
      : pathname === "/cart"
        ? "cart"
        : pathname === "/catalog"
          ? catalogTab
          : null;
  const cur = (k: Tab) => (current === k ? ("page" as const) : undefined);

  /** On the homepage, jump to the section instead of leaving for the catalog. */
  const toSection = (k: Tab) => (e: React.MouseEvent) => {
    const s = onHome ? document.getElementById(k) : null;
    if (!s) return;
    e.preventDefault();
    s.scrollIntoView({ behavior: "smooth", block: "start" });
    setSpy(k);
  };

  const count = mounted ? cartCount : 0;

  return (
    <nav className="tabbar" aria-label="App">
      <Link
        href="/"
        aria-current={cur("home")}
        onClick={(e) => {
          if (!onHome) return;
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
          setSpy("home");
        }}
      >
        <TabIcon name="home" />
        <span>Home</span>
      </Link>
      <button
        type="button"
        ref={catsRef}
        aria-controls="drawer"
        aria-expanded={drawerOpen}
        aria-current={cur("cats")}
        onClick={() => {
          openedHere.current = true;
          setDrawerOpen(true);
        }}
      >
        <TabIcon name="grid" />
        <span>Departments</span>
      </button>
      <Link href={catalogHref({ deals: true })} aria-current={cur("deals")} onClick={toSection("deals")}>
        <TabIcon name="tag" />
        <span>Deals</span>
      </Link>
      <Link href={catalogHref({ new: true })} aria-current={cur("new")} onClick={toSection("new")}>
        <TabIcon name="spark" />
        <span>New</span>
      </Link>
      <Link href="/cart" aria-current={cur("cart")} aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}>
        <TabIcon name="cart" />
        <span>Cart</span>
        {count > 0 && <span className="tb-n">{count}</span>}
      </Link>
    </nav>
  );
}

/** Reads the catalog's deals / new filter so those tabs light up on their listing pages. */
function WithCatalogTab(props: TabBarProps) {
  const params = useSearchParams();
  const catalogTab: Tab | null = params.get("deals") === "1" ? "deals" : params.get("new") === "1" ? "new" : null;
  return <TabBarView {...props} catalogTab={catalogTab} />;
}

export function DayloraTabBar(props: TabBarProps) {
  // The fallback renders the same bar, so the server HTML already has it (the header CSS keys off it).
  return (
    <Suspense fallback={<TabBarView {...props} catalogTab={null} />}>
      <WithCatalogTab {...props} />
    </Suspense>
  );
}
