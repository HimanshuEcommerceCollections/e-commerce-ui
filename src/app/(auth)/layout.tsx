import type { ReactNode } from "react";

/** Full-screen, chrome-free shell for the auth screens (no storefront nav/footer). */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4 sm:p-8">
      {children}
    </div>
  );
}
