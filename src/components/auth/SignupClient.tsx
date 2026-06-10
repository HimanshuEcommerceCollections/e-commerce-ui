"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { signupSchema, type SignupFormValues } from "@/lib/validations/auth";
import { getApiErrorMessage } from "@/lib/apiError";
import { useAuth } from "@/hooks/useAuth";

const RIGHT_FEATURES = [
  { emoji: "⭐", text: "Exclusive member deals & early access to sales" },
  { emoji: "🚚", text: "Free shipping on orders over $50" },
  { emoji: "🔄", text: "Hassle-free 30-day returns, no questions asked" },
];

const STATS = [
  { number: "5M+",  label: "Happy Customers" },
  { number: "50K+", label: "Products" },
  { number: "4.8★", label: "App Rating" },
];

const TRUST_BADGES = [
  { emoji: "🔒", bold: "Secure Signup", sub: "256-bit Encryption" },
  { emoji: "📦", bold: "Free Delivery",  sub: "On Orders $50+" },
  { emoji: "↩",  bold: "Easy Returns",  sub: "30-Day Policy" },
];

const BOTTOM_ITEMS = [
  { emoji: "🔒", label: "256-bit Encrypted", left: 48  },
  { emoji: "🛡️", label: "Buyer Protection",  left: 279 },
  { emoji: "⭐", label: "4.8/5 Rating",      left: 501 },
];

