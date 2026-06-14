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

/* Shared styles (former .signup-* classes) */
const fieldGroupCls =
  "flex flex-col items-start w-full mt-4 first:mt-0";
const fieldLabelCls =
  "[font-family:'Inter',sans-serif] font-medium text-[13px] leading-[20px] text-[#424242]";
const inputWrapperCls =
  "relative w-full h-12 mt-[6px]";
const inputBaseCls =
  "absolute w-full h-12 left-0 top-0 bg-[#FAFAFA] border-[0.8px] border-solid border-[#E0E0E0] rounded-[20px] [font-family:'Inter',sans-serif] font-normal text-[14px] text-[rgba(33,33,33,0.8)] outline-none box-border py-0 placeholder:text-[rgba(33,33,33,0.5)] focus:border-[#2874F0] focus:bg-[#FFFFFF] aria-[invalid=true]:border-[#ef4444] aria-[invalid=true]:focus:border-[#ef4444]";
const inputIconLeftCls =
  "absolute w-4 h-4 left-4 top-4 z-[1] pointer-events-none";
const inputIconRightCls =
  "absolute w-4 h-4 right-4 top-4 cursor-pointer bg-transparent border-none p-0 z-[1] flex items-center justify-center";
const termsLinkCls =
  "text-[#2874F0] font-medium underline";

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
    <div className="w-full min-h-screen flex flex-row bg-[#F5F7FA]">

      {/* ── LEFT PANEL — scrollable ── */}
      <div className="w-[45%] max-lg:w-full min-h-screen bg-[radial-gradient(84.79%_61.91%_at_50%_50%,rgba(40,116,240,0.04)_0.19%,rgba(0,0,0,0)_0.19%),#F5F7FA] relative flex flex-col items-center pt-[21px] pb-10">

        <div className="flex flex-col items-start px-12 py-10 max-md:px-6 max-md:py-8 bg-[#FFFFFF] shadow-[0px_8px_40px_rgba(0,0,0,0.1)] rounded-[24px] w-[calc(100%-128px)] max-md:w-[calc(100%-32px)] max-w-[403px] box-border">
          {/* Logo row */}
          <div className="flex flex-row items-center gap-3 w-full">
            <div className="w-9 h-9 bg-[#2874F0] rounded-full flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M2.5 3.5H4.5L7 14H16L18.5 6H7" stroke="#FFFFFF" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="8.5" cy="17" r="1.2" stroke="#FFFFFF" strokeWidth="1.67"/>
                <circle cx="14.5" cy="17" r="1.2" stroke="#FFFFFF" strokeWidth="1.67"/>
              </svg>
            </div>
            <span className="[font-family:'Inter',sans-serif] font-bold text-[18px] leading-[27px] text-[#212121]">ShopHub</span>
          </div>

          <h1 className="[font-family:'Inter',sans-serif] font-bold text-[26px] leading-[39px] text-[#212121] mt-6 w-full">Create Your Account</h1>
          <p className="[font-family:'Inter',sans-serif] font-normal text-[14px] leading-[21px] text-[#757575] mt-2 w-full">Join 5M+ shoppers. Get deals, track orders, enjoy fast delivery.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col items-start w-full mt-6" noValidate>

            {/* Full Name */}
            <div className={fieldGroupCls}>
              <label className={fieldLabelCls} htmlFor="su-fullName">Full Name</label>
              <div className={inputWrapperCls}>
                <svg className={inputIconLeftCls} width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 8C9.66 8 11 6.66 11 5C11 3.34 9.66 2 8 2C6.34 2 5 3.34 5 5C5 6.66 6.34 8 8 8Z" stroke="#9E9E9E" strokeWidth="1.33"/>
                  <path d="M2 14C2 11.79 4.69 10 8 10C11.31 10 14 11.79 14 14" stroke="#9E9E9E" strokeWidth="1.33" strokeLinecap="round"/>
                </svg>
                <input
                  id="su-fullName"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  aria-invalid={!!errors.fullName}
                  className={`${inputBaseCls} pl-11 pr-4`}
                  {...register("fullName")}
                />
              </div>
              {errors.fullName && <p className="auth-error">{errors.fullName.message}</p>}
            </div>

            {/* Email */}
            <div className={fieldGroupCls}>
              <label className={fieldLabelCls} htmlFor="su-email">Email Address</label>
              <div className={inputWrapperCls}>
                <svg className={inputIconLeftCls} width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1.33" y="2.67" width="13.33" height="10.67" rx="1.33" stroke="#9E9E9E" strokeWidth="1.33"/>
                  <path d="M1.33 5.33L8 9.33L14.67 5.33" stroke="#9E9E9E" strokeWidth="1.33"/>
                </svg>
                <input
                  id="su-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email address"
                  aria-invalid={!!errors.email}
                  className={`${inputBaseCls} pl-11 pr-11`}
                  {...register("email")}
                />
              </div>
              {errors.email && <p className="auth-error">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div className={fieldGroupCls}>
              <label className={fieldLabelCls} htmlFor="su-phone">Phone Number</label>
              <div className={inputWrapperCls}>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-row items-center gap-[6px] z-[1]">
                  <span className="[font-family:'Inter',sans-serif] font-normal text-[14px] text-[#424242]">🇺🇸</span>
                  <span className="[font-family:'Inter',sans-serif] font-normal text-[13px] text-[#757575]">+1</span>
                </div>
                <input
                  id="su-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="Enter phone number"
                  aria-invalid={!!errors.phone}
                  className={`${inputBaseCls} pl-20 pr-4`}
                  {...register("phone")}
                />
              </div>
              {errors.phone && <p className="auth-error">{errors.phone.message}</p>}
            </div>

            {/* Password */}
            <div className={fieldGroupCls}>
              <label className={fieldLabelCls} htmlFor="su-password">Password</label>
              <div className={inputWrapperCls}>
                <svg className={inputIconLeftCls} width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="7.33" width="12" height="7.33" rx="1.33" stroke="#9E9E9E" strokeWidth="1.33"/>
                  <path d="M4.67 7.33V5.33C4.67 3.49 6.16 2 8 2C9.84 2 11.33 3.49 11.33 5.33V7.33" stroke="#9E9E9E" strokeWidth="1.33"/>
                </svg>
                <input
                  id="su-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  aria-invalid={!!errors.password}
                  className={`${inputBaseCls} pl-11 pr-11`}
                  {...register("password")}
                />
                <button
                  type="button"
                  className={inputIconRightCls}
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} color="#9E9E9E" /> : <Eye size={16} color="#9E9E9E" />}
                </button>
              </div>
              {errors.password && <p className="auth-error">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div className={fieldGroupCls}>
              <label className={fieldLabelCls} htmlFor="su-confirmPassword">Confirm Password</label>
              <div className={inputWrapperCls}>
                <svg className={inputIconLeftCls} width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="7.33" width="12" height="7.33" rx="1.33" stroke="#9E9E9E" strokeWidth="1.33"/>
                  <path d="M4.67 7.33V5.33C4.67 3.49 6.16 2 8 2C9.84 2 11.33 3.49 11.33 5.33V7.33" stroke="#9E9E9E" strokeWidth="1.33"/>
                </svg>
                <input
                  id="su-confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Confirm your password"
                  aria-invalid={!!errors.confirmPassword}
                  className={`${inputBaseCls} pl-11 pr-11`}
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  className={inputIconRightCls}
                  onClick={() => setShowConfirm((s) => !s)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff size={16} color="#9E9E9E" /> : <Eye size={16} color="#9E9E9E" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="auth-error">{errors.confirmPassword.message}</p>}
            </div>

            {/* Terms */}
            <div className="flex flex-row items-start gap-2 w-full mt-6">
              <input
                type="checkbox"
                className="w-[13px] h-4 mt-0.5 shrink-0 accent-[#2874F0]"
                {...register("acceptTerms")}
              />
              <span className="[font-family:'Inter',sans-serif] font-normal text-[13px] leading-[18px] text-[#424242]">
                I agree to ShopHub&apos;s{" "}
                <Link href="/terms" className={termsLinkCls}>Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className={termsLinkCls}>Privacy Policy</Link>
              </span>
            </div>
            {errors.acceptTerms && <p className="auth-error">{errors.acceptTerms.message}</p>}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex flex-row justify-center items-center gap-2 w-full h-14 bg-[linear-gradient(90deg,#2874F0_0%,#1A65E0_100%)] rounded-[20px] border-none cursor-pointer mt-5 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span className="[font-family:'Inter',sans-serif] font-semibold text-[16px] leading-[24px] text-center text-[#FFFFFF]">
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
            <div className="flex flex-row justify-center items-center w-full mt-5 gap-1">
              <span className="[font-family:'Inter',sans-serif] font-normal text-[14px] leading-[21px] text-[#757575]">Already have an account?</span>
              <Link href="/login" className="[font-family:'Inter',sans-serif] font-semibold text-[14px] leading-[21px] text-[#2874F0] flex items-center gap-1 no-underline">
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
        <div className="flex flex-row justify-center items-center gap-8 max-md:gap-6 w-[calc(100%-128px)] max-md:w-[calc(100%-32px)] max-w-[403px] pt-6">
          {TRUST_BADGES.map(({ emoji, bold, sub }, i) => (
            <div className="flex flex-col items-center" key={i}>
              <div className="w-10 h-10 bg-[#EBF3FF] rounded-full flex items-center justify-center mb-2">
                <span className="text-[18px] leading-[27px]">{emoji}</span>
              </div>
              <span className="[font-family:'Inter',sans-serif] font-semibold text-[12px] leading-[18px] text-center text-[#424242]">{bold}</span>
              <span className="[font-family:'Inter',sans-serif] font-normal text-[11px] leading-[16px] text-center text-[#9E9E9E]">{sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL — sticky ── */}
      <div className="w-[55%] h-screen sticky top-0 bg-[linear-gradient(135deg,#0D1B4B_0%,#1A3A8F_50%,#2874F0_100%)] flex flex-col items-start overflow-hidden max-lg:hidden">

        {/* Navbar */}
        <div className="flex flex-row items-center pt-12 px-14 pb-0 gap-3 w-full h-[88px] shrink-0">
          <div className="w-10 h-10 bg-[#FFFFFF] rounded-full flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M2.5 3.5H4.5L7 14H16L18.5 6H7" stroke="#2874F0" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="8.5" cy="17" r="1.2" stroke="#2874F0" strokeWidth="1.67"/>
              <circle cx="14.5" cy="17" r="1.2" stroke="#2874F0" strokeWidth="1.67"/>
            </svg>
          </div>
          <span className="[font-family:'Inter',sans-serif] font-extrabold text-[22px] leading-[33px] tracking-[-0.5px] text-[#FFFFFF]">ShopHub</span>
          <div className="flex flex-row items-center gap-2 py-1 px-3 bg-[rgba(255,255,255,0.15)] rounded-full ml-4">
            <div className="w-2 h-2 bg-[#388E3C] rounded-full" />
            <span className="[font-family:'Inter',sans-serif] font-medium text-[11px] leading-[16px] text-[#FFFFFF]">Trusted by 5M+ shoppers</span>
          </div>
        </div>

        {/* Vertically centered content */}
        <div className="flex-1 flex items-start pt-12 px-14 pb-0 w-full">
          <div className="flex flex-col items-start w-full max-w-[502px]">
            <span className="[font-family:'Inter',sans-serif] font-normal text-[18px] leading-[27px] text-[#FFFFFF] opacity-80">New here?</span>
            <h2 className="[font-family:'Inter',sans-serif] font-extrabold text-[52px] leading-[57px] tracking-[-1.5px] text-[#FFFFFF] mt-3">Join ShopHub Today</h2>
            <p className="[font-family:'Inter',sans-serif] font-normal text-[18px] leading-[27px] text-[rgba(255,255,255,0.7)] mt-5">Your one-stop shop for everything you love.</p>
            <div className="flex flex-col items-start mt-10 w-full">
              {RIGHT_FEATURES.map(({ emoji, text }, i) => (
                <div className="flex flex-row items-center gap-3 pt-4 first:pt-0 w-full" key={i}>
                  <div className="w-7 h-7 bg-[#FF9F00] rounded-full flex items-center justify-center shrink-0 text-[14px]">{emoji}</div>
                  <span className="[font-family:'Inter',sans-serif] font-medium text-[15px] leading-[22px] text-[#FFFFFF]">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats cards — absolute above bottom bar */}
        <div className="absolute flex flex-row items-start gap-4 left-14 right-14 bottom-[100px] justify-center">
          {STATS.map(({ number, label }, i) => (
            <div className="box-border flex flex-col items-start p-4 min-w-[120px] h-[97.6px] bg-[rgba(255,255,255,0.14)] border-[0.8px] border-solid border-[rgba(255,255,255,0.22)] rounded-[16px]" key={i}>
              <div className="[font-family:'Inter',sans-serif] font-extrabold text-[28px] leading-[42px] text-center text-[#FFFFFF] w-full">{number}</div>
              <div className="[font-family:'Inter',sans-serif] font-normal text-[12px] leading-[18px] text-center text-[rgba(255,255,255,0.8)] w-full mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Bottom trust bar */}
        <div className="w-full h-14 bg-[rgba(0,0,0,0.2)] shrink-0 relative">
          {BOTTOM_ITEMS.map(({ emoji, label, left }, i) => (
            <div key={i} className="absolute flex flex-row items-center gap-2 top-4 opacity-80" style={{ left: `${left}px` }}>
              <span className="[font-family:'Inter',sans-serif] font-medium text-[16px] text-[#FFFFFF]">{emoji}</span>
              <span className="[font-family:'Inter',sans-serif] font-medium text-[12px] leading-[18px] text-[#FFFFFF]">{label}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
