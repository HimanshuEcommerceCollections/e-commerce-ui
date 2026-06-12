"use client";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import Logo from "@/components/shared/Logo";

const ACTION_BTN_CLASS =
  "relative flex flex-col items-center gap-[4.81px] cursor-pointer bg-transparent border-none p-0 [&_svg]:w-[28.83px] [&_svg]:h-[28.83px]";
const ACTION_LABEL_CLASS =
  "[font-family:'Inter',sans-serif] not-italic font-medium text-[14.42px] leading-[19px] text-center text-[#111827] whitespace-nowrap max-sm:text-[12px] max-sm:leading-[16px]";

export default function Navbar() {
  const router = useRouter();

  /* Account actions are gated: if there's no logged-in user (no token),
     send them to /login; otherwise continue to the requested page. */
  const requireAuth = (authedPath: string) => () => {
    const { isAuthenticated } = useAuthStore.getState();
    router.push(isAuthenticated ? authedPath : "/login");
  };

  return (
    <nav className="w-full h-[97px] bg-[rgba(255,255,255,0.9)] border-b border-[#E5E7EB] shadow-[0px_1.2px_3.6px_rgba(0,0,0,0.1),0px_1.2px_2.4px_-1.2px_rgba(0,0,0,0.1)] max-md:h-auto max-md:py-2">
      <div className="flex w-full flex-row items-center justify-between px-12 h-24 max-lg:px-6 max-md:flex-wrap max-md:h-auto">

        {/* Logo */}
        <Logo size="lg" />

        {/* Search Bar */}
        <div className="flex flex-1 flex-row items-start px-[38px] h-[57.67px] max-md:order-3 max-md:w-full max-md:basis-full max-md:px-0 max-md:pb-3 max-md:h-auto">
          <div className="relative w-full h-[57.67px]">
            <svg className="pointer-events-none absolute left-[19px] top-1/2 z-[1] h-6 w-6 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="absolute left-0 top-0 box-border h-full w-full rounded-full border border-[#E5E7EB] bg-[#F8FAFC] py-0 pl-[58px] pr-[19px] [font-family:'Inter',sans-serif] not-italic font-normal text-[19.22px] leading-[23px] text-[rgba(17,24,39,1)] outline-none placeholder:text-[rgba(17,24,39,0.5)]"
              type="text"
              placeholder="Search for products, brands, and more..."
            />
          </div>
        </div>

        {/* Nav Actions */}
        <div className="flex shrink-0 flex-row items-center gap-[28.83px] max-md:gap-4">

          {/* Account */}
          <button className={ACTION_BTN_CLASS} onClick={requireAuth("/account")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span className={ACTION_LABEL_CLASS}>Account</span>
          </button>

          {/* Orders */}
          <button className={ACTION_BTN_CLASS} onClick={requireAuth("/orders")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            <span className={ACTION_LABEL_CLASS}>Orders</span>
          </button>

          {/* Wishlist */}
          <button className={ACTION_BTN_CLASS} onClick={requireAuth("/wishlist")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
            <span className={ACTION_LABEL_CLASS}>Wishlist</span>
          </button>

          {/* Cart */}
          <button className={ACTION_BTN_CLASS} onClick={requireAuth("/cart")}>
            <div className="absolute left-[9.61px] top-[-4.81px] z-[2] flex h-6 w-6 items-center justify-center rounded-full bg-[#F97316]">
              <span className="[font-family:'Inter',sans-serif] font-medium text-[14.42px] leading-[19px] text-center text-white">3</span>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <span className={ACTION_LABEL_CLASS}>Cart</span>
          </button>

        </div>
      </div>
    </nav>
  );
}
