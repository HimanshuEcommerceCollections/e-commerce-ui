/**
 * The promo code a shopper applied in the cart (design 04), kept for this tab
 * in sessionStorage `ec-promo` and sent with every cart, quote and checkout
 * call (CONTRACT B1). The server decides whether it is valid; this only
 * remembers the code.
 */
export const PROMO_KEY = "ec-promo";

/** The applied code, upper-case, or null. */
export function getPromoCode(): string | null {
  try {
    const code = sessionStorage.getItem(PROMO_KEY);
    return code ? code.trim().toUpperCase() || null : null;
  } catch {
    return null;
  }
}

/** Remembers the code (null forgets it). */
export function setPromoCode(code: string | null) {
  try {
    if (code) sessionStorage.setItem(PROMO_KEY, code.trim().toUpperCase());
    else sessionStorage.removeItem(PROMO_KEY);
  } catch {
    /* storage blocked: the code lasts until the page is left */
  }
}
