import api from "@/lib/Axios";

/**
 * Storefront funnel events (FR-IN-05): product view, add to cart and checkout
 * start, plus searches. Purchases are recorded by the server when payment is
 * confirmed, so they can't be faked or blocked.
 *
 * Events are batched and sent to /api/analytics/events. When
 * NEXT_PUBLIC_GA_MEASUREMENT_ID is set they also go to Google Analytics 4.
 * Tracking never throws and never blocks the page.
 */
export type AnalyticsEventType = "PRODUCT_VIEW" | "ADD_TO_CART" | "CHECKOUT_START" | "SEARCH";

interface AnalyticsEvent {
  eventType: AnalyticsEventType;
  sessionId: string;
  productId?: string;
  value?: number;
  currency?: string;
  path?: string;
  properties?: Record<string, string | number | boolean | null>;
}

const GA_NAMES: Record<AnalyticsEventType, string> = {
  PRODUCT_VIEW: "view_item",
  ADD_TO_CART: "add_to_cart",
  CHECKOUT_START: "begin_checkout",
  SEARCH: "search",
};

const queue: AnalyticsEvent[] = [];
let timer: ReturnType<typeof setTimeout> | undefined;

function sessionId(): string {
  try {
    let id = sessionStorage.getItem("dl-session");
    if (!id) {
      id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Math.random()).slice(2);
      sessionStorage.setItem("dl-session", id);
    }
    return id;
  } catch {
    return "no-storage";
  }
}

function flush() {
  timer = undefined;
  const events = queue.splice(0, 25);
  if (!events.length) return;
  api.post("/api/analytics/events", { events }).catch(() => { /* analytics must never break the page */ });
  if (queue.length) timer = setTimeout(flush, 0);
}

export function track(
  eventType: AnalyticsEventType,
  data: Omit<AnalyticsEvent, "eventType" | "sessionId" | "path"> = {},
) {
  if (typeof window === "undefined") return;
  queue.push({ eventType, sessionId: sessionId(), path: window.location.pathname.slice(0, 500), ...data });
  timer ??= setTimeout(flush, 800);

  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (gtag) {
    gtag("event", GA_NAMES[eventType], {
      currency: data.currency,
      value: data.value,
      ...(data.productId ? { items: [{ item_id: data.productId }] } : {}),
      ...(data.properties ?? {}),
    });
  }
}

if (typeof window !== "undefined") {
  // Send what's queued when the shopper leaves the page.
  window.addEventListener("pagehide", flush);
}
