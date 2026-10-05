"use client";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import adminService from "@/services/admin/admin.service";
import { useAuth } from "@/hooks/useAuth";
import { Icon, Toast } from "@/components/admin/ui";
import { useAdminSession } from "@/components/admin/useAdminSession";
import { ADMIN_REFRESH_EVENT } from "@/components/admin/refresh";

type Count = "orders" | "returns" | "stock";

/** `adminOnly` pages are hidden from catalog staff (FR-AD-08); the API returns 403 for them too. */
const NAV: Array<{ href: string; label: string; icon: string; count?: Count; adminOnly?: boolean }> = [
  { href: "/admin/products", label: "Products", icon: "box" },
  { href: "/admin/orders", label: "Orders", icon: "orders", count: "orders", adminOnly: true },
  { href: "/admin/returns", label: "Returns", icon: "undo", count: "returns", adminOnly: true },
  { href: "/admin/inventory", label: "Inventory", icon: "stack", count: "stock" },
  { href: "/admin/customers", label: "Customers", icon: "users", adminOnly: true },
  { href: "/admin/analytics", label: "Analytics", icon: "chart", adminOnly: true },
  { href: "/admin/settings", label: "Settings", icon: "gear", adminOnly: true },
];

const adminOnlyPath = (path: string) => NAV.some((n) => n.adminOnly && path.startsWith(n.href));

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
  const { ready, isStaff, isAdmin, user } = useAdminSession();
  const [counts, setCounts] = useState<Record<Count, number>>({ orders: 0, returns: 0, stock: 0 });
  const blocked = isStaff && !isAdmin && adminOnlyPath(pathname);

  useEffect(() => {
    if (ready && !isStaff) router.replace("/admin/login");
  }, [ready, isStaff, router]);

  // Catalog staff opening an admin-only page land on Products (FR-AD-08).
  useEffect(() => {
    if (blocked) router.replace("/admin/products");
  }, [blocked, router]);

  const loadCounts = useCallback(async () => {
    try {
      const stock = (await adminService.inventoryStats()).data.data;
      const next: Record<Count, number> = { orders: 0, returns: 0, stock: stock ? stock.lowStock + stock.outOfStock : 0 };
      // Order stats are admin only; catalog staff would get a 403.
      if (isAdmin) {
        const o = (await adminService.orderStats()).data.data;
        const by = o?.byStatus ?? {};
        const r = o?.returnsByStatus ?? {};
        next.orders = (by.PAID ?? 0) + (by.CONFIRMED ?? 0);
        next.returns = (r.REQUESTED ?? 0) + (r.APPROVED ?? 0) + (r.RECEIVED ?? 0);
      }
      setCounts(next);
    } catch {
      // Counts are a convenience; the pages report their own errors.
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isStaff) return;
    loadCounts();
    window.addEventListener(ADMIN_REFRESH_EVENT, loadCounts);
    return () => window.removeEventListener(ADMIN_REFRESH_EVENT, loadCounts);
  }, [isStaff, loadCounts]);

  if (!isStaff || !user) return <div className="dla" />;

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
            <span>{isAdmin ? "Admin" : "Catalog"}</span>
          </div>
          <nav className="snav">
            {NAV.filter((item) => isAdmin || !item.adminOnly).map((item) => {
              const n = item.count ? counts[item.count] : 0;
              return (
                <Link key={item.href} href={item.href} aria-current={pathname.startsWith(item.href) ? "page" : undefined}>
                  <Icon name={item.icon} />
                  {item.label}
                  {n ? <span className="n">{n}</span> : null}
                </Link>
              );
            })}
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
        <main className="main">{blocked ? null : children}</main>
      </div>
      <Toast />
    </div>
  );
}
