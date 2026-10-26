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
import {
  loadStripe,
  type ExpressCheckoutAddress,
  type ShippingRate,
  type Stripe,
  type StripeError,
  type StripeExpressCheckoutElementConfirmEvent,
} from "@stripe/stripe-js";
import { Elements, ExpressCheckoutElement, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import accountService from "@/services/account.service";
import addressService from "@/services/address.service";
import orderService from "@/services/order.service";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useStoreConfigState } from "@/hooks/useStoreConfig";
import { getApiErrorMessage } from "@/lib/apiError";
import { getPromoCode, setPromoCode } from "@/lib/promo";
import { track } from "@/lib/analytics";
import type { AddressResponse } from "@/types/api/address.types";
import type {
  CheckoutQuote,
  CheckoutRequest,
  GuestCheckoutRequest,
  ShippingAddressInput,
  ShippingMethod,
} from "@/types/api/order.types";
import type { TaxDestination } from "@/types/api/cart.types";
import { DayloraIcon } from "../DayloraIcons";
import { baseProductName, usd } from "./catalog";
import { CART_NOTICE_KEY, lineProblem } from "./DayloraCart";
import { addBusinessDays, CheckoutFooter, CheckoutHeader, fieldError, fmtDay, saveGuestOrder } from "./checkoutShared";

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
  /** Billing (card payments, contract B3). */
  billSame: boolean;
  baddr: string;
  bzip: string;
}
type Field = Exclude<keyof FormValues, "optIn" | "addr2" | "billSame">;

const EMPTY: FormValues = {
  email: "", optIn: false, fname: "", lname: "", addr1: "", addr2: "", city: "", state: "", zip: "", phone: "",
  billSame: true, baddr: "", bzip: "",
};

const RULES: Record<Field, (v: string) => string> = {
  email: (v) => (!v ? "Enter your email address." : !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v) ? "Enter an email like name@example.com." : ""),
  fname: (v) => (v ? "" : "Enter your first name."),
  lname: (v) => (v ? "" : "Enter your last name."),
  addr1: (v) => (!v ? "Enter your street address." : !/\d/.test(v) ? "Include a house or building number." : ""),
  city: (v) => (v ? "" : "Enter your city."),
  state: (v) => (v ? "" : "Select your state."),
  zip: (v) => (!v ? "Enter your ZIP code." : !/^\d{5}(-\d{4})?$/.test(v) ? "Enter a 5-digit ZIP code." : ""),
  phone: (v) => (!v ? "Enter a phone number for delivery questions." : digits(v).length !== 10 ? "Enter a 10-digit US phone number." : ""),
  baddr: (v) => (v ? "" : "Enter your billing street address."),
  bzip: (v) => (/^\d{5}(-\d{4})?$/.test(v) ? "" : "Enter a 5-digit billing ZIP code."),
};
const ADDRESS_FIELDS: Field[] = ["fname", "lname", "addr1", "city", "state", "zip", "phone"];
const BILLING_FIELDS: Field[] = ["baddr", "bzip"];
const FIELD_ORDER: Field[] = ["email", ...ADDRESS_FIELDS];

/** Where the backend's 400 field errors show on this form. */
const SERVER_FIELDS: Record<string, Field> = {
  email: "email",
  "shippingAddress.recipientName": "fname",
  "shippingAddress.addressLine1": "addr1",
  "shippingAddress.city": "city",
  "shippingAddress.state": "state",
  "shippingAddress.postalCode": "zip",
  "shippingAddress.phone": "phone",
  "billingAddress.addressLine1": "baddr",
  "billingAddress.postalCode": "bzip",
};

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

const confirmationUrl = (orderNumber: string) =>
  `${window.location.origin}/order-confirmation/${encodeURIComponent(orderNumber)}`;

// ─── Stripe ──────────────────────────────────────────────────────────────────

const stripeCache = new Map<string, Promise<Stripe | null>>();
const getStripe = (key: string) => {
  if (!stripeCache.has(key)) stripeCache.set(key, loadStripe(key));
  return stripeCache.get(key)!;
};

