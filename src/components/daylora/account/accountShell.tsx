"use client";

import { createContext, useContext, type MouseEvent, type ReactNode } from "react";
import { DayloraIcon } from "../DayloraIcons";
import type { AccountSummary } from "@/types/api/shopping.types";

/* ---------------------------------------------------------------------------
   What the account shell (Account.tsx) shares with the views it renders.
   --------------------------------------------------------------------------- */

export type AccountView =
  | "overview"
  | "orders"
  | "returns"
  | "buyagain"
  | "saved"
  | "reviews"
  | "profile"
  | "addresses"
  | "payments"
  | "credit"
  | "security"
  | "notifications"
  | "privacy";

export const NAV_GROUPS: { group: string; items: { v: AccountView; icon: string; label: string }[] }[] = [
  {
    group: "Shopping",
    items: [
      { v: "overview", icon: "home", label: "Account overview" },
      { v: "orders", icon: "truck", label: "Orders" },
      { v: "returns", icon: "return", label: "Returns & refunds" },
      { v: "buyagain", icon: "cart", label: "Buy again" },
      { v: "saved", icon: "heart", label: "Saved items" },
      { v: "reviews", icon: "star", label: "Your reviews" },
    ],
  },
  {
    group: "Settings",
    items: [
      { v: "profile", icon: "user", label: "Profile" },
      { v: "addresses", icon: "pin", label: "Addresses" },
      { v: "payments", icon: "card", label: "Payment methods" },
      { v: "credit", icon: "gift", label: "Store credit & gift cards" },
      { v: "security", icon: "lock", label: "Login & security" },
      { v: "notifications", icon: "bell", label: "Notifications" },
      { v: "privacy", icon: "shield", label: "Privacy & data" },
    ],
  },
];

export const ALL_VIEWS: AccountView[] = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.v));
export const VIEW_TITLE = Object.fromEntries(NAV_GROUPS.flatMap((g) => g.items.map((i) => [i.v, i.label]))) as Record<
  AccountView,
  string
>;

export interface AccountShell {
  /** GET /api/users/me/summary; null while loading or if it failed. */
  summary: AccountSummary | null;
  /** Re-reads the summary (nav badges, overview tiles) after a change. */
  refreshSummary: () => void;
  /** Switches section (pushes #view; from an order page, navigates to /account#view). */
  go: (v: AccountView) => void;
  signOut: () => void;
}

export const AccountShellContext = createContext<AccountShell>({
  summary: null,
  refreshSummary: () => {},
  go: () => {},
  signOut: () => {},
});
export const useAccountShell = () => useContext(AccountShellContext);

/** href + onClick for an in-account link, so it works with and without JS routing. */
export function useGoLink() {
  const { go } = useAccountShell();
  return (v: AccountView) => ({
    href: v === "overview" ? "/account" : `/account#${v}`,
    onClick: (e: MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
      e.preventDefault();
      go(v);
    },
  });
}

/** The section heading every view starts with: title, optional line, optional action on the right. */
export function ViewHead({ title, sub, right }: { title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="sub-h">
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/** Empty state card: icon, heading, line and an optional call to action. */
export function EmptyBox({ icon, title, text, children }: { icon: string; title: ReactNode; text: ReactNode; children?: ReactNode }) {
  return (
    <div className="card empty">
      <span className="gate-ic" aria-hidden="true">
        <DayloraIcon name={icon} />
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
      {children}
    </div>
  );
}

/** Icons the account uses that the site-wide sprite doesn't have (design: your-account). */
export function AccountIconSprite() {
  const s = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <symbol id="i-heart" viewBox="0 0 24 24" {...s}>
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
      </symbol>
      <symbol id="i-card" viewBox="0 0 24 24" {...s}>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20M6 15h4" />
      </symbol>
      <symbol id="i-star" viewBox="0 0 24 24" {...s} strokeLinecap={undefined}>
        <path d="M12 2.8l2.9 5.9 6.4.9-4.7 4.5 1.1 6.4L12 17.5l-5.7 3 1.1-6.4-4.7-4.5 6.4-.9z" />
      </symbol>
      <symbol id="i-lock" viewBox="0 0 24 24" {...s}>
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </symbol>
      <symbol id="i-bell" viewBox="0 0 24 24" {...s}>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
      </symbol>
      <symbol id="i-file" viewBox="0 0 24 24" {...s}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M8 13h8M8 17h5" />
      </symbol>
      <symbol id="i-home" viewBox="0 0 24 24" {...s}>
        <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
      </symbol>
      <symbol id="i-pin" viewBox="0 0 24 24" {...s}>
        <path d="M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21z" />
        <circle cx="12" cy="9.5" r="2.5" />
      </symbol>
      <symbol id="i-device" viewBox="0 0 24 24" {...s}>
        <rect x="2" y="4" width="15" height="11" rx="1.5" />
        <path d="M6 19h7M9.5 15v4" />
        <rect x="17" y="8" width="5" height="11" rx="1" />
      </symbol>
      <symbol id="i-phone" viewBox="0 0 24 24" {...s}>
        <rect x="6" y="2" width="12" height="20" rx="2" />
        <path d="M11 18h2" />
      </symbol>
    </svg>
  );
}
