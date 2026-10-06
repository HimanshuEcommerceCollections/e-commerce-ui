"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import accountService from "@/services/account.service";
import addressService from "@/services/address.service";
import orderService from "@/services/order.service";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useStoreConfigState } from "@/hooks/useStoreConfig";
import { getApiErrorMessage } from "@/lib/apiError";
import { track } from "@/lib/analytics";
import type { AddressResponse } from "@/types/api/address.types";
import type { CheckoutQuote, ShippingAddressInput, ShippingMethod } from "@/types/api/order.types";
import { DayloraIcon } from "../DayloraIcons";
import { baseProductName, usd } from "./catalog";
import { CART_NOTICE_KEY, lineProblem } from "./DayloraCart";
import { addBusinessDays, CheckoutFooter, CheckoutHeader, fmtDay, saveGuestOrder } from "./checkoutShared";

// ─── US address data and formatting (design 05) ──────────────────────────────

const STATES: [string, string][] = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"], ["CO", "Colorado"],
  ["CT", "Connecticut"], ["DE", "Delaware"], ["DC", "District of Columbia"], ["FL", "Florida"], ["GA", "Georgia"],
  ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"],
  ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"], ["MA", "Massachusetts"],
  ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"],
  ["NE", "Nebraska"], ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"],
  ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"],
  ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"], ["SD", "South Dakota"],
  ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"],
  ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
];

const digits = (s: string) => s.replace(/\D/g, "");

function formatPhone(v: string): string {
  const d = digits(v).replace(/^1/, "").slice(0, 10);
  if (d.length > 6) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length > 3) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return d;
}

function formatZip(v: string): string {
  const d = digits(v).slice(0, 9);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

interface FormValues {
  email: string;
  optIn: boolean;
  fname: string;
  lname: string;
  addr1: string;
  addr2: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
}
type Field = Exclude<keyof FormValues, "optIn" | "addr2">;

const EMPTY: FormValues = { email: "", optIn: false, fname: "", lname: "", addr1: "", addr2: "", city: "", state: "", zip: "", phone: "" };

const RULES: Record<Field, (v: string) => string> = {
  email: (v) => (!v ? "Enter your email address." : !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v) ? "Enter an email like name@example.com." : ""),
  fname: (v) => (v ? "" : "Enter your first name."),
  lname: (v) => (v ? "" : "Enter your last name."),
  addr1: (v) => (!v ? "Enter your street address." : !/\d/.test(v) ? "Include a house or building number." : ""),
  city: (v) => (v ? "" : "Enter your city."),
  state: (v) => (v ? "" : "Select your state."),
  zip: (v) => (!v ? "Enter your ZIP code." : !/^\d{5}(-\d{4})?$/.test(v) ? "Enter a 5-digit ZIP code." : ""),
  phone: (v) => (!v ? "Enter a phone number for delivery questions." : digits(v).length !== 10 ? "Enter a 10-digit US phone number." : ""),
};
const ADDRESS_FIELDS: Field[] = ["fname", "lname", "addr1", "city", "state", "zip", "phone"];
const FIELD_ORDER: Field[] = ["email", ...ADDRESS_FIELDS];

// ─── One checkout attempt (idempotency + "same order on retry") ──────────────

/**
 * Kept in sessionStorage so a retry, a decline or a reload reuses the same
 * Idempotency-Key and the same order instead of creating a second one.
 */
interface Attempt {
  key: string;
  /** Request fingerprint: a different request needs a different key. */
  sig: string;
  /** Cart fingerprint: a changed cart abandons a reserved order. */
  cartSig: string;
  orderNumber?: string;
  clientSecret?: string | null;
  guestToken?: string;
  email?: string;
  form?: FormValues;
  method?: ShippingMethod;
}
const ATTEMPT_KEY = "ec-checkout-attempt";

const readAttempt = (): Attempt | null => {
  try {
    return JSON.parse(sessionStorage.getItem(ATTEMPT_KEY) || "null");
  } catch {
    return null;
  }
};
const writeAttempt = (a: Attempt | null) => {
  try {
    if (a) sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify(a));
    else sessionStorage.removeItem(ATTEMPT_KEY);
  } catch {
    /* storage blocked: retries get a fresh key */
  }
};
const newKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

// ─── Stripe ──────────────────────────────────────────────────────────────────

const stripeCache = new Map<string, Promise<Stripe | null>>();
const getStripe = (key: string) => {
  if (!stripeCache.has(key)) stripeCache.set(key, loadStripe(key));
  return stripeCache.get(key)!;
};

