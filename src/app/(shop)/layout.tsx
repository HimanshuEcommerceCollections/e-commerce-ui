import type { ReactNode } from "react";
import { DayloraShell } from "@/components/daylora/shop/DayloraShell";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return <DayloraShell>{children}</DayloraShell>;
}