const STRIPE_APPEARANCE = {
  theme: "stripe" as const,
  variables: { colorPrimary: "#16794C", colorText: "#1A2433", colorDanger: "#B42318", borderRadius: "8px", fontFamily: "Inter, system-ui, sans-serif" },
};

interface PayResult {
  error: string | null;
  declined: boolean;
  insufficientFunds: boolean;
}

const payResult = (error: StripeError | undefined): PayResult =>
  !error
    ? { error: null, declined: false, insufficientFunds: false }
    : {
        error: error.message ?? "Your payment didn't go through.",
        declined: error.type === "card_error",
        insufficientFunds: error.decline_code === "insufficient_funds" || error.code === "insufficient_funds",
      };

/** The design's decline copy (design 05). */
function payAlertFor(r: PayResult): { title: string; body: string } {
  if (r.insufficientFunds) return { title: "Insufficient funds.", body: "Try another card. You haven't been charged." };
  if (r.declined) {
    return { title: "Your card was declined.", body: "Your bank didn't approve this payment. Try another card. You haven't been charged." };
  }
  return { title: "Your payment didn't go through.", body: `${r.error ?? ""} You haven't been charged. Try again or use another payment method.`.trim() };
}

interface StripeHandle {
  ready: () => boolean;
  /** Validates the Payment Element before the order is created. */
  submit: () => Promise<string | null>;
  /** Confirms the payment. */
  confirm: (clientSecret: string, returnUrl: string) => Promise<PayResult>;
}

/** Stripe's Payment Element (cards). Card data never reaches our code (NFR-07). Wallets use Express checkout. */
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
        if (!stripe || !elements) return { error: "Payment form is still loading. Try again in a moment.", declined: false, insufficientFunds: false };
        const { error } = await stripe.confirmPayment({
          elements,
          clientSecret,
          confirmParams: { return_url: returnUrl },
          redirect: "if_required",
        });
        return payResult(error);
      },
    }),
    [stripe, elements]
  );
  return (
    <div className="stripe-box">
      <PaymentElement options={{ layout: "accordion", wallets: { applePay: "never", googlePay: "never" } }} />
    </div>
  );
});

// ─── Express checkout (Apple Pay / Google Pay) ───────────────────────────────

/** What the wallet sheet hands back when the shopper confirms. */
interface ExpressOrder {
  email: string;
  name: string;
  phone: string;
  address: ExpressCheckoutAddress;
  method: ShippingMethod;
}

const cents = (n: number) => Math.round(n * 100);

/** Delivery options as wallet shipping rates, the chosen one first (the wallet preselects it). */
function toRates(q: CheckoutQuote, chosen: ShippingMethod): ShippingRate[] {
  return [...q.shippingOptions]
    .sort((a, b) => (a.method === chosen ? -1 : b.method === chosen ? 1 : 0))
    .map((o) => ({
      id: o.method,
      displayName: o.method === "EXPRESS" ? "Express" : "Standard",
      amount: cents(o.free ? 0 : o.fee),
      deliveryEstimate: {
        minimum: { unit: "business_day", value: o.minDays },
        maximum: { unit: "business_day", value: o.maxDays },
      },
    }));
}

interface ExpressProps {
  stripeKey: string;
  quote: CheckoutQuote;
  method: ShippingMethod;
  signedIn: boolean;
  /** Prices the cart for a destination and delivery method (no page state changes). */
  quoteFor: (method: ShippingMethod, dest: TaxDestination | null) => Promise<CheckoutQuote | null>;
  /** Places and pays the order; returns an error message or null. */
  onConfirm: (o: ExpressOrder, pay: (clientSecret: string, returnUrl: string) => Promise<PayResult>) => Promise<string | null>;
}

/**
 * Wallet buttons above the form (design 05 "Express checkout"). They live in
 * their own Elements group so the wallet's amount follows its own address and
 * delivery choice, and the card form isn't validated when a wallet pays.
 */
