import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./_styles/admin.css";

export const metadata: Metadata = {
  title: "Daylora Admin",
  description: "Products, orders, inventory and catalog import",
  robots: { index: false, follow: false },
};

/** Admin pages use their own look (admin.css, scoped under .dla), not the storefront's. */
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return children;
}
