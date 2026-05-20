import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-60 border-r border-border bg-slate-900 p-4 text-white">
        <p className="text-sm font-semibold text-slate-400">Admin Panel</p>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
