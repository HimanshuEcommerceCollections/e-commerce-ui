"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DayloraIcon } from "../DayloraIcons";
import authService from "@/services/auth.service";
import shoppingService from "@/services/account/shopping.service";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useSavedItems } from "@/hooks/useSavedItems";
import type { AccountSummary } from "@/types/api/shopping.types";
import { AccountToastContext, Crumbs, Toast, useMounted, useToast } from "./customerShared";
import {
  ALL_VIEWS,
  AccountIconSprite,
  AccountShellContext,
  NAV_GROUPS,
  VIEW_TITLE,
  type AccountShell,
  type AccountView,
} from "./accountShell";
import { OrderDetailView, OrdersView } from "./AccountOrders";
import { InvoiceView } from "./AccountInvoice";
import { OverviewView } from "./AccountOverview";
import { BuyAgainView, ReturnsView, ReviewsView, SavedView } from "./AccountShopping";
import ProfileView from "./views/ProfileView";
import AddressesView from "./views/AddressesView";
import PaymentsView from "./views/PaymentsView";
import StoreCreditView from "./views/StoreCreditView";
import SecurityView from "./views/SecurityView";
import NotificationsView from "./views/NotificationsView";
import PrivacyView from "./views/PrivacyView";

/** Old links: #details became Profile. */
const ALIASES: Record<string, AccountView> = { details: "profile" };

function viewFromHash(): AccountView {
  const h = (typeof window !== "undefined" ? window.location.hash : "").slice(1);
  if (ALIASES[h]) return ALIASES[h];
  return (ALL_VIEWS as string[]).includes(h) ? (h as AccountView) : "overview";
}

const VIEWS: Record<AccountView, () => ReactNode> = {
  overview: () => <OverviewView />,
  orders: () => <OrdersView />,
  returns: () => <ReturnsView />,
  buyagain: () => <BuyAgainView />,
  saved: () => <SavedView />,
  reviews: () => <ReviewsView />,
  profile: () => <ProfileView />,
  addresses: () => <AddressesView />,
  payments: () => <PaymentsView />,
  credit: () => <StoreCreditView />,
  security: () => <SecurityView />,
  notifications: () => <NotificationsView />,
  privacy: () => <PrivacyView />,
};

/**
 * Your account (design: your-account): /account#overview|orders|returns|buyagain|saved|reviews|
 * profile|addresses|payments|credit|security|notifications|privacy, /account/orders/[idOrNumber]
 * for one order and /account/orders/[idOrNumber]/invoice for its invoice.
 */