export default function SignupClient() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const onSubmit = async (values: SignupFormValues) => {
    try {
      await registerUser({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        phoneNumber: values.phone,
      });
      toast.success("Account created — welcome to ShopHub!");
      router.push("/");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Sign up failed. Please try again."));
    }
  };

  return (
    <div className="signup-page">

      {/* ── LEFT PANEL — scrollable ── */}
      <div className="signup-left">

        <div className="signup-form-card">
          {/* Logo row */}
          <div className="signup-logo-row">
            <div className="signup-logo-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M2.5 3.5H4.5L7 14H16L18.5 6H7" stroke="#FFFFFF" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="8.5" cy="17" r="1.2" stroke="#FFFFFF" strokeWidth="1.67"/>
                <circle cx="14.5" cy="17" r="1.2" stroke="#FFFFFF" strokeWidth="1.67"/>
              </svg>
            </div>
            <span className="signup-brand-name">ShopHub</span>
          </div>

          <h1 className="signup-heading">Create Your Account</h1>
          <p className="signup-subtext">Join 5M+ shoppers. Get deals, track orders, enjoy fast delivery.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="signup-form" noValidate>

            {/* Full Name */}
            <div className="signup-field-group">
              <label className="signup-field-label" htmlFor="su-fullName">Full Name</label>
              <div className="signup-input-wrapper">
                <svg className="signup-input-icon-left" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 8C9.66 8 11 6.66 11 5C11 3.34 9.66 2 8 2C6.34 2 5 3.34 5 5C5 6.66 6.34 8 8 8Z" stroke="#9E9E9E" strokeWidth="1.33"/>
                  <path d="M2 14C2 11.79 4.69 10 8 10C11.31 10 14 11.79 14 14" stroke="#9E9E9E" strokeWidth="1.33" strokeLinecap="round"/>
                </svg>
                <input
                  id="su-fullName"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  aria-invalid={!!errors.fullName}
                  className="signup-input"
                  {...register("fullName")}
                />
              </div>
              {errors.fullName && <p className="auth-error">{errors.fullName.message}</p>}
            </div>

            {/* Email */}
            <div className="signup-field-group">
              <label className="signup-field-label" htmlFor="su-email">Email Address</label>
              <div className="signup-input-wrapper">
                <svg className="signup-input-icon-left" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1.33" y="2.67" width="13.33" height="10.67" rx="1.33" stroke="#9E9E9E" strokeWidth="1.33"/>
                  <path d="M1.33 5.33L8 9.33L14.67 5.33" stroke="#9E9E9E" strokeWidth="1.33"/>
                </svg>
                <input
                  id="su-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email address"
                  aria-invalid={!!errors.email}
                  className="signup-input signup-email-input"
                  {...register("email")}
                />
              </div>
              {errors.email && <p className="auth-error">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div className="signup-field-group">
              <label className="signup-field-label" htmlFor="su-phone">Phone Number</label>
              <div className="signup-input-wrapper">
                <div className="signup-phone-prefix">
                  <span className="signup-phone-flag">🇺🇸</span>
                  <span className="signup-phone-code">+1</span>
                </div>
                <input
                  id="su-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="Enter phone number"
                  aria-invalid={!!errors.phone}
                  className="signup-input signup-phone-input"
                  {...register("phone")}
                />
              </div>
              {errors.phone && <p className="auth-error">{errors.phone.message}</p>}
            </div>

            {/* Password */}
            <div className="signup-field-group">
              <label className="signup-field-label" htmlFor="su-password">Password</label>
              <div className="signup-input-wrapper">
                <svg className="signup-input-icon-left" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="7.33" width="12" height="7.33" rx="1.33" stroke="#9E9E9E" strokeWidth="1.33"/>
                  <path d="M4.67 7.33V5.33C4.67 3.49 6.16 2 8 2C9.84 2 11.33 3.49 11.33 5.33V7.33" stroke="#9E9E9E" strokeWidth="1.33"/>
                </svg>
                <input
                  id="su-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  aria-invalid={!!errors.password}
                  className="signup-input signup-password-input"
                  {...register("password")}
                />
                <button
                  type="button"
                  className="signup-input-icon-right"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} color="#9E9E9E" /> : <Eye size={16} color="#9E9E9E" />}
                </button>
              </div>
              {errors.password && <p className="auth-error">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div className="signup-field-group">
              <label className="signup-field-label" htmlFor="su-confirmPassword">Confirm Password</label>
              <div className="signup-input-wrapper">
                <svg className="signup-input-icon-left" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="7.33" width="12" height="7.33" rx="1.33" stroke="#9E9E9E" strokeWidth="1.33"/>
                  <path d="M4.67 7.33V5.33C4.67 3.49 6.16 2 8 2C9.84 2 11.33 3.49 11.33 5.33V7.33" stroke="#9E9E9E" strokeWidth="1.33"/>
                </svg>
                <input
                  id="su-confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Confirm your password"
                  aria-invalid={!!errors.confirmPassword}
                  className="signup-input signup-password-input"
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  className="signup-input-icon-right"
                  onClick={() => setShowConfirm((s) => !s)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff size={16} color="#9E9E9E" /> : <Eye size={16} color="#9E9E9E" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="auth-error">{errors.confirmPassword.message}</p>}
            </div>

            {/* Terms */}
            <div className="signup-terms-row">
              <input
                type="checkbox"
                className="signup-checkbox"
                {...register("acceptTerms")}
              />
              <span className="signup-terms-text">
                I agree to ShopHub&apos;s{" "}
                <Link href="/terms" className="signup-terms-link">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="signup-terms-link">Privacy Policy</Link>
              </span>
            </div>
            {errors.acceptTerms && <p className="auth-error">{errors.acceptTerms.message}</p>}

            {/* Submit */}
            <button type="submit" disabled={isSubmitting} className="signup-create-btn">
              <span className="signup-create-btn-text">
                {isSubmitting ? "Creating account…" : "Create Account"}
              </span>
              {!isSubmitting && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3.33 8H12.67" stroke="#FFFFFF" strokeWidth="1.33" strokeLinecap="round"/>
                  <path d="M9.33 4.67L12.67 8L9.33 11.33" stroke="#FFFFFF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>

            {/* Sign in link */}
            <div className="signup-signin-row">
              <span className="signup-signin-text">Already have an account?</span>
              <Link href="/login" className="signup-signin-link">
                Sign In
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6H9.5" stroke="#2874F0" strokeWidth="1" strokeLinecap="round"/>
                  <path d="M7 3.5L9.5 6L7 8.5" stroke="#2874F0" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>

          </form>
        </div>

        {/* Trust badges below card */}
        <div className="signup-trust-badges-row">
          {TRUST_BADGES.map(({ emoji, bold, sub }, i) => (
            <div className="signup-trust-badge-col" key={i}>
              <div className="signup-trust-icon-circle">
                <span className="signup-trust-emoji">{emoji}</span>
              </div>
              <span className="signup-trust-bold">{bold}</span>
              <span className="signup-trust-sub">{sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL — sticky ── */}
      <div className="signup-right">

        {/* Navbar */}
        <div className="signup-right-navbar">
          <div className="signup-right-logo-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M2.5 3.5H4.5L7 14H16L18.5 6H7" stroke="#2874F0" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="8.5" cy="17" r="1.2" stroke="#2874F0" strokeWidth="1.67"/>
              <circle cx="14.5" cy="17" r="1.2" stroke="#2874F0" strokeWidth="1.67"/>
            </svg>
          </div>
          <span className="signup-right-brand-name">ShopHub</span>
          <div className="signup-right-trust-badge">
            <div className="signup-right-trust-dot" />
            <span className="signup-right-trust-text">Trusted by 5M+ shoppers</span>
          </div>
        </div>

        {/* Vertically centered content */}
        <div className="signup-right-content">
          <div className="signup-right-inner">
            <span className="signup-new-here">New here?</span>
            <h2 className="signup-join-heading">Join ShopHub Today</h2>
            <p className="signup-join-subtext">Your one-stop shop for everything you love.</p>
            <div className="signup-right-features">
              {RIGHT_FEATURES.map(({ emoji, text }, i) => (
                <div className="signup-right-feature-row" key={i}>
                  <div className="signup-right-feature-icon">{emoji}</div>
                  <span className="signup-right-feature-text">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats cards — absolute above bottom bar */}
        <div className="signup-stats-row">
          {STATS.map(({ number, label }, i) => (
            <div className="signup-stat-card" key={i}>
              <div className="signup-stat-number">{number}</div>
              <div className="signup-stat-label">{label}</div>
            </div>
          ))}
        </div>

        {/* Bottom trust bar */}
        <div className="signup-right-bottom-bar">
          {BOTTOM_ITEMS.map(({ emoji, label, left }, i) => (
            <div key={i} className="signup-bottom-trust-item" style={{ left: `${left}px` }}>
              <span className="signup-bottom-trust-emoji">{emoji}</span>
              <span className="signup-bottom-trust-label">{label}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
