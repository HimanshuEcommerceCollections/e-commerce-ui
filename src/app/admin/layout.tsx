import type { ReactNode } from "react";
import Navbar from "@/components/home/Navbar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1">
        <aside className="w-60 border-r border-border bg-slate-900 p-4 text-white">
          <p className="text-sm font-semibold text-slate-400">Admin Panel</p>
        </aside>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
