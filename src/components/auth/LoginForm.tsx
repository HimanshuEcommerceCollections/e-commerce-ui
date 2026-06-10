"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
import { getApiErrorMessage } from "@/lib/apiError";
import { useAuth } from "@/hooks/useAuth";

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="login-card">
      {/* Logo row */}
      <div className="login-card-logo-row">
        <div className="login-card-logo-icon">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M2 3H4L6 11H12.5L14 6H6" stroke="#FFFFFF" strokeWidth="1.27" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="6.5" cy="13" r="0.8" stroke="#FFFFFF" strokeWidth="1.27"/>
            <circle cx="11.5" cy="13" r="0.8" stroke="#FFFFFF" strokeWidth="1.27"/>
          </svg>
        </div>
        <span className="login-card-brand">ShopHub</span>
      </div>

      <h1 className="login-card-heading">Welcome Back</h1>
      <p className="login-card-para">
        Sign in to track orders, manage purchases &amp; get personalized recommendations.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="login-form" noValidate>
        {/* Email */}
        <label className="login-field-label" htmlFor="email">Email Address</label>
        <div className="login-input-wrapper">
          <svg className="login-input-icon-left" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="2" width="10" height="8" rx="1" stroke="#9E9E9E" strokeWidth="1.02"/>
            <path d="M1 4L6 7L11 4" stroke="#9E9E9E" strokeWidth="1.02"/>
          </svg>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            aria-invalid={!!errors.email}
            className="login-input"
            {...register("email")}
          />
        </div>
        {errors.email && <p className="auth-error">{errors.email.message}</p>}

        {/* Password */}
        <div className="login-password-field">
          <label className="login-field-label" htmlFor="password">Password</label>
          <div className="login-input-wrapper">
            <svg className="login-input-icon-left" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="1.5" y="5.5" width="9" height="5" rx="1" stroke="#9E9E9E" strokeWidth="1.02"/>
              <path d="M3.5 5.5V4a2.5 2.5 0 0 1 5 0v1.5" stroke="#9E9E9E" strokeWidth="1.02"/>
            </svg>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              aria-invalid={!!errors.password}
              className="login-input"
              {...register("password")}
            />
            <button
              type="button"
              className="login-input-icon-right"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={12} color="#9E9E9E" /> : <Eye size={12} color="#9E9E9E" />}
            </button>
          </div>
          {errors.password && <p className="auth-error">{errors.password.message}</p>}
        </div>

        {/* Remember / forgot */}
        <div className="login-remember-row">
          <label className="login-remember-label">
            <input type="checkbox" className="login-checkbox" />
            <span className="login-remember-text">Remember me</span>
          </label>
          <button
            type="button"
            className="login-forgot"
            onClick={() => toast.info("Password reset is coming soon")}
          >
            Forgot password?
          </button>
        </div>

        <button type="submit" disabled={isSubmitting} className="login-sign-in-btn">
          {isSubmitting ? "Signing in…" : "Sign In →"}
        </button>
      </form>

      <div className="login-create-row">
        <span className="login-create-text">New to ShopHub?</span>
        <Link href="/signup" className="login-create-link">Create Account →</Link>
      </div>
    </div>
  );
}
