import type { ReactNode } from "react";
import Navbar from "@/components/home/Navbar";

export default function MerchantLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1">
        <aside className="w-60 border-r border-border bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-500">Merchant Dashboard</p>
        </aside>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
