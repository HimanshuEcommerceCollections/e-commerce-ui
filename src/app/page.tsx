import { DayloraHomePage } from "@/components/daylora/DayloraHomePage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daylora — Homepage",
  description: "Homepage v2 — Navy & Leaf palette, US market, PRD FR-ST-01 structure",
};

export default function Home() {
  return <DayloraHomePage />;
}
