"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { DayloraIcon } from "../DayloraIcons";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { Crumbs, Toast, firstName, useMounted, useToast } from "./customerShared";
import { OrderDetailView, OrdersView } from "./AccountOrders";
import { AddressesView, DetailsView } from "./AccountProfile";

type View = "orders" | "addresses" | "details";
const VIEWS: View[] = ["orders", "addresses", "details"];
const NAV: { v: View; label: string; icon: string }[] = [
  { v: "orders", label: "Orders", icon: "truck" },
  { v: "addresses", label: "Addresses", icon: "store" },
  { v: "details", label: "Account details", icon: "user" },
];
const TITLE: Record<View, string> = { orders: "Your orders", addresses: "Addresses", details: "Account details" };

const viewFromHash = (): View => {
  const h = (typeof window !== "undefined" ? window.location.hash : "").slice(1) as View;
  return VIEWS.includes(h) ? h : "orders";
};

/**
 * Your account (design 08): /account#orders|#addresses|#details and
 * /account/orders/[idOrNumber] for one order (FR-ST-12, FR-IN-04, FR-AD-07).
 */
export function Account({ orderRef }: { orderRef?: string }) {
  const mounted = useMounted();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [view, setView] = useState<View>("orders");
  const [orderLabel, setOrderLabel] = useState<string | null>(null);
  const { toast, show } = useToast();

  // The hash picks the section (and follows back/forward).
  useEffect(() => {
    if (orderRef) return;
    setView(viewFromHash());
    const onHash = () => setView(viewFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [orderRef]);

  useEffect(() => {
    if (!mounted) return;
    const t = !user ? "Your account" : orderRef ? `Order ${orderLabel ?? orderRef}` : TITLE[view];
    document.title = `${t} | Ecommerce Collections`;
  }, [mounted, user, view, orderRef, orderLabel]);

  const go = (v: View) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (orderRef) return; // a real navigation back to /account#…
    e.preventDefault();
    setView(v);
    try {
      history.replaceState(null, "", `#${v}`);
    } catch {
      /* ignore */
    }
    window.scrollTo(0, 0);
  };

  const signOut = () => {
    clearAuth();
    useCartStore.getState().reset();
    router.push("/");
  };

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

  const trail = [{ label: "Home", href: "/" }, ...(orderRef && user ? [{ label: "Your account", href: "/account#orders" }, { label: orderLabel ?? orderRef }] : [{ label: "Your account" }])];

  return (
    <main id="main" className="cx pg acct">
      <div className="daylora-container">
        <Crumbs trail={trail} />
        {!user ? (
          <section className="card gate" aria-labelledby="gateH">
            <span className="gate-ic" aria-hidden="true">
              <DayloraIcon name="user" />
            </span>
            <h1 id="gateH">Sign in to see your orders</h1>
            <p>Track packages, start returns and check out faster with your saved address.</p>
            <div className="gate-btns">
              <Link href={`/login?next=${encodeURIComponent(orderRef ? `/account/orders/${orderRef}` : "/account")}`} className="btn btn-primary">
                Sign in
              </Link>
              <Link href="/login?mode=create" className="btn btn-secondary">
                Create account
              </Link>
            </div>
            <Link href="/track" className="link">
              Track an order without an account
            </Link>
          </section>
        ) : (
          <div className="acct-grid">
            <aside className="acct-nav" aria-label="Account sections">
              <p className="hi">Hi, {firstName(user.fullName)}</p>
              <nav className="anav" aria-label="Your account">
                {NAV.map((n) => (
                  <Link
                    key={n.v}
                    href={`/account#${n.v}`}
                    onClick={go(n.v)}
                    aria-current={(orderRef ? "orders" : view) === n.v ? "page" : undefined}
                  >
                    <DayloraIcon name={n.icon} />
                    {n.label}
                  </Link>
                ))}
              </nav>
              <button type="button" className="signout" onClick={signOut}>
                Sign out
              </button>
            </aside>
            <div className="acct-main">
              {orderRef ? (
                <OrderDetailView orderRef={orderRef} toast={show} onLoaded={onLoaded} />
              ) : view === "orders" ? (
                <OrdersView toast={show} />
              ) : view === "addresses" ? (
                <AddressesView toast={show} />
              ) : (
                <DetailsView toast={show} />
              )}
            </div>
          </div>
        )}
      </div>
      <Toast toast={toast} />
    </main>
  );
}