function ExpressCheckout(props: ExpressProps) {
  const [available, setAvailable] = useState<boolean | null>(null);
  if (available === false) return null;
  return (
    <section className="express" aria-labelledby="exH">
      <h2 id="exH" className="sr-only">Express checkout</h2>
      {available && <p className="ex-label">Express checkout</p>}
      <Elements
        stripe={getStripe(props.stripeKey)}
        options={{
          mode: "payment",
          amount: Math.max(50, cents(props.quote.grandTotal)),
          currency: props.quote.currency.toLowerCase(),
          appearance: STRIPE_APPEARANCE,
        }}
      >
        <ExpressButtons {...props} onAvailable={setAvailable} />
      </Elements>
      {available && <p className="or"><span>{props.signedIn ? "or check out below" : "or check out as a guest"}</span></p>}
    </section>
  );
}

function ExpressButtons({ quote, method, signedIn, quoteFor, onConfirm, onAvailable }: ExpressProps & { onAvailable: (ok: boolean) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const sel = useRef<{ method: ShippingMethod; dest: TaxDestination | null }>({ method, dest: null });

  const reprice = async (m: ShippingMethod, dest: TaxDestination | null) => {
    const q = await quoteFor(m, dest);
    if (q) elements?.update({ amount: Math.max(50, cents(q.grandTotal)) });
    return q;
  };

  return (
    <ExpressCheckoutElement
      options={{
        paymentMethods: { applePay: "auto", googlePay: "auto", link: "never", paypal: "never", amazonPay: "never", klarna: "never" },
        emailRequired: !signedIn,
        phoneNumberRequired: true,
        shippingAddressRequired: true,
        allowedShippingCountries: ["US"],
        buttonHeight: 48,
      }}
      onReady={(e) => {
        const m = e.availablePaymentMethods;
        onAvailable(!!m && (m.applePay || m.googlePay));
      }}
      onClick={(e) => {
        sel.current = { method, dest: null };
        e.resolve({ shippingRates: toRates(quote, method) });
      }}
      onShippingAddressChange={async (e) => {
        if (e.address.country !== "US") {
          e.reject();
          return;
        }
        const dest = { state: e.address.state, postalCode: e.address.postal_code.slice(0, 5) };
        sel.current.dest = dest;
        const q = await reprice(sel.current.method, dest).catch(() => null);
        if (!q) e.reject();
        else e.resolve({ shippingRates: toRates(q, sel.current.method) });
      }}
      onShippingRateChange={async (e) => {
        sel.current.method = e.shippingRate.id as ShippingMethod;
        const q = await reprice(sel.current.method, sel.current.dest).catch(() => null);
        if (!q) e.reject();
        else e.resolve();
      }}
      onConfirm={async (e: StripeExpressCheckoutElementConfirmEvent) => {
        if (!stripe || !elements || !e.shippingAddress) {
          e.paymentFailed({ reason: "fail" });
          return;
        }
        const { error: submitError } = await elements.submit();
        if (submitError) {
          e.paymentFailed({ reason: "fail", message: submitError.message });
          return;
        }
        const err = await onConfirm(
          {
            email: e.billingDetails?.email ?? "",
            name: e.shippingAddress.name || e.billingDetails?.name || "",
            phone: e.billingDetails?.phone ?? "",
            address: e.shippingAddress.address,
            method: (e.shippingRate?.id as ShippingMethod | undefined) ?? sel.current.method,
          },
          async (clientSecret, returnUrl) => {
            const { error } = await stripe.confirmPayment({
              elements,
              clientSecret,
              confirmParams: { return_url: returnUrl },
              redirect: "if_required",
            });
            return payResult(error);
          }
        );
        if (err) e.paymentFailed({ reason: "fail", message: err });
      }}
    />
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

/**
 * Checkout (design 05, FR-ST-10): express wallets, contact, US shipping
 * address, delivery with real dates, payment with billing address and a live
 * order summary from POST /api/checkout/quote (promo code and tax for the
 * destination, contract B1/B2). Guest by default; signed-in customers get
 * their profile and saved addresses.
 *
 * Payment: under Stripe the order is created first (guest or signed-in
 * endpoint, stable Idempotency-Key per attempt) and its clientSecret is
 * confirmed with the Payment Element or a wallet. A decline keeps the shopper
 * here with the same order to retry (FR-IN-01/02). Under the manual gateway
 * the order is placed directly and the store confirms payment.
 */
export function DayloraCheckout() {
  const { config, failed: configFailed } = useStoreConfigState();
  const stripeKey = config?.paymentProvider === "stripe" ? config.stripePublishableKey : null;
  const [quoteTotal, setQuoteTotal] = useState<{ amount: number; currency: string } | null>(null);

  const page = (
    <CheckoutForm
      stripeKey={stripeKey}
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
        appearance: STRIPE_APPEARANCE,
      }}
    >
      {page}
    </Elements>
  );
}

function CheckoutForm({
  stripeKey,
  configLoading,
  onTotal,
}: {
  stripeKey: string | null;
  configLoading: boolean;
  onTotal: (t: { amount: number; currency: string }) => void;
}) {
  const stripeEnabled = !!stripeKey;
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
  const [promoCode, setPromo] = useState<string | null>(null);
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

  // ── Load cart, promo code, profile, saved addresses ──
  useEffect(() => {
    setPromo(getPromoCode());
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
      setValues({ ...EMPTY, ...a.form });
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

  // ── Tax destination: the chosen saved address, or the state (and ZIP) typed in ──
  const usingSaved = signedIn && addrChoice !== "new";
  const saved = usingSaved ? addresses.find((a) => a.id === addrChoice) : undefined;
  const destState = saved ? saved.state : values.state;
  const destZip = (saved ? saved.postalCode : values.zip).slice(0, 5);
  const destKey = destState ? `${destState}|${/^\d{5}$/.test(destZip) ? destZip : ""}` : "";

  // ── Live summary (POST /api/checkout/quote) ──
  const quoteFor = useCallback(
    async (m: ShippingMethod, dest: TaxDestination | null) => {
      const lines = signedIn ? undefined : guestLines;
      const res = await orderService.quote(m, lines, {
        promoCode: promoCode ?? undefined,
        shippingAddress: dest ?? undefined,
      });
      return res.data.data ?? null;
    },
    [signedIn, guestLines, promoCode]
  );

  const loadQuote = useCallback(async () => {
    if (!cart || items.length === 0) return;
    const [state, postalCode] = destKey.split("|");
    try {
      setQuoteError(null);
      const q = await quoteFor(method, state ? { state, postalCode: postalCode || undefined } : null);
      // The quote never 400s over a code: it prices without it and says why in
      // promoError. Drop the code so the order isn't placed with it (a 400).
      if (promoCode && q && !q.promo && q.promoError) {
        setPromoCode(null);
        setPromo(null);
      }
      setQuote(q);
      if (q) onTotal({ amount: q.grandTotal, currency: q.currency });
    } catch (e) {
      // A promo code the server refuses is dropped, and the cart priced without it.
      if (promoCode && fieldError(e, "promoCode")) {
        setPromoCode(null);
        setPromo(null);
        return;
      }
      setQuoteError(getApiErrorMessage(e, "We couldn't work out your total."));
    }
  }, [cart, items.length, quoteFor, method, destKey, promoCode, onTotal]);

  useEffect(() => {
    if (!reserved) loadQuote();
  }, [loadQuote, reserved, cartSig]);

  // ── Field handling ──
  const activeFields = useMemo<Field[]>(
    () => [
      ...FIELD_ORDER.filter((f) => !(usingSaved && ADDRESS_FIELDS.includes(f)) && !(signedIn && f === "email")),
      ...(stripeEnabled && !values.billSame ? BILLING_FIELDS : []),
    ],
    [usingSaved, signedIn, stripeEnabled, values.billSame]
  );

  const check = (f: Field, v = values[f]) => {
    const msg = RULES[f](String(v).trim());
    setErrors((e) => ({ ...e, [f]: msg }));
    return msg;
  };

  const setField = (f: keyof FormValues, raw: string | boolean) => {
    let v = raw;
    if (f === "phone" && typeof v === "string") v = formatPhone(v);
    if ((f === "zip" || f === "bzip") && typeof v === "string") v = formatZip(v);
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

  /** Billing fields of the order body; only card payments collect a different one. */
  const billingInput = () =>
    stripeEnabled && !values.billSame
      ? { billingSameAsShipping: false, billingAddress: { addressLine1: values.baddr.trim(), postalCode: values.bzip.trim() } }
      : { billingSameAsShipping: true };

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
    setPromoCode(null);
    setBusy("Opening your confirmation…");
    await clearCart().catch(() => undefined);
    router.push(`/order-confirmation/${encodeURIComponent(orderNumber)}`);
  };

  /** Creates the order once per attempt (a retry with the same key replays it). */
  const createOrder = async (
    body: CheckoutRequest | GuestCheckoutRequest,
    email: string,
    form: FormValues,
    m: ShippingMethod
  ): Promise<Attempt> => {
    const prev = attempt ?? readAttempt();
    const sig = JSON.stringify(body);
    const key = prev && prev.sig === sig && prev.key ? prev.key : newKey();
    let a: Attempt = { key, sig, cartSig };
    writeAttempt(a);

    let orderNumber: string;
    let clientSecret: string | null;
    let guestToken: string | undefined;
    if (signedIn) {
      const res = await orderService.checkout(body as CheckoutRequest, key);
      ({ clientSecret } = res.data.data!);
      orderNumber = res.data.data!.order.orderNumber;
    } else {
      const res = await orderService.guestCheckout(body as GuestCheckoutRequest, key);
      ({ clientSecret, guestToken } = res.data.data!);
      orderNumber = res.data.data!.order.orderNumber;
    }
    a = { ...a, orderNumber, clientSecret, guestToken, email, form, method: m };
    writeAttempt(a);
    if (guestToken) saveGuestOrder({ orderNumber, guestToken, email });
    return a;
  };

  /** Shows an order-placement failure where it belongs; returns the message. */
  const orderFailed = (e: unknown): string => {
    setBusy(null);
    const status = (e as { response?: { status?: number } }).response?.status;
    const msg = getApiErrorMessage(e, "We couldn't place your order. Check your connection and try again.");
    if (status === 409) {
      backToCart(`${msg}. We've updated your cart — review it and check out again.`);
      return msg;
    }
    if (status === 422) {
      writeAttempt(null); // the key can't be reused for this request
      setAttempt(null);
    }
    if (/cart is empty/i.test(msg)) {
      backToCart("Your cart is empty.");
      return msg;
    }
    if (status === 400) {
      const promoMsg = fieldError(e, "promoCode");
      if (promoMsg) {
        setPromoCode(null);
        setPromo(null);
        setFormError(`${promoMsg} We removed the code. Check your total and place your order again.`);
        return promoMsg;
      }
      // Field errors (e.g. "We can't ship Express to a P.O. box.") go on their fields.
      const shown = Object.entries(SERVER_FIELDS)
        .map(([key, f]) => [f, fieldError(e, key)] as const)
        .filter(([f, m]) => m && activeFields.includes(f));
      if (shown.length) {
        setErrors((s) => ({ ...s, ...Object.fromEntries(shown) }));
        const el = inputs.current[shown[0][0]];
        el?.focus();
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        return shown[0][1]!;
      }
      const any = Object.keys(SERVER_FIELDS).map((k) => fieldError(e, k)).find(Boolean);
      if (any) {
        setFormError(any);
        return any;
      }
    }
    setFormError(msg);
    return msg;
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
      if (!a?.orderNumber) {
        const promo = promoCode ? { promoCode } : {};
        const body: CheckoutRequest | GuestCheckoutRequest = signedIn
          ? usingSaved
            ? { addressId: addrChoice, shippingMethod: method, ...promo, ...billingInput() }
            : { shippingAddress: addressInput(), saveAddress, shippingMethod: method, ...promo, ...billingInput() }
          : {
              email: values.email.trim(),
              marketingOptIn: values.optIn,
              shippingAddress: addressInput(),
              shippingMethod: method,
              items: guestLines,
              ...promo,
              ...billingInput(),
            };
        setBusy("Placing your order…");
        a = await createOrder(body, signedIn ? values.email : values.email.trim(), values, method);

        // Manual gateway: the store confirms payment later.
        if (!stripeEnabled || !a.clientSecret) {
          await finish(a.orderNumber!, a.guestToken ? { token: a.guestToken, email: a.email ?? values.email } : undefined);
          return;
        }
        setAttempt(a);
      }

      // Confirm the payment for this order (again, after a decline).
      setBusy("Processing your payment…");
      const result = await stripeRef.current!.confirm(a.clientSecret!, confirmationUrl(a.orderNumber!));
      if (result.error) {
        setBusy(null);
        const alert = payAlertFor(result);
        showPayAlert(alert.title, alert.body);
        return;
      }
      await finish(a.orderNumber!, a.guestToken ? { token: a.guestToken, email: a.email ?? values.email } : undefined);
    } catch (e2) {
      orderFailed(e2);
    }
  };

  /** A wallet payment: the sheet supplied email, phone and address. */
  const expressConfirm = async (o: ExpressOrder, pay: (clientSecret: string, returnUrl: string) => Promise<PayResult>) => {
    onFirstInteraction();
    setPayAlert(null);
    setFormError(null);
    const [first, ...rest] = o.name.trim().split(/\s+/);
    const shippingAddress: ShippingAddressInput = {
      recipientName: o.name.trim(),
      phone: o.phone ? formatPhone(o.phone) : undefined,
      addressLine1: o.address.line1,
      addressLine2: o.address.line2 || undefined,
      city: o.address.city,
      state: o.address.state,
      postalCode: o.address.postal_code,
      country: "US",
    };
    const email = signedIn ? values.email || user?.email || "" : o.email.trim();
    const promo = promoCode ? { promoCode } : {};
    const body: CheckoutRequest | GuestCheckoutRequest = signedIn
      ? { shippingAddress, saveAddress: false, shippingMethod: o.method, billingSameAsShipping: true, ...promo }
      : { email, marketingOptIn: values.optIn, shippingAddress, shippingMethod: o.method, items: guestLines, billingSameAsShipping: true, ...promo };
    const form: FormValues = {
      ...values,
      email,
      fname: first ?? "",
      lname: rest.join(" "),
      addr1: shippingAddress.addressLine1,
      addr2: shippingAddress.addressLine2 ?? "",
      city: shippingAddress.city,
      state: shippingAddress.state,
      zip: shippingAddress.postalCode,
      phone: shippingAddress.phone ?? "",
      billSame: true,
    };
    try {
      setBusy("Processing your payment…");
      const a = await createOrder(body, email, form, o.method);
      if (!a.clientSecret) {
        await finish(a.orderNumber!, a.guestToken ? { token: a.guestToken, email } : undefined);
        return null;
      }
      const result = await pay(a.clientSecret, confirmationUrl(a.orderNumber!));
      if (result.error) {
        // The order stays reserved: the card form below can pay it.
        setBusy(null);
        setAttempt(a);
        setValues(form);
        setMethod(o.method);
        const alert = payAlertFor(result);
        showPayAlert(alert.title, alert.body);
        return alert.title;
      }
      await finish(a.orderNumber!, a.guestToken ? { token: a.guestToken, email } : undefined);
      return null;
    } catch (e) {
      return orderFailed(e);
    }
  };

  const startOver = () => {
    writeAttempt(null);
    setAttempt(null);
    setPayAlert(null);
    loadQuote();
  };

  // ── Render ──
  const testMode = stripeEnabled && !!config?.stripePublishableKeyIsTest;
  const shell = (body: ReactNode) => (
    <div className="co-page">
      <a className="skip" href="#main">Skip to content</a>
      <CheckoutHeader back="cart" />
      <main id="main" className="co">
        <div className="daylora-container">
          {testMode && (
            <div className="test-banner">
              <b>Test mode</b> Card <code>4242 4242 4242 4242</code> succeeds · <code>4000 0000 0000 0002</code> is declined · any future date and CVC
            </div>
          )}
          {body}
        </div>
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
  const taxPending = !!quote && !quote.pricesIncludeTax && (quote.taxIsEstimate ?? !destKey);
  // Until there's an address, tax isn't part of the total shown.
  const total = quote ? (taxPending ? +(quote.grandTotal - quote.taxTotal).toFixed(2) : quote.grandTotal) : null;
  const promo = quote?.promo ?? null;
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
              {promo && (
                <>
                  <dt className="good">Promo {promo.code}</dt>
                  <dd className="good">{promo.discount > 0 ? `−${usd(promo.discount)}` : "Applied"}</dd>
                </>
              )}
              <dt>Shipping · {method === "EXPRESS" ? "Express" : "Standard"}</dt>
              <dd>{quote.shippingTotal === 0 ? <span className="good">Free</span> : usd(quote.shippingTotal)}</dd>
              <dt>{quote.pricesIncludeTax ? "Tax (included)" : "Estimated tax"}</dt>
              {taxPending ? <dd className="muted">Enter your address</dd> : <dd>{usd(quote.taxTotal)}</dd>}
            </dl>
            <div className="sum-total"><span>Total</span><b>{usd(total!)}</b></div>
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
        <li>
          <DayloraIcon name="headset" />
          <span>
            <b>Need help?</b>
            <Link href="/help?t=contact" style={{ textDecoration: "underline" }}>Contact us</Link>
            {config?.supportHours ? ` ${config.supportHours}` : ""} or read our{" "}
            <Link href="/help?t=faq" style={{ textDecoration: "underline" }}>FAQs</Link>
          </span>
        </li>
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

          {/* Hidden rather than unmounted once an order is reserved: a wallet payment may still be finishing. */}
          {stripeKey && quote && (
            <div hidden={reserved}>
              <ExpressCheckout
                stripeKey={stripeKey}
                quote={quote}
                method={method}
                signedIn={signedIn}
                quoteFor={quoteFor}
                onConfirm={expressConfirm}
              />
            </div>
          )}

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
                  <button
                    type="button"
                    className="link add-line"
                    aria-expanded={line2Open}
                    aria-controls="line2Wrap"
                    hidden={line2Open}
                    onClick={() => setLine2Open(true)}
                  >
                    + Add apartment, suite or unit
                  </button>
                  <div className="field" id="line2Wrap" hidden={!line2Open}>
                    <label htmlFor="addr2">Apartment, suite or unit <span className="opt">(optional)</span></label>
                    {line2Open && (
                      <input id="addr2" autoComplete="address-line2" value={values.addr2} autoFocus={!reserved && !values.addr2} onChange={(e) => setField("addr2", e.target.value)} />
                    )}
                  </div>
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
              <p className="ship-to-note"><DayloraIcon name="truck" />We ship to all 50 states and DC. No P.O. boxes for Express.</p>
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
              <div className="pay-methods" role="radiogroup" aria-label="Payment method">
                <label className="pm">
                  <input type="radio" name="pm" value="card" checked readOnly />
                  <span className="pm-body">
                    <span className="pm-t">Credit or debit card</span>
                    <span className="brands" aria-hidden="true"><i>VISA</i><i>MC</i><i>AMEX</i><i>DISC</i></span>
                  </span>
                </label>
                <div className="pm-panel">
                  <StripePane ref={stripeRef} />
                  <fieldset disabled={reserved || !!busy}>
                    <label className="check">
                      <input type="checkbox" checked={values.billSame} onChange={(e) => setField("billSame", e.target.checked)} />
                      <span>Billing address is the same as shipping</span>
                    </label>
                    {!values.billSame && (
                      <div className="bill-wrap">
                        <div className={fieldClass("baddr")}>
                          <label htmlFor="baddr">Billing street address</label>
                          <input {...fieldProps("baddr")} ref={(el) => { inputs.current.baddr = el; }} autoComplete="billing address-line1" onChange={(e) => setField("baddr", e.target.value)} />
                          {err("baddr")}
                        </div>
                        <div className="row2">
                          <div className={fieldClass("bzip")}>
                            <label htmlFor="bzip">Billing ZIP code</label>
                            <input {...fieldProps("bzip")} ref={(el) => { inputs.current.bzip = el; }} autoComplete="billing postal-code" inputMode="numeric" maxLength={10} onChange={(e) => setField("bzip", e.target.value)} />
                            {err("bzip")}
                          </div>
                        </div>
                      </div>
                    )}
                  </fieldset>
                </div>
              </div>
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