export function Account({ orderRef, invoice = false }: { orderRef?: string; invoice?: boolean }) {
  const mounted = useMounted();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [view, setView] = useState<AccountView>("overview");
  const [orderLabel, setOrderLabel] = useState<string | null>(null);
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [summaryTick, setSummaryTick] = useState(0);
  const { toast, show } = useToast();
  const saved = useSavedItems();

  // The hash picks the section (and follows back/forward).
  useEffect(() => {
    if (orderRef) return;
    const sync = () => {
      const h = window.location.hash.slice(1);
      if (ALIASES[h]) history.replaceState(null, "", `#${ALIASES[h]}`);
      setView(viewFromHash());
    };
    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, [orderRef]);

  useEffect(() => {
    if (!mounted || !user) return;
    let live = true;
    shoppingService
      .getSummary()
      .then((r) => live && setSummary(r.data.data ?? null))
      .catch(() => undefined); // badges and tiles just stay empty
    return () => {
      live = false;
    };
  }, [mounted, user, summaryTick]);

  useEffect(() => {
    if (!mounted) return;
    const t = !user
      ? "Your account"
      : orderRef
        ? `${invoice ? "Invoice" : "Order"} ${orderLabel ?? orderRef}`
        : view === "overview"
          ? "Your account"
          : VIEW_TITLE[view];
    document.title = `${t} | Ecommerce Collections`;
  }, [mounted, user, view, orderRef, invoice, orderLabel]);

  const go = useCallback(
    (v: AccountView) => {
      if (orderRef) {
        router.push(v === "overview" ? "/account" : `/account#${v}`);
        return;
      }
      setView(v);
      try {
        history.pushState(null, "", v === "overview" ? window.location.pathname : `#${v}`);
      } catch {
        /* ignore */
      }
      window.scrollTo(0, 0);
    },
    [orderRef, router]
  );

  const signOut = useCallback(() => {
    // Revoke this session on the server (contract C8); sign out locally either way.
    const token = useAuthStore.getState().user?.accessToken;
    authService.logout(token).catch(() => undefined);
    clearAuth();
    useCartStore.getState().reset();
    router.push("/");
  }, [clearAuth, router]);

  const refreshSummary = useCallback(() => setSummaryTick((n) => n + 1), []);
  const shell = useMemo<AccountShell>(() => ({ summary, refreshSummary, go, signOut }), [summary, refreshSummary, go, signOut]);
  const onLoaded = useCallback((n: string) => setOrderLabel(n), []);

  if (!mounted) {
    return (
      <main id="main" className="cx pg acct" aria-busy="true">
        <div className="daylora-container">
          <div className="skel" style={{ height: 320, marginTop: 48 }} />
        </div>
      </main>
    );
  }

  const current: AccountView = orderRef ? "orders" : view;
  const counts: Partial<Record<AccountView, number>> = {
    orders: summary?.orders.open ?? 0,
    returns: summary?.openReturns ?? 0,
    saved: saved.ready ? saved.ids.size : (summary?.savedItems ?? 0),
  };

  const home = { label: "Home", href: "/" };
  const acct = { label: "Your account", href: "/account" };
  const ordersCrumb = { label: "Orders", href: "/account#orders" };
  const trail = !user
    ? [home, { label: "Your account" }]
    : orderRef
      ? [home, acct, ordersCrumb, { label: invoice ? "Invoice" : (orderLabel ?? orderRef) }]
      : view === "overview"
        ? [home, { label: "Your account" }]
        : [home, acct, { label: VIEW_TITLE[view] }];

  const initials = (user?.fullName ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .filter((_, i, a) => i === 0 || i === a.length - 1)
    .join("")
    .toUpperCase();

  return (
    <main id="main" className="cx pg acct">
      <AccountIconSprite />
      <div className="daylora-container">
        <Crumbs trail={trail} />
        {!user ? (
          <section className="card gate" aria-labelledby="gateH">
            <span className="gate-ic" aria-hidden="true">
              <DayloraIcon name="user" />
            </span>
            <h1 id="gateH">Sign in to your account</h1>
            <p>See your orders, start returns, save items for later and check out faster.</p>
            <div className="gate-btns">
              <Link
                href={`/login?next=${encodeURIComponent(orderRef ? `/account/orders/${orderRef}${invoice ? "/invoice" : ""}` : "/account")}`}
                className="btn btn-primary"
              >
                Sign in
              </Link>
              <Link href="/login?mode=create" className="btn btn-secondary">
                Create account
              </Link>
            </div>
            <div className="gate-links">
              <Link href="/track" className="link">
                Track an order
              </Link>
              <Link href="/help?t=returns" className="link">
                Return an item
              </Link>
            </div>
          </section>
        ) : (
          <AccountShellContext.Provider value={shell}>
            <AccountToastContext.Provider value={show}>
              <div className="acct-grid">
                <aside className="acct-nav" aria-label="Account sections">
                  <div className="me-card">
                    <span className="avatar" aria-hidden="true">
                      {initials || "?"}
                    </span>
                    <div>
                      <p className="hi">{user.fullName?.trim() || "Your account"}</p>
                      <p className="me-mail">{user.email}</p>
                    </div>
                  </div>
                  <nav className="anav" aria-label="Your account">
                    {NAV_GROUPS.map((g) => (
                      <div className="ng" key={g.group}>
                        <p className="ng-h">{g.group}</p>
                        {g.items.map((n) => {
                          const c = counts[n.v] ?? 0;
                          return (
                            <Link
                              key={n.v}
                              href={n.v === "overview" ? "/account" : `/account#${n.v}`}
                              onClick={(e) => {
                                if (orderRef) return; // a real navigation back to /account
                                e.preventDefault();
                                go(n.v);
                              }}
                              aria-current={current === n.v ? "page" : undefined}
                            >
                              <DayloraIcon name={n.icon} />
                              {n.label}
                              {c > 0 && (
                                <span className="cnt" aria-label={`${c} open`}>
                                  {c}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    ))}
                  </nav>
                  <button type="button" className="link signout" onClick={signOut}>
                    <DayloraIcon name="arrow" />
                    Sign out
                  </button>
                </aside>
                <div className="acct-main">
                  {orderRef ? (
                    invoice ? (
                      <InvoiceView orderRef={orderRef} onLoaded={onLoaded} />
                    ) : (
                      <OrderDetailView orderRef={orderRef} onLoaded={onLoaded} />
                    )
                  ) : (
                    <>
                      {view !== "overview" && (
                        <Link
                          href="/account"
                          className="mback m-only"
                          onClick={(e) => {
                            e.preventDefault();
                            go("overview");
                          }}
                        >
                          <DayloraIcon name="arrow" />
                          Your account
                        </Link>
                      )}
                      {VIEWS[view]()}
                    </>
                  )}
                </div>
              </div>
            </AccountToastContext.Provider>
          </AccountShellContext.Provider>
        )}
      </div>
      <Toast toast={toast} />
    </main>
  );
}
