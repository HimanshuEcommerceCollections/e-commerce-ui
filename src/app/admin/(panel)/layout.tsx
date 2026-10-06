"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import adminService from "@/services/admin/admin.service";
import { useAuth } from "@/hooks/useAuth";
import { Icon, PANEL_ROLE_LABEL, Toast, initials } from "@/components/admin/ui";
import { useAdminSession } from "@/components/admin/useAdminSession";
import { ADMIN_REFRESH_EVENT } from "@/components/admin/refresh";

type Count = "orders" | "stock";

/**
 * The design's five sections. `adminOnly` sections are hidden from catalog staff
 * (FR-AD-08) and the API answers 403 for them too. `also` lists routes that live
 * under a section: returns are a tab of Orders, the event funnel is part of Reports.
 */
const NAV: Array<{ href: string; label: string; icon: string; count?: Count; adminOnly?: boolean; also?: string[] }> = [
  { href: "/admin/products", label: "Products", icon: "box" },
  { href: "/admin/orders", label: "Orders", icon: "orders", count: "orders", adminOnly: true, also: ["/admin/returns"] },
  { href: "/admin/inventory", label: "Inventory", icon: "stack", count: "stock" },
  { href: "/admin/customers", label: "Customers", icon: "users", adminOnly: true },
  { href: "/admin/reports", label: "Reports", icon: "chart", adminOnly: true, also: ["/admin/analytics"] },
];
const ADMIN_ONLY = [...NAV.filter((n) => n.adminOnly).flatMap((n) => [n.href, ...(n.also ?? [])]), "/admin/settings"];

const inSection = (path: string, n: (typeof NAV)[number]) => [n.href, ...(n.also ?? [])].some((h) => path.startsWith(h));

/**
 * On phones the design shows tables as stacked cards, each value labelled with
 * its column header. The labels come from the header row, so pages don't repeat them.
 */
function useCellLabels(root: RefObject<HTMLElement>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const label = () => {
      el.querySelectorAll<HTMLTableElement>(".twrap table").forEach((t) => {
        const heads = Array.from(t.querySelectorAll("thead th")).map((th) => th.textContent?.trim() ?? "");
        t.querySelectorAll("tbody tr").forEach((tr) =>
          Array.from(tr.children).forEach((td, i) => {
            const want = (td as HTMLTableCellElement).colSpan > 1 ? "" : heads[i] ?? "";
            if (td.getAttribute("data-label") !== want) td.setAttribute("data-label", want);
          })
        );
      });
    };
    label();
    const mo = new MutationObserver(label);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [root]);
}

export default function AdminPanelLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { ready, isStaff, isAdmin, user, role } = useAdminSession();
  const [counts, setCounts] = useState<Record<Count, number>>({ orders: 0, stock: 0 });
  const blocked = isStaff && !isAdmin && ADMIN_ONLY.some((h) => pathname.startsWith(h));
  const rootRef = useRef<HTMLDivElement>(null);
  useCellLabels(rootRef);

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
      const next: Record<Count, number> = { orders: 0, stock: stock ? stock.lowStock + stock.outOfStock : 0 };
      // Order stats are admin only; catalog staff would get a 403.
      if (isAdmin) {
        const o = (await adminService.orderStats()).data.data;
        next.orders = o?.awaitingFulfilment?.UNFULFILLED ?? 0;
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

  if (!isStaff || !user) return <div className="dla" ref={rootRef} />;

  const signOut = () => {
    logout();
    router.replace("/admin/login");
  };
  const name = user.fullName || user.email;
  const roleLabel = PANEL_ROLE_LABEL[role ?? ""] ?? "Staff";

  const menu = (where: "top" | "foot") => (
    <UserMenu
      where={where}
      name={name}
      email={user.email}
      roleLabel={roleLabel}
      isAdmin={isAdmin}
      onSignOut={signOut}
      settingsActive={pathname.startsWith("/admin/settings")}
    />
  );

  return (
    <div className="dla" ref={rootRef}>
      <div className="app">
        <aside className="side" aria-label="Admin navigation">
          <div className="brandrow">
            <b>Ecommerce Collections</b>
            <span>Admin</span>
            <div className="side-top">{menu("top")}</div>
          </div>
          <nav className="snav">
            {NAV.filter((item) => isAdmin || !item.adminOnly).map((item) => {
              const n = item.count ? counts[item.count] : 0;
              return (
                <Link key={item.href} href={item.href} aria-current={inSection(pathname, item) ? "page" : undefined}>
                  <Icon name={item.icon} />
                  {item.label}
                  {n ? <span className="n" aria-label={`${n} ${item.count === "orders" ? "to fulfil" : "low or out of stock"}`}>{n}</span> : null}
                </Link>
              );
            })}
          </nav>
          <Link href="/" className="store-link" target="_blank">
            <Icon name="ext" size={16} />
            View storefront
          </Link>
          <div className="side-foot">{menu("foot")}</div>
        </aside>
        <main className="main" id="main">{blocked ? null : children}</main>
      </div>
      <Toast />
    </div>
  );
}

/** The signed-in user chip; opens Settings (admins) and Sign out. */
function UserMenu({
  where,
  name,
  email,
  roleLabel,
  isAdmin,
  settingsActive,
  onSignOut,
}: {
  where: "top" | "foot";
  name: string;
  email: string;
  roleLabel: string;
  isAdmin: boolean;
  settingsActive: boolean;
  onSignOut: () => void;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  // Close after navigating, and on a click outside.
  useEffect(() => ref.current?.removeAttribute("open"), [pathname]);
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current?.open && !ref.current.contains(e.target as Node)) ref.current.removeAttribute("open");
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);
  return (
    <details className={`umenu ${where}`} ref={ref}>
      <summary aria-label={`${name}, ${roleLabel}. Account menu`}>
        <span className="avatar">{initials(name)}</span>
        {where === "foot" ? (
          <>
            <div className="who">
              <strong>{name}</strong>
              <span>{roleLabel}</span>
            </div>
            <Icon name="chevron" size={16} />
          </>
        ) : null}
      </summary>
      <div className="umenu-list" role="menu">
        <div className="umenu-head">
          <strong>{name}</strong>
          <span>{email}</span>
          <span className="pill p-ok">{roleLabel}</span>
        </div>
        {isAdmin ? (
          <Link href="/admin/settings" role="menuitem" aria-current={settingsActive ? "page" : undefined}>
            <Icon name="gear" size={18} />
            Store settings
          </Link>
        ) : null}
        <button role="menuitem" onClick={onSignOut}>
          <Icon name="logout" size={18} />
          Sign out
        </button>
      </div>
    </details>
  );
}
