"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { DayloraSvgSprite } from "../DayloraIcons";
import { DayloraAnnouncementBar } from "../DayloraAnnouncement";
import { DayloraHeader } from "../DayloraHeader";
import { DayloraFooter } from "../DayloraFooter";

/** Pages that bring their own minimal header and footer (designs 05 and 06). */
const OWN_CHROME = ["/checkout", "/order-confirmation"];

/**
 * The storefront shell shared by every customer page: announcement bar,
 * header with search and the department menu, and the footer (FR-ST-01).
 */
export function DayloraShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const cartCount = useCartStore((s) => s.count());
  const refresh = useCartStore((s) => s.refresh);

  // Price the cart once per visit so the header count reflects the server (guests and customers alike).
  useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

  if (OWN_CHROME.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
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
      <DayloraHeader cartCount={cartCount} />
      {children}
      <DayloraFooter />
    </>
  );
}
