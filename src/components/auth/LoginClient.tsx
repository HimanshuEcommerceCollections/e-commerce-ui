"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
import { getApiErrorMessage } from "@/lib/apiError";
import { useAuth } from "@/hooks/useAuth";

const FEATURES = [
  "Free Shipping on Orders Over $50",
  "Easy 30-Day Returns",
  "Secure Encrypted Payments",
];

const PILLS = [
  { label: "Electronics", left: 0, top: 0, width: 122 },
  { label: "Fashion", left: 130, top: 0, width: 104 },
  { label: "Home", left: 243, top: 0, width: 95 },
  { label: "Beauty", left: 346, top: 0, width: 100 },
  { label: "Sports", left: 0, top: 45, width: 98 },
  { label: "Books", left: 106, top: 45, width: 95 },
];

const BOTTOM_ITEMS = [
  { emoji: "🔒", label: "256-bit SSL Encryption", left: 46 },
  { emoji: "🛡️", label: "Buyer Protection", left: 293 },
  { emoji: "⭐", label: "4.8/5 Rating", left: 506 },
];

const RIGHT_BADGES = [
  {
    bold: "Secure Login",
    sub: "256-bit Encryption",
    icon: (
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
        <rect
          x="1.5"
          y="7.5"
          width="14"
          height="8"
          rx="1.5"
          stroke="#2874F0"
          strokeWidth="1.39"
        />
        <path
          d="M4 7.5V5a4.5 4.5 0 0 1 9 0v2.5"
          stroke="#2874F0"
          strokeWidth="1.39"
        />
      </svg>
    ),
  },
  {
    bold: "Protected",
    sub: "Checkout",
    icon: (
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
        <path
          d="M8.5 1.5L15 4.5V9c0 3.5-2.5 5.5-6.5 6.5C4.5 14.5 2 12.5 2 9V4.5L8.5 1.5Z"
          stroke="#2874F0"
          strokeWidth="1.39"
        />
      </svg>
    ),
  },
  {
    bold: "Verified",
    sub: "Marketplace",
    icon: (
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
        <path
          d="M3 8.5L6.5 12L14 5"
          stroke="#2874F0"
          strokeWidth="1.39"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function LoginClient() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const auth = await login(values);
      toast.success("Welcome back!");
      const dest =
        auth.role === "ROLE_ADMIN"
          ? "/admin"
          : auth.role === "ROLE_MERCHANT"
            ? "/merchant"
            : "/";
      router.push(dest);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Login failed. Please try again."));
    }
  };

  return (
    <div className="lp-page">
      {/* ── LEFT PANEL ── */}
      <div className="lp-left">
        <div className="lp-left-bg" />
        <div className="lp-left-radial" />

        {/* Navbar */}
        <div className="lp-navbar">
          <div className="lp-logo-white-circle">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M3 4H5L7.5 14H16.5L18.5 7H7.5"
                stroke="#2874F0"
                strokeWidth="1.67"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="9.5"
                cy="17"
                r="1.3"
                stroke="#2874F0"
                strokeWidth="1.67"
              />
              <circle
                cx="15.5"
                cy="17"
                r="1.3"
                stroke="#2874F0"
                strokeWidth="1.67"
              />
            </svg>
          </div>
          <span className="lp-brand">ShopHub</span>
          <div className="lp-trust-badge">
            <div className="lp-trust-dot" />
            <span className="lp-trust-text">Trusted by 5M+ shoppers</span>
          </div>
        </div>

        {/* Main content column */}
        <div className="lp-content">
          <div className="lp-sale-badge">
            <span className="lp-sale-star">✦</span>
            <span className="lp-sale-text">Summer Sale 2026</span>
          </div>

          {/* Headline: text only — cards are a direct child of lp-left to avoid overflow */}
          <div className="lp-headline">
            <span className="lp-upto">Up to</span>
            <span className="lp-percent">70% Off</span>
            <span className="lp-everything">Everything</span>
          </div>

          <p className="lp-subtext">
            Shop Electronics, Fashion, Home &amp; Beauty
          </p>

          <div className="lp-features">
            {FEATURES.map((text, i) => (
              <div className="lp-feature-row" key={i}>
                <div className="lp-feature-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M2.67 8L6 11.33L13.33 4"
                      stroke="#FFFFFF"
                      strokeWidth="1.33"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span className="lp-feature-text">{text}</span>
              </div>
            ))}
          </div>

          <div className="lp-pills-container">
            {PILLS.map(({ label, left, top }, i) => (
              <div
                key={i}
                className="lp-pill"
                style={{ left: `${left}px`, top: `${top}px` }}
              >
                <span className="lp-pill-text">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Product cards — direct child of lp-left so top/right are panel-relative */}
        <div className="lp-cards-wrap">
          <div className="lp-card-slot-1">
            <div className="lp-card-inner-1">
              <div className="lp-product-img-1">
                <Image
                  src="/loginImages/Image (Wireless Earbuds).png"
                  alt="Wireless Earbuds Pro"
                  fill
                  style={{ objectFit: "cover", objectPosition: "center" }}
                />
              </div>
              <div className="lp-discount-badge">
                <span className="lp-discount-text">48% off</span>
              </div>
              <span className="lp-product-name-1">Wireless Earbuds Pro</span>
              <div className="lp-price-row-1">
                <span className="lp-price-current">$49.99</span>
                <span className="lp-price-original">$99.99</span>
              </div>
              <button className="lp-add-cart-1">Add to Cart</button>
            </div>
          </div>
          <div className="lp-card-slot-2">
            <div className="lp-card-inner-2">
              <div className="lp-product-img-2">
                <Image
                  src="/loginImages/Image (Smart Watch).png"
                  alt="Smart Watch"
                  fill
                  style={{ objectFit: "cover", objectPosition: "center" }}
                />
              </div>
              <span className="lp-product-name-2">Smart Watch</span>
              <div className="lp-price-row-2">
                <span className="lp-price-current">$129.99</span>
              </div>
              <button className="lp-add-cart-2">Add to Cart</button>
            </div>
          </div>
        </div>

        {/* Bottom trust bar */}
        <div className="lp-bottom-bar">
          {BOTTOM_ITEMS.map(({ emoji, label, left }, i) => (
            <div
              key={i}
              className="lp-bottom-item"
              style={{ left: `${left}px` }}
            >
              <span className="lp-bottom-emoji">{emoji}</span>
              <span className="lp-bottom-label">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="lp-right">
        {/* Login form card — perfectly centered */}
        <div className="lp-card">
          <div className="lp-card-logo-row">
            <div className="lp-card-logo-icon">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path
                  d="M2 3H4L6 11H12.5L14 6H6"
                  stroke="#FFFFFF"
                  strokeWidth="1.27"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="7"
                  cy="13"
                  r="1"
                  stroke="#FFFFFF"
                  strokeWidth="1.27"
                />
                <circle
                  cx="11.5"
                  cy="13"
                  r="1"
                  stroke="#FFFFFF"
                  strokeWidth="1.27"
                />
              </svg>
            </div>
            <span className="lp-card-brand">ShopHub</span>
          </div>

          <h1 className="lp-card-heading">Welcome Back</h1>
          <p className="lp-card-para">
            Sign in to track orders, manage purchases &amp; get personalized
            recommendations.
          </p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="lp-form"
            noValidate
          >
            {/* Email */}
            <label className="lp-field-label" htmlFor="lp-email">
              Email Address
            </label>
            <div className="lp-input-wrap">
              <svg className="lp-icon-left" viewBox="0 0 12 12" fill="none">
                <rect
                  x="1"
                  y="2"
                  width="10"
                  height="8"
                  rx="1"
                  stroke="#9E9E9E"
                  strokeWidth="1.02"
                />
                <path d="M1 4L6 7L11 4" stroke="#9E9E9E" strokeWidth="1.02" />
              </svg>
              <input
                id="lp-email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                aria-invalid={!!errors.email}
                className="lp-input lp-input-padded-both"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="auth-error">{errors.email.message}</p>
            )}

            {/* Password */}
            <div className="lp-pw-field">
              <label className="lp-field-label" htmlFor="lp-password">
                Password
              </label>
              <div className="lp-input-wrap">
                <svg className="lp-icon-left" viewBox="0 0 12 12" fill="none">
                  <rect
                    x="1.5"
                    y="5.5"
                    width="9"
                    height="5.5"
                    rx="1"
                    stroke="#9E9E9E"
                    strokeWidth="1.02"
                  />
                  <path
                    d="M3.5 5.5V4a2.5 2.5 0 0 1 5 0v1.5"
                    stroke="#9E9E9E"
                    strokeWidth="1.02"
                  />
                </svg>
                <input
                  id="lp-password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  aria-invalid={!!errors.password}
                  className="lp-input lp-input-padded-both"
                  {...register("password")}
                />
                <button
                  type="button"
                  className="lp-icon-right"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? (
                    <EyeOff size={12} color="#9E9E9E" />
                  ) : (
                    <Eye size={12} color="#9E9E9E" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="auth-error">{errors.password.message}</p>
              )}
            </div>

            {/* Remember / Forgot */}
            <div className="lp-remember-row">
              <label className="lp-remember-label">
                <input type="checkbox" className="lp-checkbox" />
                <span className="lp-remember-text">Remember me</span>
              </label>
              <button
                type="button"
                className="lp-forgot"
                onClick={() => toast.info("Password reset is coming soon")}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="lp-signin-btn"
            >
              {isSubmitting ? "Signing in…" : "Sign In →"}
            </button>

            <div className="lp-create-row">
              <span className="lp-create-text">New to ShopHub?</span>
              <Link href="/signup" className="lp-create-link">
                Create Account →
              </Link>
            </div>
          </form>
        </div>

        {/* Bottom trust badges — centered at bottom */}
        <div className="lp-right-badges">
          {RIGHT_BADGES.map(({ bold, sub, icon }, i) => (
            <div className="lp-badge-col" key={i}>
              <div className="lp-badge-icon">{icon}</div>
              <span className="lp-badge-bold">{bold}</span>
              <span className="lp-badge-sub">{sub}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
