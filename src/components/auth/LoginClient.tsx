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
    <div className="fixed left-0 top-0 flex h-screen w-screen flex-row overflow-hidden">
      {/* ── LEFT PANEL ── */}
      <div className="relative h-screen w-[55%] overflow-hidden max-lg:hidden">
        <div className="absolute inset-0 z-0 bg-[linear-gradient(135deg,#0D1B4B_0%,#1A3A8F_50%,#2874F0_100%)]" />
        <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(75.09%_67.02%_at_50%_50%,rgba(255,159,0,0.15)_0%,rgba(0,0,0,0)_70%)]" />

        {/* Navbar */}
        <div className="absolute left-0 right-0 top-0 z-[3] flex h-[88px] flex-row items-center gap-3 px-14 pb-0 pt-12">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
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
          <span className="text-[22px] font-extrabold leading-[33px] tracking-[-0.5px] text-white [font-family:'Inter',sans-serif]">
            ShopHub
          </span>
          <div className="ml-4 flex flex-row items-center gap-2 rounded-full bg-white/15 px-3 py-1">
            <div className="h-2 w-2 rounded-full bg-[#388E3C]" />
            <span className="text-[11px] font-medium text-white [font-family:'Inter',sans-serif]">
              Trusted by 5M+ shoppers
            </span>
          </div>
        </div>

        {/* Main content column */}
        <div className="absolute bottom-14 left-14 right-14 top-[88px] z-[2] flex flex-col justify-start overflow-hidden pt-14">
          <div className="inline-flex shrink-0 flex-row items-center gap-2 self-start rounded-full border-[0.8px] border-[rgba(255,159,0,0.4)] bg-[rgba(255,159,0,0.2)] px-4 py-2">
            <span className="text-[14px] font-semibold text-[#FF9F00] [font-family:'Inter',sans-serif]">
              ✦
            </span>
            <span className="text-[13px] font-semibold text-[#FF9F00] [font-family:'Inter',sans-serif]">
              Summer Sale 2026
            </span>
          </div>

          {/* Headline: text only — cards are a direct child of the left panel to avoid overflow */}
          <div className="relative isolate mt-4 h-[173px] w-full shrink-0">
            <span className="absolute left-0 top-0 z-[5] text-[42px] font-normal leading-[46px] text-white opacity-[0.85] [font-family:'Inter',sans-serif]">
              Up to
            </span>
            <span className="absolute left-0 top-[54px] z-[6] text-[64px] font-extrabold leading-[64px] tracking-[-2px] text-white [font-family:'Inter',sans-serif]">
              70% Off
            </span>
            <span className="absolute left-0 top-[127px] z-[5] text-[42px] font-normal leading-[46px] text-white opacity-[0.85] [font-family:'Inter',sans-serif]">
              Everything
            </span>
          </div>

          <p className="relative z-[5] mt-5 shrink-0 text-[18px] font-normal leading-[27px] text-white/70 [font-family:'Inter',sans-serif]">
            Shop Electronics, Fashion, Home &amp; Beauty
          </p>

          <div className="relative z-[5] mt-8 flex shrink-0 flex-col">
            {FEATURES.map((text, i) => (
              <div
                className="flex flex-row items-center gap-3 pt-3 first:pt-0"
                key={i}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FF9F00]">
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
                <span className="text-[15px] font-medium leading-[22px] text-white [font-family:'Inter',sans-serif]">
                  {text}
                </span>
              </div>
            ))}
          </div>

          <div className="relative z-[5] mb-6 mt-10 h-[82px] w-full shrink-0">
            {PILLS.map(({ label, left, top }, i) => (
              <div
                key={i}
                className="absolute inline-flex h-[37px] items-center whitespace-nowrap rounded-full border-[0.8px] border-white/[0.22] bg-white/[0.12] px-5"
                style={{ left: `${left}px`, top: `${top}px` }}
              >
                <span className="whitespace-nowrap text-[13px] font-medium text-white [font-family:'Inter',sans-serif]">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Product cards — direct child of the left panel so top/right are panel-relative */}
        <div className="absolute right-14 top-[195px] z-[4] flex h-[263px] w-[340px] flex-row items-start overflow-visible">
          <div className="relative z-[2] h-[263px] w-[180px] shrink-0 overflow-visible">
            <div className="absolute left-[-6.75px] top-[-4.53px] box-border flex h-[263px] w-[180px] -rotate-3 flex-col rounded-2xl border-[0.8px] border-white/[0.22] bg-white/[0.14] p-4">
              <div className="relative h-[120px] w-[146px] shrink-0 overflow-hidden rounded-[14px] bg-[rgba(200,220,255,0.2)]">
                <Image
                  src="/loginImages/Image (Wireless Earbuds).png"
                  alt="Wireless Earbuds Pro"
                  fill
                  style={{ objectFit: "cover", objectPosition: "center" }}
                />
              </div>
              <div className="mt-1 flex h-6 w-[58px] shrink-0 items-center justify-center rounded-full bg-[#D32F2F]">
                <span className="text-[12px] font-semibold text-white [font-family:'Inter',sans-serif]">
                  48% off
                </span>
              </div>
              <span className="mt-3 text-[12px] font-semibold leading-4 text-white [font-family:'Inter',sans-serif]">
                Wireless Earbuds Pro
              </span>
              <div className="flex items-center gap-2 pb-3 pt-2">
                <span className="text-[14px] font-bold text-[#FF9F00] [font-family:'Inter',sans-serif]">
                  $49.99
                </span>
                <span className="text-[12px] font-normal text-white line-through opacity-60 [font-family:'Inter',sans-serif]">
                  $99.99
                </span>
              </div>
              <button className="h-8 w-[146px] shrink-0 cursor-pointer rounded-2xl border-none bg-[#2874F0] text-[12px] font-semibold text-white [font-family:'Inter',sans-serif]">
                Add to Cart
              </button>
            </div>
          </div>
          <div className="relative z-[1] h-[263px] w-[160px] shrink-0 overflow-visible">
            <div className="absolute left-[-4.55px] top-[-22.71px] box-border flex h-[263px] w-[160px] rotate-2 flex-col rounded-2xl border-[0.8px] border-white/[0.22] bg-white/[0.14] p-4 opacity-[0.85]">
              <div className="relative h-[105px] w-[126px] shrink-0 overflow-hidden rounded-[14px] bg-[rgba(200,220,255,0.2)]">
                <Image
                  src="/loginImages/Image (Smart Watch).png"
                  alt="Smart Watch"
                  fill
                  style={{ objectFit: "cover", objectPosition: "center" }}
                />
              </div>
              <span className="mt-3 text-[12px] font-semibold leading-4 text-white [font-family:'Inter',sans-serif]">
                Smart Watch
              </span>
              <div className="flex items-center gap-2 pb-3 pt-2">
                <span className="text-[14px] font-bold text-[#FF9F00] [font-family:'Inter',sans-serif]">
                  $129.99
                </span>
              </div>
              <button className="h-8 w-[126px] shrink-0 cursor-pointer rounded-2xl border-none bg-[#2874F0] text-[12px] font-semibold text-white [font-family:'Inter',sans-serif]">
                Add to Cart
              </button>
            </div>
          </div>
        </div>

        {/* Bottom trust bar */}
        <div className="absolute bottom-0 left-0 right-0 z-[3] h-14 bg-black/20">
          {BOTTOM_ITEMS.map(({ emoji, label, left }, i) => (
            <div
              key={i}
              className="absolute top-4 flex flex-row items-center gap-2 opacity-80"
              style={{ left: `${left}px` }}
            >
              <span className="text-[16px] font-medium text-white [font-family:'Inter',sans-serif]">
                {emoji}
              </span>
              <span className="text-[12px] font-medium text-white [font-family:'Inter',sans-serif]">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="relative h-screen w-[45%] overflow-hidden bg-[#F5F7FA] bg-[radial-gradient(84.79%_61.91%_at_50%_50%,rgba(40,116,240,0.04)_0.19%,rgba(0,0,0,0)_0.19%)] max-lg:w-full">
        {/* Login form card — perfectly centered */}
        <div className="absolute left-1/2 top-1/2 box-border flex max-h-[calc(100vh-140px)] w-80 -translate-x-1/2 -translate-y-1/2 flex-col items-start overflow-y-auto rounded-[18px] border-t border-[#E8EDF5] bg-white p-8 shadow-[0px_6px_30px_rgba(0,0,0,0.1),0px_1.5px_6px_rgba(0,0,0,0.05)] max-sm:w-[calc(100vw-32px)] max-sm:max-w-[360px] max-sm:p-6">
          <div className="flex w-full flex-row items-center gap-[9px]">
            <div className="flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-full bg-[#2874F0]">
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
            <span className="text-[14px] font-bold tracking-[-0.23px] text-[#212121] [font-family:'Inter',sans-serif]">
              ShopHub
            </span>
          </div>

          <h1 className="mt-[21px] text-[21px] font-bold leading-8 tracking-[-0.38px] text-[#212121] [font-family:'Inter',sans-serif]">
            Welcome Back
          </h1>
          <p className="mt-1.5 text-[11px] font-normal leading-4 text-[#757575] [font-family:'Inter',sans-serif]">
            Sign in to track orders, manage purchases &amp; get personalized
            recommendations.
          </p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-[21px] flex w-full flex-col items-start"
            noValidate
          >
            {/* Email */}
            <label
              className="text-[10px] font-medium text-[#424242] [font-family:'Inter',sans-serif]"
              htmlFor="lp-email"
            >
              Email Address
            </label>
            <div className="relative mt-[4.5px] h-[37px] w-full">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2"
                viewBox="0 0 12 12"
                fill="none"
              >
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
                className="box-border h-[37px] w-full rounded-[15px] border-[0.61px] border-[#E0E0E0] bg-[#FAFAFA] px-[34px] text-[11px] font-normal text-[rgba(17,24,39,0.8)] outline-none [font-family:'Inter',sans-serif] placeholder:text-[rgba(17,24,39,0.5)] focus:border-[#2874F0] focus:bg-white aria-[invalid=true]:border-[#ef4444]"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="auth-error">{errors.email.message}</p>
            )}

            {/* Password */}
            <div className="mt-[15px] w-full">
              <label
                className="text-[10px] font-medium text-[#424242] [font-family:'Inter',sans-serif]"
                htmlFor="lp-password"
              >
                Password
              </label>
              <div className="relative mt-[4.5px] h-[37px] w-full">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2"
                  viewBox="0 0 12 12"
                  fill="none"
                >
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
                  className="box-border h-[37px] w-full rounded-[15px] border-[0.61px] border-[#E0E0E0] bg-[#FAFAFA] px-[34px] text-[11px] font-normal text-[rgba(17,24,39,0.8)] outline-none [font-family:'Inter',sans-serif] placeholder:text-[rgba(17,24,39,0.5)] focus:border-[#2874F0] focus:bg-white aria-[invalid=true]:border-[#ef4444]"
                  {...register("password")}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 flex h-3 w-3 -translate-y-1/2 cursor-pointer items-center justify-center border-none bg-transparent p-0"
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
            <div className="mt-3 flex w-full flex-row items-center justify-between">
              <label className="flex cursor-pointer flex-row items-center gap-1.5">
                <input
                  type="checkbox"
                  className="h-3 w-3 accent-[#2874F0]"
                />
                <span className="text-[10px] font-normal text-[#424242] [font-family:'Inter',sans-serif]">
                  Remember me
                </span>
              </label>
              <button
                type="button"
                className="cursor-pointer border-none bg-transparent p-0 text-[10px] font-medium text-[#2874F0] [font-family:'Inter',sans-serif]"
                onClick={() => toast.info("Password reset is coming soon")}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-[18px] h-[43px] w-full cursor-pointer rounded-[15px] border-none bg-[linear-gradient(90deg,#2874F0_0%,#1A65E0_100%)] text-[12px] font-semibold tracking-[0.15px] text-white [font-family:'Inter',sans-serif] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Signing in…" : "Sign In →"}
            </button>

            <div className="mt-[18px] flex w-full flex-row items-center justify-center gap-1">
              <span className="text-[11px] font-normal text-[#757575] [font-family:'Inter',sans-serif]">
                New to ShopHub?
              </span>
              <Link
                href="/signup"
                className="text-[11px] font-semibold text-[#2874F0] no-underline [font-family:'Inter',sans-serif]"
              >
                Create Account →
              </Link>
            </div>
          </form>
        </div>

        {/* Bottom trust badges — centered at bottom */}
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-row items-start justify-center gap-4 max-sm:gap-3">
          {RIGHT_BADGES.map(({ bold, sub, icon }, i) => (
            <div className="flex flex-col items-center" key={i}>
              <div className="mb-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-[#EBF3FF]">
                {icon}
              </div>
              <span className="text-center text-[10px] font-semibold leading-[15px] text-[#424242] [font-family:'Inter',sans-serif]">
                {bold}
              </span>
              <span className="text-center text-[9px] font-normal leading-[14px] text-[#9E9E9E] [font-family:'Inter',sans-serif]">
                {sub}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
