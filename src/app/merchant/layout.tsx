import type { ReactNode } from "react";

export default function MerchantLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-60 border-r border-border bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-500">Merchant Dashboard</p>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