interface StripeHandle {
  ready: () => boolean;
  /** Validates the Payment Element before the order is created. */
  submit: () => Promise<string | null>;
  /** Confirms the payment; returns an error message or null on success. */
  confirm: (clientSecret: string, returnUrl: string) => Promise<{ error: string | null; declined: boolean }>;
}

/** Stripe's Payment Element (cards and wallets). Card data never reaches our code (NFR-07). */
const StripePane = forwardRef<StripeHandle>(function StripePane(_, ref) {
  const stripe = useStripe();
  const elements = useElements();
  useImperativeHandle(
    ref,
    () => ({
      ready: () => !!stripe && !!elements,
      submit: async () => {
        if (!elements) return "Payment form is still loading. Try again in a moment.";
        const { error } = await elements.submit();
        return error ? error.message ?? "Check your payment details." : null;
      },
      confirm: async (clientSecret, returnUrl) => {
        if (!stripe || !elements) return { error: "Payment form is still loading. Try again in a moment.", declined: false };
        const { error } = await stripe.confirmPayment({
          elements,
          clientSecret,
          confirmParams: { return_url: returnUrl },
          redirect: "if_required",
        });
        if (!error) return { error: null, declined: false };
        return { error: error.message ?? "Your payment didn't go through.", declined: error.type === "card_error" };
      },
    }),
    [stripe, elements]
  );
  return (
    <div className="stripe-box">
      <PaymentElement options={{ layout: "accordion" }} />
    </div>
  );
});

// ─── Page ────────────────────────────────────────────────────────────────────

/**
 * Checkout (design 05, FR-ST-10): contact, US shipping address, delivery with
 * real dates, payment and a live order summary from POST /api/checkout/quote.
 * Guest by default; signed-in customers get their profile and saved addresses.
 *
 * Payment: under Stripe the order is created first (guest or signed-in
 * endpoint, stable Idempotency-Key per attempt) and its clientSecret is
 * confirmed with the Payment Element. A decline keeps the shopper here with
 * the same order to retry (FR-IN-01/02). Under the manual gateway the order is
 * placed directly and the store confirms payment.
 */
export function DayloraCheckout() {
  const { config, failed: configFailed } = useStoreConfigState();
  const stripeKey = config?.paymentProvider === "stripe" ? config.stripePublishableKey : null;
  const [quoteTotal, setQuoteTotal] = useState<{ amount: number; currency: string } | null>(null);

  const page = (
    <CheckoutForm
      stripeEnabled={!!stripeKey}
      configLoading={!config && !configFailed}
      onTotal={setQuoteTotal}
    />
  );

  if (!stripeKey) return page;
  return (
    <Elements
      stripe={getStripe(stripeKey)}
      options={{
        mode: "payment",
        amount: Math.max(50, Math.round((quoteTotal?.amount ?? 0) * 100)),
        currency: (quoteTotal?.currency ?? config?.currency ?? "USD").toLowerCase(),
        appearance: {
          theme: "stripe",
          variables: { colorPrimary: "#16794C", colorText: "#1A2433", colorDanger: "#B42318", borderRadius: "8px", fontFamily: "Inter, system-ui, sans-serif" },
        },
      }}
    >
      {page}
    </Elements>
  );
}

