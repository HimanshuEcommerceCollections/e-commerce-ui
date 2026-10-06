import Link from "next/link";
import { DayloraIcon } from "../DayloraIcons";

/**
 * Bits shared by checkout (design 05) and the order confirmation (design 06):
 * the minimal header/footer, delivery-date maths and the session hand-off.
 */

/** A guest's order, readable on the confirmation page with its token (CONTRACT §4 Checkout). */
export interface GuestOrderRef {
  orderNumber: string;
  guestToken: string;
  email: string;
}

/** sessionStorage: the guest order this browser just placed. */
export const GUEST_ORDER_KEY = "ec-guest-order";

export function readGuestOrder(orderNumber?: string): GuestOrderRef | null {
  try {
    const ref = JSON.parse(sessionStorage.getItem(GUEST_ORDER_KEY) || "null") as GuestOrderRef | null;
    if (!ref?.orderNumber || !ref.guestToken) return null;
    if (orderNumber && ref.orderNumber.toUpperCase() !== orderNumber.toUpperCase()) return null;
    return ref;
  } catch {
    return null;
  }
}

export function saveGuestOrder(ref: GuestOrderRef) {
  try {
    sessionStorage.setItem(GUEST_ORDER_KEY, JSON.stringify(ref));
  } catch {
    /* storage blocked: the confirmation falls back to the tracking link */
  }
}

/** The date `n` business days (Mon–Fri) after `from` (CONTRACT §3). */
export function addBusinessDays(from: Date | string, n: number): Date {
  const d = new Date(from);
  while (n > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() % 6) n--;
  }
  return d;
}

/** "Fri, Oct 9". ISO dates without a time are read as local dates. */
export function fmtDay(d: Date | string): string {
  const date = typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T12:00:00`) : new Date(d);
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function CheckoutHeader({ back }: { back: "cart" | "shop" }) {
  return (
    <header className="co-header">
      <div className="daylora-container co-hrow">
        <Link href="/" className="logo">
          <span>Ecommerce Collections</span>
        </Link>
        {back === "cart" ? (
          <>
            <span className="co-secure">
              <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
                <rect x="5" y="10.5" width="14" height="10" rx="2" />
                <path d="M8.5 10.5V7.5a3.5 3.5 0 017 0v3" />
              </svg>
              Secure<span className="lg-only">&nbsp;checkout</span>
            </span>
            <Link href="/cart" className="co-back" aria-label="Back to cart">
              <DayloraIcon name="arrow" className="icon flip" />
              <span>Back to cart</span>
            </Link>
          </>
        ) : (
          <Link href="/catalog" className="co-back" aria-label="Continue shopping">
            <span>Continue shopping</span>
            <DayloraIcon name="arrow" />
          </Link>
        )}
      </div>
    </header>
  );
}

export function CheckoutFooter() {
  return (
    <footer className="co-foot">
      <div className="daylora-container">
        <nav aria-label="Help">
          <Link href="/help?t=shipping">Shipping</Link>
          <Link href="/help?t=returns">Returns &amp; refunds</Link>
          <Link href="/help?t=contact">Contact us</Link>
          <Link href="/help?t=privacy">Privacy policy</Link>
          <Link href="/help?t=terms">Terms of use</Link>
        </nav>
        <p>© {new Date().getFullYear()} Ecommerce Collections</p>
      </div>
    </footer>
  );
}
