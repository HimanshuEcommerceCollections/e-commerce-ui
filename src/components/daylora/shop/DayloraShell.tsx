"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { DayloraSvgSprite } from "../DayloraIcons";
import { DayloraAnnouncementBar } from "../DayloraAnnouncement";
import { DayloraHeader } from "../DayloraHeader";
import { DayloraFooter } from "../DayloraFooter";
import { DayloraTabBar } from "./DayloraTabBar";

/** Pages that bring their own minimal header and footer (designs 05 and 06). */
const OWN_CHROME = ["/checkout", "/order-confirmation"];

/** Pages with their own sticky add-to-cart bar on phones, where the app tab bar would compete with it. */
const NO_TAB_BAR = ["/product"];

const under = (pathname: string, prefixes: string[]) =>
  prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/**
 * The storefront shell shared by every customer page: announcement bar,
 * header with search and the department menu, the footer (FR-ST-01), and on
 * phones the app-style bottom tab bar (design 01-homepage_1_2 v3).
 */
export function DayloraShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const cartCount = useCartStore((s) => s.count());
  const refresh = useCartStore((s) => s.refresh);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Price the cart once per visit so the header count reflects the server (guests and customers alike).
  useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

  if (under(pathname, OWN_CHROME)) {
    return (
      <>
        <DayloraSvgSprite />
        {children}
      </>
    );
  }

  return (
    <>
      <DayloraSvgSprite />
      <a className="skip" href="#main">
        Skip to content
      </a>
      <DayloraAnnouncementBar />
      <DayloraHeader cartCount={cartCount} drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} />
      {children}
      <DayloraFooter />
      {!under(pathname, NO_TAB_BAR) && (
        <DayloraTabBar cartCount={cartCount} drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} />
      )}
    </>
  );
}