function CheckoutForm({
  stripeEnabled,
  configLoading,
  onTotal,
}: {
  stripeEnabled: boolean;
  configLoading: boolean;
  onTotal: (t: { amount: number; currency: string }) => void;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const signedIn = user?.role === "ROLE_CUSTOMER";
  const cart = useCartStore((s) => s.cart);
  const guestLines = useCartStore((s) => s.lines);
  const refreshCart = useCartStore((s) => s.refresh);
  const clearCart = useCartStore((s) => s.clear);
  const { config } = useStoreConfigState();

  const [cartFailed, setCartFailed] = useState(false);
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [line2Open, setLine2Open] = useState(false);
  const [method, setMethod] = useState<ShippingMethod>("STANDARD");
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [addrChoice, setAddrChoice] = useState<string>("new");
  const [saveAddress, setSaveAddress] = useState(true);
  const [profileOptIn, setProfileOptIn] = useState<boolean | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [payAlert, setPayAlert] = useState<{ title: string; body: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const stripeRef = useRef<StripeHandle>(null);
  const payAlertRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const inputs = useRef<Partial<Record<Field, HTMLInputElement | HTMLSelectElement | null>>>({});

  // ── Load cart, profile, saved addresses ──
  useEffect(() => {
    refreshCart().catch(() => setCartFailed(true));
  }, [refreshCart]);

  useEffect(() => {
    if (!signedIn) return;
    let live = true;
    Promise.allSettled([accountService.getProfile(), addressService.getAll()]).then(([p, a]) => {
      if (!live) return;
      const profile = p.status === "fulfilled" ? p.value.data.data : null;
      const list = a.status === "fulfilled" ? a.value.data.data ?? [] : [];
      setAddresses(list);
      const def = list.find((x) => x.isDefault) ?? list[0];
      if (def) setAddrChoice((c) => (c === "new" ? def.id : c));
      if (profile) {
        setProfileOptIn(profile.marketingOptIn);
        const [first, ...rest] = (profile.fullName || "").trim().split(/\s+/);
        setValues((v) => ({
          ...v,
          email: profile.email,
          optIn: profile.marketingOptIn,
          fname: v.fname || first || "",
          lname: v.lname || rest.join(" "),
          phone: v.phone || (profile.phoneNumber ? formatPhone(profile.phoneNumber) : ""),
        }));
      }
    });
    return () => {
      live = false;
    };
  }, [signedIn]);

  const items = useMemo(() => cart?.items ?? [], [cart]);
  const cartSig = useMemo(
    () => items.map((i) => `${i.productId}:${i.quantity}`).sort().join("|"),
    [items]
  );

  // A reserved order from an earlier try (decline, reload, return from a bank page).
  useEffect(() => {
    if (!cart) return;
    const a = readAttempt();
    if (!a) return;
    if (a.orderNumber && a.cartSig !== cartSig && items.length > 0) {
      writeAttempt(null); // the cart changed since: that reservation is stale
      return;
    }
    setAttempt(a);
    if (a.orderNumber && a.form) {
      setValues(a.form);
      if (a.form.addr2) setLine2Open(true);
      if (a.method) setMethod(a.method);
    }
    if (a.orderNumber && params.get("payment") === "failed") {
      setPayAlert({ title: "Your payment didn't go through.", body: "You haven't been charged. Try again or use another payment method." });
    }
    // Only on first load of the cart.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart !== null]);

  const reserved = !!attempt?.orderNumber;

  // Lines with stock problems go back to the cart (FR-ST-13).
  useEffect(() => {
    if (!cart || reserved || busy) return;
    if (items.some((i) => lineProblem(i))) {
      try {
        sessionStorage.setItem(CART_NOTICE_KEY, "Some items in your cart changed. Review them before you check out.");
      } catch {
        /* ignore */
      }
      router.replace("/cart");
    }
  }, [cart, items, reserved, busy, router]);

  // ── Live summary (POST /api/checkout/quote) ──
  const loadQuote = useCallback(async () => {
    if (!cart || items.length === 0) return;
    try {
      setQuoteError(null);
      const lines = signedIn ? undefined : guestLines;
      const res = await orderService.quote(method, lines);
      const q = res.data.data ?? null;
      setQuote(q);
      if (q) onTotal({ amount: q.grandTotal, currency: q.currency });
    } catch (e) {
      setQuoteError(getApiErrorMessage(e, "We couldn't work out your total."));
    }
  }, [cart, items.length, signedIn, guestLines, method, onTotal]);

  useEffect(() => {
    if (!reserved) loadQuote();
  }, [loadQuote, reserved, cartSig]);

  // ── Field handling ──
  const usingSaved = signedIn && addrChoice !== "new";
  const activeFields = useMemo<Field[]>(
    () => FIELD_ORDER.filter((f) => !(usingSaved && ADDRESS_FIELDS.includes(f)) && !(signedIn && f === "email")),
    [usingSaved, signedIn]
  );

  const check = (f: Field, v = values[f]) => {
    const msg = RULES[f](String(v).trim());
    setErrors((e) => ({ ...e, [f]: msg }));
    return msg;
  };

  const setField = (f: keyof FormValues, raw: string | boolean) => {
    let v = raw;
    if (f === "phone" && typeof v === "string") v = formatPhone(v);
    if (f === "zip" && typeof v === "string") v = formatZip(v);
    setValues((s) => ({ ...s, [f]: v }));
    if (f in RULES && errors[f as Field]) check(f as Field, v as string);
  };

  const onFirstInteraction = () => {
    if (started.current) return;
    started.current = true;
    track("CHECKOUT_START", { value: quote?.grandTotal ?? cart?.grandTotalEstimate, currency: quote?.currency ?? "USD" });
  };

  const fieldProps = (f: Field) => ({
    id: f,
    value: values[f] as string,
    "aria-invalid": errors[f] ? true : undefined,
    "aria-describedby": `${f}-e`,
    onBlur: () => {
      if (values[f] || errors[f]) check(f);
    },
  });
  const fieldClass = (f: Field) => `field${errors[f] ? " bad" : values[f] && errors[f] === "" && f !== "state" ? " good" : ""}`;
  const err = (f: Field) => (
    <p className="err" id={`${f}-e`}>
      {errors[f] && (
        <>
          <DayloraIcon name="alert" className="icon" style={{ width: 14, height: 14 }} />
          {errors[f]}
        </>
      )}
    </p>
  );

  const contactDone = signedIn || !RULES.email(values.email.trim());
  const addressDone = usingSaved || ADDRESS_FIELDS.every((f) => !RULES[f](String(values[f]).trim()));

  // ── Place order ──
  const addressInput = (): ShippingAddressInput => ({
    recipientName: `${values.fname.trim()} ${values.lname.trim()}`.trim(),
    phone: values.phone.trim() || undefined,
    addressLine1: values.addr1.trim(),
    addressLine2: values.addr2.trim() || undefined,
    city: values.city.trim(),
    state: values.state,
    postalCode: values.zip.trim(),
    country: "US",
  });

  const showPayAlert = (title: string, body: string) => {
    setPayAlert({ title, body });
    requestAnimationFrame(() => {
      payAlertRef.current?.focus();
      payAlertRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const backToCart = (message: string) => {
    try {
      sessionStorage.setItem(CART_NOTICE_KEY, message);
    } catch {
      /* ignore */
    }
    writeAttempt(null);
    refreshCart().catch(() => undefined);
    router.push("/cart");
  };

  const finish = async (orderNumber: string, guest?: { token: string; email: string }) => {
    if (guest) saveGuestOrder({ orderNumber, guestToken: guest.token, email: guest.email });
    if (signedIn && profileOptIn !== null && values.optIn !== profileOptIn) {
      accountService.updateProfile({ marketingOptIn: values.optIn }).catch(() => undefined);
    }
    writeAttempt(null);
    setBusy("Opening your confirmation…");
    await clearCart().catch(() => undefined);
    router.push(`/order-confirmation/${encodeURIComponent(orderNumber)}`);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    onFirstInteraction();
    setPayAlert(null);
    setFormError(null);
    if (busy) return;

    if (!reserved) {
      const next: Partial<Record<Field, string>> = {};
      for (const f of activeFields) next[f] = RULES[f](String(values[f]).trim());
      setErrors((s) => ({ ...s, ...next }));
      const first = activeFields.find((f) => next[f]);
      if (first) {
        const el = inputs.current[first];
        el?.focus();
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }

    if (stripeEnabled) {
      if (!stripeRef.current?.ready()) {
        showPayAlert("Payment form is still loading.", "Give it a moment, then place your order again.");
        return;
      }
      const msg = await stripeRef.current.submit();
      if (msg) {
        showPayAlert("Check your payment details.", msg);
        return;
      }
    }

    let a = attempt ?? readAttempt();
    try {
      // 1. Create the order once per attempt (a retry with the same key replays it).
      if (!a?.orderNumber) {
        const body = signedIn
          ? usingSaved
            ? { addressId: addrChoice, shippingMethod: method }
            : { shippingAddress: addressInput(), saveAddress, shippingMethod: method }
          : {
              email: values.email.trim(),
              marketingOptIn: values.optIn,
              shippingAddress: addressInput(),
              shippingMethod: method,
              items: guestLines,
            };
        const sig = JSON.stringify(body);
        const key = a && a.sig === sig && a.key ? a.key : newKey();
        a = { key, sig, cartSig };
        writeAttempt(a);
        setBusy("Placing your order…");

        let orderNumber: string;
        let clientSecret: string | null;
        let guestToken: string | undefined;
        if (signedIn) {
          const res = await orderService.checkout(body as Parameters<typeof orderService.checkout>[0], key);
          ({ clientSecret } = res.data.data!);
          orderNumber = res.data.data!.order.orderNumber;
        } else {
          const res = await orderService.guestCheckout(body as Parameters<typeof orderService.guestCheckout>[0], key);
          ({ clientSecret, guestToken } = res.data.data!);
          orderNumber = res.data.data!.order.orderNumber;
        }
        const email = signedIn ? values.email : values.email.trim();
        a = { ...a, orderNumber, clientSecret, guestToken, email, form: values, method };
        writeAttempt(a);
        if (guestToken) saveGuestOrder({ orderNumber, guestToken, email });

        // Manual gateway: the store confirms payment later.
        if (!stripeEnabled || !clientSecret) {
          await finish(orderNumber, guestToken ? { token: guestToken, email } : undefined);
          return;
        }
        setAttempt(a);
      }

      // 2. Confirm the payment for this order (again, after a decline).
      setBusy("Processing your payment…");
      const returnUrl = `${window.location.origin}/order-confirmation/${encodeURIComponent(a.orderNumber!)}`;
      const result = await stripeRef.current!.confirm(a.clientSecret!, returnUrl);
      if (result.error) {
        setBusy(null);
        showPayAlert(
          result.declined ? "Your card was declined." : "Your payment didn't go through.",
          `${result.error} You haven't been charged. Try again or use another payment method.`
        );
        return;
      }
      await finish(a.orderNumber!, a.guestToken ? { token: a.guestToken, email: a.email ?? values.email } : undefined);
    } catch (e2) {
      setBusy(null);
      const status = (e2 as { response?: { status?: number } }).response?.status;
      const msg = getApiErrorMessage(e2, "We couldn't place your order. Check your connection and try again.");
      if (status === 409) {
        backToCart(`${msg}. We've updated your cart — review it and check out again.`);
        return;
      }
      if (status === 422) {
        writeAttempt(null); // the key can't be reused for this request
        setAttempt(null);
      }
      if (/cart is empty/i.test(msg)) {
        backToCart("Your cart is empty.");
        return;
      }
      setFormError(msg);
    }
  };

  const startOver = () => {
    writeAttempt(null);
    setAttempt(null);
    setPayAlert(null);
    loadQuote();
  };

  // ── Render ──
  const shell = (body: ReactNode) => (
    <div className="co-page">
      <a className="skip" href="#main">Skip to content</a>
      <CheckoutHeader back="cart" />
      <main id="main" className="co">
        <div className="daylora-container">{body}</div>
      </main>
      <CheckoutFooter />
    </div>
  );

  if (cartFailed && !cart) {
    return shell(
      <div className="co-empty">
        <h1>We couldn&apos;t load checkout</h1>
        <p>Check your connection and try again.</p>
        <button className="btn btn-primary" onClick={() => { setCartFailed(false); refreshCart().catch(() => setCartFailed(true)); }}>
          Try again
        </button>
      </div>
    );
  }
  if (!cart) {
    return shell(
      <div className="co-grid" aria-busy="true">
        <div className="skel" style={{ height: 640 }} />
        <div className="skel" style={{ height: 360 }} />
      </div>
    );
  }
  if (items.length === 0 && !reserved && !busy) {
    return shell(
      <div className="co-empty">
        <h1>Your cart is empty</h1>
        <p>Add something to your cart to check out.</p>
        <Link href="/catalog" className="btn btn-primary">Continue shopping</Link>
      </div>
    );
  }

  const lines = (quote?.lines ?? items).filter((l) => l.available);
  const count = lines.reduce((n, l) => n + l.quantity, 0);
  const options = quote?.shippingOptions ?? [];
  const chosen = options.find((o) => o.method === method);
  const total = quote?.grandTotal ?? null;
  const now = new Date();
  const returnDays = config?.returnWindowDays ?? 30;

  const summary = (
    <aside className={`co-sum${summaryOpen ? " open" : ""}`} id="coSummary" aria-labelledby="coSumH">
      <div className="sum-card">
        <h2 id="coSumH">Order summary {!reserved && <Link href="/cart" className="link">Edit cart</Link>}</h2>
        <ul className="mini">
          {lines.map((l) => {
            const v = [l.color, l.size].filter(Boolean).join(" · ") || l.variantName || "";
            const was = l.mrp && l.mrp > l.unitPrice ? l.mrp * l.quantity : 0;
            return (
              <li key={l.productId}>
                <span className="m">
                  {l.primaryImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.primaryImageUrl} alt="" />
                  ) : (
                    <DayloraIcon name="box" />
                  )}
                  <span className="q" aria-label={`Quantity ${l.quantity}`}>{l.quantity}</span>
                </span>
                <span className="n">
                  {baseProductName(l.productName, l.color, l.size)}
                  {v && <small>{v}</small>}
                </span>
                <span className="pr">
                  {usd(l.unitPrice * l.quantity)}
                  {was > 0 && <s><span className="sr-only">Was </span>{usd(was)}</s>}
                </span>
              </li>
            );
          })}
        </ul>
        {quote ? (
          <>
            <dl className="sum-rows">
              <dt>Subtotal ({count} item{count === 1 ? "" : "s"})</dt>
              <dd>{usd(quote.subtotal)}</dd>
              {quote.savings > 0 && (
                <>
                  <dt className="good">Your savings</dt>
                  <dd className="good">−{usd(quote.savings)}<span className="sr-only"> included in subtotal</span></dd>
                </>
              )}
              <dt>Shipping · {method === "EXPRESS" ? "Express" : "Standard"}</dt>
              <dd>{quote.shippingTotal === 0 ? <span className="good">Free</span> : usd(quote.shippingTotal)}</dd>
              <dt>{quote.pricesIncludeTax ? "Tax (included)" : "Tax"}</dt>
              <dd>{usd(quote.taxTotal)}</dd>
            </dl>
            <div className="sum-total"><span>Total</span><b>{usd(quote.grandTotal)}</b></div>
          </>
        ) : quoteError ? (
          <div className="co-alert" role="alert">
            <DayloraIcon name="alert" />
            <span>
              <b>{quoteError}</b>
              <button type="button" className="link" onClick={loadQuote} style={{ minHeight: 0 }}>Try again</button>
            </span>
          </div>
        ) : (
          <div className="skel" style={{ height: 150 }} aria-label="Loading totals" />
        )}
      </div>
      <ul className="sum-assure">
        <li><DayloraIcon name="return" /><span><b>Free {returnDays}-day returns</b>On most items</span></li>
        <li><DayloraIcon name="headset" /><span><b>Need help?</b><Link href="/help?t=contact" style={{ textDecoration: "underline" }}>Contact us</Link> or read our <Link href="/help?t=faq" style={{ textDecoration: "underline" }}>FAQs</Link></span></li>
      </ul>
    </aside>
  );

  return shell(
    <>
      <button
        type="button"
        className="sum-toggle"
        aria-expanded={summaryOpen}
        aria-controls="coSummary"
        onClick={() => setSummaryOpen((o) => !o)}
      >
        <DayloraIcon name="cart" />
        <span>{summaryOpen ? "Hide order summary" : "Show order summary"}</span>
        <DayloraIcon name="chev" className="icon chev" />
        <b>{total !== null ? usd(total) : ""}</b>
      </button>
      <div className="co-grid">
        <form className="co-form" noValidate aria-label="Checkout" onSubmit={submit} onFocus={onFirstInteraction}>
          <h1>Checkout</h1>

          {reserved && (
            <div className="co-info" role="status">
              <DayloraIcon name="check" />
              <span>
                <b>Order {attempt!.orderNumber} is reserved for you.</b>
                Finish payment below — your details are saved.{" "}
                <button type="button" className="link" style={{ minHeight: 0, display: "inline" }} onClick={startOver}>
                  Start over
                </button>
              </span>
            </div>
          )}

          <fieldset disabled={reserved || !!busy}>
            {/* 1. CONTACT */}
            <section className="step" aria-labelledby="s1">
              <div className="step-h">
                <span className={`num${contactDone ? " done" : ""}`}>1</span>
                <h2 id="s1">Contact</h2>
                {signedIn ? (
                  <span className="signed-as">Signed in as {user?.fullName?.split(" ")[0] || user?.email}</span>
                ) : (
                  <Link href="/login?next=checkout" className="link signin">
                    <span className="lg-only">Have an account?&nbsp;</span>Sign in
                  </Link>
                )}
              </div>
              {signedIn ? (
                <div className="field">
                  <span className="label" style={{ fontSize: 14, fontWeight: 600 }}>Email</span>
                  <div className="readonly-email">{values.email || user?.email}</div>
                  <p className="hint">For your order confirmation and delivery updates</p>
                </div>
              ) : (
                <div className={fieldClass("email")}>
                  <label htmlFor="email">Email</label>
                  <input
                    {...fieldProps("email")}
                    ref={(el) => { inputs.current.email = el; }}
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    required
                    aria-describedby="email-h email-e"
                    onChange={(e) => setField("email", e.target.value)}
                  />
                  <p className="hint" id="email-h">For your order confirmation and delivery updates</p>
                  {err("email")}
                </div>
              )}
              <label className="check">
                <input type="checkbox" checked={values.optIn} onChange={(e) => setField("optIn", e.target.checked)} />
                <span>Email me deals and new arrivals. You can unsubscribe anytime.</span>
              </label>
            </section>

            {/* 2. SHIPPING ADDRESS */}
            <section className="step" aria-labelledby="s2">
              <div className="step-h">
                <span className={`num${addressDone ? " done" : ""}`}>2</span>
                <h2 id="s2">Shipping address</h2>
              </div>
              {signedIn && addresses.length > 0 && (
                <div className="radios saved-addrs" role="radiogroup" aria-label="Saved addresses">
                  {addresses.map((a) => (
                    <label className="ro" key={a.id}>
                      <input type="radio" name="addr" value={a.id} checked={addrChoice === a.id} onChange={() => setAddrChoice(a.id)} />
                      <span className="t">
                        <span className="a-label">{a.recipientName}{a.isDefault && <i>Default</i>}</span>
                        <small className="a-lines">
                          {[a.addressLine1, a.addressLine2].filter(Boolean).join(", ")}, {a.city}, {a.state} {a.postalCode}
                        </small>
                      </span>
                    </label>
                  ))}
                  <label className="ro">
                    <input type="radio" name="addr" value="new" checked={addrChoice === "new"} onChange={() => setAddrChoice("new")} />
                    <span className="t">Use a new address</span>
                  </label>
                </div>
              )}
              {!usingSaved && (
                <>
                  <div className="row2">
                    <div className={fieldClass("fname")}>
                      <label htmlFor="fname">First name</label>
                      <input {...fieldProps("fname")} ref={(el) => { inputs.current.fname = el; }} autoComplete="given-name" required onChange={(e) => setField("fname", e.target.value)} />
                      {err("fname")}
                    </div>
                    <div className={fieldClass("lname")}>
                      <label htmlFor="lname">Last name</label>
                      <input {...fieldProps("lname")} ref={(el) => { inputs.current.lname = el; }} autoComplete="family-name" required onChange={(e) => setField("lname", e.target.value)} />
                      {err("lname")}
                    </div>
                  </div>
                  <div className={fieldClass("addr1")}>
                    <label htmlFor="addr1">Street address</label>
                    <input {...fieldProps("addr1")} ref={(el) => { inputs.current.addr1 = el; }} autoComplete="address-line1" required placeholder="123 Main St" onChange={(e) => setField("addr1", e.target.value)} />
                    {err("addr1")}
                  </div>
                  {line2Open ? (
                    <div className="field">
                      <label htmlFor="addr2">Apartment, suite or unit <span className="opt">(optional)</span></label>
                      <input id="addr2" autoComplete="address-line2" value={values.addr2} autoFocus={!reserved} onChange={(e) => setField("addr2", e.target.value)} />
                    </div>
                  ) : (
                    <button type="button" className="link add-line" aria-expanded={false} onClick={() => setLine2Open(true)}>
                      + Add apartment, suite or unit
                    </button>
                  )}
                  <div className="row3">
                    <div className={fieldClass("city")}>
                      <label htmlFor="city">City</label>
                      <input {...fieldProps("city")} ref={(el) => { inputs.current.city = el; }} autoComplete="address-level2" required onChange={(e) => setField("city", e.target.value)} />
                      {err("city")}
                    </div>
                    <div className={fieldClass("state")}>
                      <label htmlFor="state">State</label>
                      <select
                        {...fieldProps("state")}
                        ref={(el) => { inputs.current.state = el; }}
                        autoComplete="address-level1"
                        required
                        onChange={(e) => { setField("state", e.target.value); check("state", e.target.value); }}
                      >
                        <option value="">Select</option>
                        {STATES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                      </select>
                      {err("state")}
                    </div>
                    <div className={fieldClass("zip")}>
                      <label htmlFor="zip">ZIP code</label>
                      <input {...fieldProps("zip")} ref={(el) => { inputs.current.zip = el; }} autoComplete="postal-code" inputMode="numeric" maxLength={10} required onChange={(e) => setField("zip", e.target.value)} />
                      {err("zip")}
                    </div>
                  </div>
                  <div className={fieldClass("phone")}>
                    <label htmlFor="phone">Phone</label>
                    <input
                      {...fieldProps("phone")}
                      ref={(el) => { inputs.current.phone = el; }}
                      type="tel"
                      autoComplete="tel-national"
                      inputMode="tel"
                      required
                      placeholder="(555) 123-4567"
                      aria-describedby="phone-h phone-e"
                      onChange={(e) => setField("phone", e.target.value)}
                    />
                    <p className="hint" id="phone-h">Only used if the carrier needs to reach you about delivery</p>
                    {err("phone")}
                  </div>
                  {signedIn && (
                    <label className="check">
                      <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                      <span>Save this address to my account</span>
                    </label>
                  )}
                </>
              )}
              <p className="ship-to-note"><DayloraIcon name="truck" />We ship to all 50 states and DC.</p>
            </section>

            {/* 3. DELIVERY */}
            <section className="step" aria-labelledby="s3">
              <div className="step-h">
                <span className={`num${chosen ? " done" : ""}`}>3</span>
                <h2 id="s3">Delivery</h2>
              </div>
              <div className="radios" role="radiogroup" aria-labelledby="s3">
                {options.length === 0 && <div className="skel" style={{ height: 136 }} aria-label="Loading delivery options" />}
                {options.map((o) => (
                  <label className="ro" key={o.method}>
                    <input
                      type="radio"
                      name="ship"
                      value={o.method}
                      checked={method === o.method}
                      onChange={() => setMethod(o.method)}
                    />
                    <span className="t">
                      {o.method === "EXPRESS" ? "Express" : "Standard"}
                      <small>
                        Arrives {fmtDay(addBusinessDays(now, o.minDays))} – {fmtDay(addBusinessDays(now, o.maxDays))}
                      </small>
                    </span>
                    <span className={`p${o.free || o.fee === 0 ? " free" : ""}`}>{o.free || o.fee === 0 ? "Free" : usd(o.fee)}</span>
                  </label>
                ))}
              </div>
            </section>
          </fieldset>

          {/* 4. PAYMENT */}
          <section className="step" aria-labelledby="s4" id="paySec">
            <div className="step-h">
              <span className="num">4</span>
              <h2 id="s4">Payment</h2>
              {stripeEnabled && (
                <span className="secure-sm">
                  <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8.5 10.5V7.5a3.5 3.5 0 017 0v3" /></svg>
                  Encrypted
                </span>
              )}
            </div>
            {payAlert && (
              <div className="pay-alert" role="alert" tabIndex={-1} ref={payAlertRef}>
                <DayloraIcon name="alert" />
                <span><b>{payAlert.title}</b>{payAlert.body}</span>
              </div>
            )}
            {configLoading ? (
              <div className="skel" style={{ height: 96 }} aria-label="Loading payment options" />
            ) : stripeEnabled ? (
              <StripePane ref={stripeRef} />
            ) : (
              <div className="manual-pay">
                <DayloraIcon name="shield" />
                <span>
                  <b>Pay later — confirmed by the store</b>
                  No card details are needed here. Place your order and our team will confirm payment with you before it
                  ships. You&apos;ll get an email at each step.
                </span>
              </div>
            )}
          </section>

          {/* PLACE ORDER */}
          <section className="place">
            {formError && (
              <div className="co-alert" role="alert">
                <DayloraIcon name="alert" />
                <span><b>We couldn&apos;t place your order.</b>{formError}</span>
              </div>
            )}
            <button
              type="submit"
              className={`btn btn-primary btn-place${busy ? " busy" : ""}`}
              disabled={!!busy || (!quote && !reserved)}
            >
              <span className="lbl">
                {reserved ? "Pay now" : "Place order"}
                {total !== null ? ` · ${usd(total)}` : ""}
              </span>
              <span className="spin" aria-hidden="true" />
            </button>
            <p className="terms">
              By placing your order, you agree to our <Link href="/help?t=terms">Terms of use</Link> and{" "}
              <Link href="/help?t=privacy">Privacy policy</Link>. You can return most items within {returnDays} days.
            </p>
          </section>
        </form>
        {summary}
      </div>
      {busy && (
        <div className="proc">
          <div role="status" aria-live="assertive">
            <span className="spin lg" aria-hidden="true" />
            <p>{busy}</p>
            <small>Please don&apos;t close this page.</small>
          </div>
        </div>
      )}
    </>
  );
}
