"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { signupSchema, type SignupFormValues } from "@/lib/validations/auth";
import { getApiErrorMessage } from "@/lib/apiError";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/components/shared/Logo";
import SocialButtons from "./SocialButtons";

export default function SignupForm() {
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
    <div className="mx-auto flex w-full max-w-md flex-col rounded-3xl border border-slate-200 bg-white p-9 shadow-sm">
      <div className="mb-6">
        <Logo size="sm" />
      </div>

      <h1 className="text-2xl font-bold text-slate-900">Create Your Account</h1>
      <p className="mt-1 text-sm text-slate-500">
        Join 5M+ shoppers. Get deals, track orders, enjoy fast delivery.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        {/* Full name */}
        <div>
          <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-slate-700">
            Full Name
          </label>
          <input
            id="fullName"
            autoComplete="name"
            placeholder="Enter your full name"
            aria-invalid={!!errors.fullName}
            className="w-full border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-[15px] aria-[invalid=true]:border-red-400"
            {...register("fullName")}
          />
          {errors.fullName && <p className="auth-error">{errors.fullName.message}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email address"
            aria-invalid={!!errors.email}
            className="w-full border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-[15px] aria-[invalid=true]:border-red-400"
            {...register("email")}
          />
          {errors.email && <p className="auth-error">{errors.email.message}</p>}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-slate-700">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="Enter phone number"
            aria-invalid={!!errors.phone}
            className="w-full border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-[15px] aria-[invalid=true]:border-red-400"
            {...register("phone")}
          />
          {errors.phone && <p className="auth-error">{errors.phone.message}</p>}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create a strong password"
              aria-invalid={!!errors.password}
              className="w-full border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-[15px] aria-[invalid=true]:border-red-400 pr-10"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="auth-error">{errors.password.message}</p>}
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-slate-700">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Confirm your password"
              aria-invalid={!!errors.confirmPassword}
              className="w-full border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-[15px] aria-[invalid=true]:border-red-400 pr-10"
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((s) => !s)}
              aria-label={showConfirm ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="auth-error">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Terms — required */}
        <div>
          <label className="flex items-start gap-2 text-xs text-slate-500">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" {...register("acceptTerms")} />
            <span>
              I agree to ShopHub&apos;s{" "}
              <Link href="/terms" className="font-medium text-blue-600 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="font-medium text-blue-600 hover:underline">
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="auth-error">{errors.acceptTerms.message}</p>
          )}
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 rounded-[15px]">
          {isSubmitting ? "Creating account…" : "Create Account →"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        or sign up with
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <SocialButtons />

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-blue-600 hover:underline">
          Sign In →
        </Link>
      </p>
    </div>
  );
}
