"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import Logo from "@/components/shared/Logo";

const ACTION_BTN_CLASS =
  "relative flex flex-col items-center gap-[4.81px] cursor-pointer bg-transparent border-none p-0 [&_svg]:w-[28.83px] [&_svg]:h-[28.83px]";
const ACTION_LABEL_CLASS =
  "[font-family:'Inter',sans-serif] not-italic font-medium text-[14.42px] leading-[19px] text-center text-[#111827] whitespace-nowrap";

const NAV_ITEMS = [
  {
    label: "Account",
    path: "/account",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    label: "Orders",
    path: "/orders",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    label: "Wishlist",
    path: "/wishlist",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    ),
  },
  {
    label: "Cart",
    path: "/cart",
    badge: 3,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
  },
];

/* ─── Hamburger icon ─────────────────────────────────────────────────── */
function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg
      className="w-6 h-6 text-[#111827] transition-all duration-300"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {open ? (
        <>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </>
      ) : (
        <>
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </>
      )}
    </svg>
  );
}

/* ─── Mobile Sidebar ─────────────────────────────────────────────────── */
function MobileSidebar({
  open,
  onClose,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}) {
  /* lock body scroll when sidebar is open */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer — slides in from the right */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-[280px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
          <Logo size="sm" />
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              onClick={() => { onNavigate(item.path); onClose(); }}
              className="w-full flex items-center gap-4 px-6 py-4 hover:bg-orange-50 hover:text-orange-500 transition-colors group text-left"
            >
              {/* Icon */}
              <span className="relative flex-shrink-0 w-6 h-6 text-gray-500 group-hover:text-orange-500 transition-colors">
                {item.icon}
                {item.badge && (
                  <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full">
                    {item.badge}
                  </span>
                )}
              </span>
              {/* Label */}
              <span className="[font-family:'Inter',sans-serif] font-medium text-[15px] text-gray-800 group-hover:text-orange-500 transition-colors">
                {item.label}
              </span>
              {/* Arrow */}
              <svg className="ml-auto w-4 h-4 text-gray-400 group-hover:text-orange-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </nav>

        {/* Bottom CTA */}
        <div className="p-5 border-t border-[#E5E7EB]">
          <button
            onClick={() => { onNavigate("/login"); onClose(); }}
            className="w-full py-3 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-[15px] [font-family:'Inter',sans-serif] transition-colors"
          >
            Sign In / Sign Up
          </button>
        </div>
      </aside>
    </>
  );
}

/* ─── Main Navbar ────────────────────────────────────────────────────── */
export default function Navbar() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const requireAuth = (authedPath: string) => () => {
    const { isAuthenticated } = useAuthStore.getState();
    router.push(isAuthenticated ? authedPath : "/login");
  };

  const handleNavigate = (path: string) => {
    const { isAuthenticated } = useAuthStore.getState();
    router.push(isAuthenticated ? path : "/login");
  };

  return (
    <>
      <nav className="w-full bg-[rgba(255,255,255,0.9)] border-b border-[#E5E7EB] shadow-[0px_1.2px_3.6px_rgba(0,0,0,0.1),0px_1.2px_2.4px_-1.2px_rgba(0,0,0,0.1)]">

        {/* ── Row 1: Logo + Desktop search + Desktop actions + Mobile hamburger ── */}
        <div className="flex w-full flex-row items-center justify-between px-12 h-24 max-lg:px-6 max-md:px-4 max-md:h-[60px]">

          {/* Logo */}
          <Logo size="lg" />

          {/* Search Bar — desktop only (hidden on mobile) */}
          <div className="flex flex-1 flex-row items-center px-[38px] h-[57.67px] max-md:hidden">
            <div className="relative w-full h-full">
              <svg className="pointer-events-none absolute left-[19px] top-1/2 z-[1] h-5 w-5 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                className="absolute left-0 top-0 box-border h-full w-full rounded-full border border-[#E5E7EB] bg-[#F8FAFC] py-0 pl-[46px] pr-[19px] [font-family:'Inter',sans-serif] not-italic font-normal text-[15px] leading-[23px] text-[rgba(17,24,39,1)] outline-none placeholder:text-[rgba(17,24,39,0.5)]"
                type="text"
                placeholder="Search for products, brands..."
              />
            </div>
          </div>

          {/* Desktop nav actions — hidden on mobile */}
          <div className="flex shrink-0 flex-row items-center gap-[28.83px] max-md:hidden">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                className={ACTION_BTN_CLASS}
                onClick={requireAuth(item.path)}
              >
                {item.badge && (
                  <div className="absolute left-[9.61px] top-[-4.81px] z-[2] flex h-5 w-5 items-center justify-center rounded-full bg-[#F97316]">
                    <span className="[font-family:'Inter',sans-serif] font-medium text-[11px] leading-none text-white">{item.badge}</span>
                  </div>
                )}
                <span className="w-[28.83px] h-[28.83px] text-[#111827]">{item.icon}</span>
                <span className={ACTION_LABEL_CLASS}>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Mobile hamburger — visible only on mobile */}
          <button
            className="hidden max-md:flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <HamburgerIcon open={sidebarOpen} />
          </button>

        </div>

        {/* ── Row 2 (mobile only): Search bar full width ── */}
        <div className="hidden max-md:block px-4 pb-3">
          <div className="relative h-[42px] w-full">
            <svg className="pointer-events-none absolute left-[14px] top-1/2 z-[1] h-4 w-4 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="absolute left-0 top-0 box-border h-full w-full rounded-full border border-[#E5E7EB] bg-[#F8FAFC] py-0 pl-[38px] pr-[14px] [font-family:'Inter',sans-serif] not-italic font-normal text-[14px] leading-[23px] text-[rgba(17,24,39,1)] outline-none placeholder:text-[rgba(17,24,39,0.5)]"
              type="text"
              placeholder="Search for products, brands..."
            />
          </div>
        </div>

      </nav>

      {/* Mobile Sidebar */}
      <MobileSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={handleNavigate}
      />
    </>
  );
}
