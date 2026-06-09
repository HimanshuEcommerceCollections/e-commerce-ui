import type { ReactNode } from "react";

/** Full-page, chrome-free shell for the auth screens (no storefront nav/footer). */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}
