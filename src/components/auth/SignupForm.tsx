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
    <div className="auth-pane">
      <div className="auth-brand">
        <Logo size="sm" />
      </div>

      <h1 className="auth-title">Create Your Account</h1>
      <p className="auth-subtitle">
        Join 5M+ shoppers. Get deals, track orders, enjoy fast delivery.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="auth-form" noValidate>
        {/* Full name */}
        <div>
          <label htmlFor="fullName" className="auth-label">
            Full Name
          </label>
          <input
            id="fullName"
            autoComplete="name"
            placeholder="Enter your full name"
            aria-invalid={!!errors.fullName}
            className="auth-input"
            {...register("fullName")}
          />
          {errors.fullName && <p className="auth-error">{errors.fullName.message}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="auth-label">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email address"
            aria-invalid={!!errors.email}
            className="auth-input"
            {...register("email")}
          />
          {errors.email && <p className="auth-error">{errors.email.message}</p>}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="auth-label">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="Enter phone number"
            aria-invalid={!!errors.phone}
            className="auth-input"
            {...register("phone")}
          />
          {errors.phone && <p className="auth-error">{errors.phone.message}</p>}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="auth-label">
            Password
          </label>
          <div className="auth-password-wrap">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create a strong password"
              aria-invalid={!!errors.password}
              className="auth-input"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="auth-password-toggle"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="auth-error">{errors.password.message}</p>}
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor="confirmPassword" className="auth-label">
            Confirm Password
          </label>
          <div className="auth-password-wrap">
            <input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Confirm your password"
              aria-invalid={!!errors.confirmPassword}
              className="auth-input"
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((s) => !s)}
              aria-label={showConfirm ? "Hide password" : "Show password"}
              className="auth-password-toggle"
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
          <label className="auth-terms">
            <input type="checkbox" className="auth-checkbox" {...register("acceptTerms")} />
            <span>
              I agree to ShopHub&apos;s{" "}
              <Link href="/terms" className="auth-link">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="auth-link">
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="auth-error">{errors.acceptTerms.message}</p>
          )}
        </div>

        <button type="submit" disabled={isSubmitting} className="auth-submit">
          {isSubmitting ? "Creating account…" : "Create Account →"}
        </button>
      </form>

      <div className="auth-divider">
        <span className="auth-divider-line" />
        or sign up with
        <span className="auth-divider-line" />
      </div>

      <SocialButtons />

      <p className="auth-footer">
        Already have an account?{" "}
        <Link href="/login" className="auth-link">
          Sign In →
        </Link>
      </p>
    </div>
  );
}
