"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { BrandMark } from "@/components/daylora/BrandMark";
import sellerService from "@/services/seller/seller.service";
import { useAuthStore } from "@/store/useAuthStore";
import type { ReviewActivity } from "@/types/api/seller.types";
import { Ico, initials, rel, type IconName } from "./ui";

export function Brand({ href = "/merchant", tag = true }: { href?: string; tag?: boolean }) {
  return (
    <Link className="sp-brand" href={href} aria-label="Ecommerce Collections Seller Portal">
      <BrandMark />
      <span>Ecommerce Collections</span>
      {tag ? <span className="sp-tag">Seller</span> : null}
    </Link>
  );
}

type NavItem = { href: string; icon: IconName; label: string; exact?: boolean; also?: string[] };
const NAV: { group?: string; items: NavItem[] }[] = [
  { items: [{ href: "/merchant", icon: "home", label: "Dashboard", exact: true }] },
  {
    group: "Products",
    items: [
      { href: "/merchant/add", icon: "plus", label: "Add products", exact: true, also: ["/merchant/add/product"] },
      { href: "/merchant/add/bulk", icon: "upload", label: "Bulk upload" },
      { href: "/merchant/products", icon: "list", label: "My products" },
      { href: "/merchant/submissions", icon: "doc", label: "Submissions" },
    ],
  },
  {
    group: "Business",
    items: [
      { href: "/merchant/orders", icon: "cart", label: "Orders and earnings" },
      { href: "/merchant/documents", icon: "shield", label: "Documents" },
    ],
  },
];

const isCurrent = (path: string, item: NavItem) =>
  item.also?.includes(path) || (item.exact ? path === item.href : path === item.href || path.startsWith(`${item.href}/`));

/** How a review step reads in the bell and the dashboard feed. */
export function describeActivity(a: ReviewActivity): { tone: "ok" | "bad" | "warn" | "info"; icon: IconName; title: string } {
  switch (a.status) {
    case "APPROVED":
      return {
        tone: "ok",
        icon: "check",
        title: a.kind === "DELIST" ? "Delisting approved" : a.kind === "EDIT" ? "Change approved" : "Approved and live",
      };
    case "REJECTED":
      return { tone: "bad", icon: "x", title: a.kind === "EDIT" ? "Change not approved" : "Not approved" };
    case "CHANGES_REQUESTED":
      return { tone: "warn", icon: "doc", title: "Changes requested" };
    case "IN_REVIEW":
      return { tone: "info", icon: "clock", title: "Review started" };
    default:
      return { tone: "info", icon: "info", title: "Update" };
  }
}

/** Review notifications, derived from the catalog team's steps on the seller's submissions. */
function Bell({ userId }: { userId: string }) {
  const key = `sp-seen-${userId}`;
  const [items, setItems] = useState<ReviewActivity[]>([]);
  const [seen, setSeen] = useState(0);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      setItems((await sellerService.activity(20)).data.data ?? []);
    } catch {
      /* the bell stays quiet when the feed is unavailable */
    }
  }, []);

  useEffect(() => {
    try {
      setSeen(Number(localStorage.getItem(key) ?? 0));
    } catch {
      /* storage unavailable */
    }
    void load();
    const t = setInterval(load, 120_000);
    return () => clearInterval(t);
  }, [key, load]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const unread = items.filter((a) => new Date(a.at).getTime() > seen).length;
  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (!next && items.length) {
      // Closing marks everything shown as read; the highlight stays while it's open.
      const latest = new Date(items[0].at).getTime();
      setSeen(latest);
      try {
        localStorage.setItem(key, String(latest));
      } catch {
        /* storage unavailable */
      }
    }
    if (next) void load();
  };

  return (
    <div ref={box} style={{ position: "relative" }}>
      <button
        type="button"
        className="sp-btn sp-btn-ghost sp-btn-sm sp-bell"
        aria-label={unread ? `Notifications, ${unread} new` : "Notifications"}
        aria-expanded={open}
        onClick={toggle}
      >
        <Ico name="bell" />
        {unread ? <span className="sp-dot">{unread > 9 ? "9+" : unread}</span> : null}
      </button>
      {open ? (
        <div className="sp-pop" role="dialog" aria-label="Notifications">
          <div className="sp-pop-h">
            <b>From our review team</b>
            <Link className="sp-lnk" href="/merchant/submissions" onClick={toggle}>
              All submissions
            </Link>
          </div>
          {items.length ? (
            <ol>
              {items.map((a) => {
                const d = describeActivity(a);
                return (
                  <li key={a.id} className={new Date(a.at).getTime() > seen ? "sp-unread" : ""}>
                    <Link href={`/merchant/submissions/${a.reference}`} onClick={toggle}>
                      <span className={`sp-fd sp-${d.tone}`}>
                        <Ico name={d.icon} />
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <p>
                          {d.title}: <b>{a.productName}</b>
                        </p>
                        {a.note ? <small>{a.note.length > 120 ? `${a.note.slice(0, 120)}…` : a.note}</small> : null}
                        <small>
                          {a.reference} · {rel(a.at)}
                        </small>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="sp-empty">
              <Ico name="bell" />
              <p>No notifications yet. Review decisions show up here.</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function SellerShell({ children }: { children: ReactNode }) {
  const path = usePathname() ?? "/merchant";
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const name = user?.fullName || user?.email || "Seller";
  const ini = initials(name);

  const out = async () => {
    await signOut();
    router.replace("/merchant/login");
  };

  return (
    <div className="sp-app">
      <aside className="sp-side" aria-label="Seller navigation">
        <Brand />
        <nav className="sp-nav">
          {NAV.map((g, i) => (
            <div key={g.group ?? i}>
              {g.group ? <p className="sp-grp">{g.group}</p> : null}
              {g.items.map((item) => (
                <Link key={item.href} href={item.href} aria-current={isCurrent(path, item) ? "page" : undefined}>
                  <Ico name={item.icon} />
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="sp-me">
          <span className="sp-av">{ini}</span>
          <span style={{ minWidth: 0, flex: 1 }}>
            <b>{user?.fullName}</b>
            <small>{user?.email}</small>
          </span>
          <button type="button" className="sp-btn sp-btn-ghost sp-btn-sm" onClick={out} aria-label="Sign out" title="Sign out">
            <Ico name="out" />
          </button>
        </div>
      </aside>
      <div style={{ minWidth: 0 }}>
        <header className="sp-top">
          <span className="sp-mb">
            <Brand />
          </span>
          <span className="sp-right">
            {user ? <Bell userId={user.userId} /> : null}
            <span className="sp-nm">{name}</span>
            <span className="sp-av" aria-hidden="true">
              {ini}
            </span>
            <button type="button" className="sp-btn sp-btn-ghost sp-btn-sm sp-mb" onClick={out} aria-label="Sign out">
              <Ico name="out" />
            </button>
          </span>
        </header>
        <nav className="sp-mnav" aria-label="Seller navigation">
          {NAV.flatMap((g) => g.items).map((item) => (
            <Link key={item.href} href={item.href} aria-current={isCurrent(path, item) ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="sp-main" id="main">
          {children}
        </main>
      </div>
    </div>
  );
}
