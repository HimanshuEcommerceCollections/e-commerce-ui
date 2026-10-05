"use client";

import type { ReactNode } from "react";
import { useCartStore } from "@/store/useCartStore";
import { DayloraSvgSprite } from "../DayloraIcons";
import { DayloraAnnouncementBar } from "../DayloraAnnouncement";
import { DayloraHeader } from "../DayloraHeader";
import { DayloraFooter } from "../DayloraFooter";

/** Announcement bar, header and footer around a storefront page (PLP, PDP). */
export function DayloraShell({ children }: { children: ReactNode }) {
  const cartCount = useCartStore((s) => s.cart?.totalItems ?? 0);

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
