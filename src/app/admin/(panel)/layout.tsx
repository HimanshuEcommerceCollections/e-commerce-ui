"use client";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import adminService from "@/services/admin/admin.service";
import { useAuth } from "@/hooks/useAuth";
import { Icon, Toast } from "@/components/admin/ui";
import { useAdminSession } from "@/components/admin/useAdminSession";
import { ADMIN_REFRESH_EVENT } from "@/components/admin/refresh";

const NAV = [
  { href: "/admin/products", label: "Products", icon: "box" },
  { href: "/admin/orders", label: "Orders", icon: "orders", count: "orders" },
  { href: "/admin/inventory", label: "Inventory", icon: "stack", count: "stock" },
] as const;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

export default function AdminPanelLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { ready, isAdmin, user } = useAdminSession();
  const [counts, setCounts] = useState<{ orders: number; stock: number }>({ orders: 0, stock: 0 });

  useEffect(() => {
    if (ready && !isAdmin) router.replace("/admin/login");
  }, [ready, isAdmin, router]);

  const loadCounts = useCallback(async () => {
    try {
      const [orders, stock] = await Promise.all([adminService.orderStats(), adminService.inventoryStats()]);
      const by = orders.data.data?.byStatus ?? {};
      const s = stock.data.data;
      setCounts({ orders: (by.PAID ?? 0) + (by.CONFIRMED ?? 0), stock: s ? s.lowStock + s.outOfStock : 0 });
    } catch {
      // Counts are a convenience; the pages report their own errors.
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    loadCounts();
    window.addEventListener(ADMIN_REFRESH_EVENT, loadCounts);
    return () => window.removeEventListener(ADMIN_REFRESH_EVENT, loadCounts);
  }, [isAdmin, loadCounts]);

  if (!isAdmin || !user) return <div className="dla" />;

  const signOut = () => {
    logout();
    router.replace("/admin/login");
  };

  return (
    <div className="dla">
      <div className="app">
        <aside className="side" aria-label="Admin navigation">
          <div className="brandrow">
            <b>Daylora</b>
            <span>Admin</span>
          </div>
          <nav className="snav">
            {NAV.map((item) => {
              const n = "count" in item ? counts[item.count] : 0;
              return (
                <Link key={item.href} href={item.href} aria-current={pathname.startsWith(item.href) ? "page" : undefined}>
                  <Icon name={item.icon} />
                  {item.label}
                  {n ? <span className="n">{n}</span> : null}
                </Link>
              );
            })}
            <a className="soon" aria-disabled="true">
              <Icon name="users" />
              Customers<small>Next</small>
            </a>
            <a className="soon" aria-disabled="true">
              <Icon name="chart" />
              Reports<small>P1</small>
            </a>
          </nav>
          <Link href="/" className="store-link" target="_blank">
            <Icon name="ext" size={16} />
            View storefront
          </Link>
          <div className="side-foot">
            <div className="who">
              <span className="avatar">{initials(user.fullName || user.email)}</span>
              <div>
                <strong>{user.fullName}</strong>
                <span>{user.email}</span>
              </div>
            </div>
            <button className="logout" onClick={signOut} aria-label="Sign out" title="Sign out">
              <Icon name="logout" size={18} />
            </button>
          </div>
        </aside>
        <main className="main">{children}</main>
      </div>
      <Toast />
    </div>
  );
}
