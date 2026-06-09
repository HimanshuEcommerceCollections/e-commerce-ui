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
import Logo from "@/components/shared/Logo";
import SocialButtons from "./SocialButtons";

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
    <div className="auth-pane">
      <div className="auth-brand">
        <Logo size="sm" />
      </div>

      <h1 className="auth-title">Welcome Back</h1>
      <p className="auth-subtitle">
        Sign in to track orders, manage purchases &amp; get personalized
        recommendations.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="auth-form" noValidate>
        {/* Email */}
        <div>
          <label htmlFor="email" className="auth-label">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            aria-invalid={!!errors.email}
            className="auth-input"
            {...register("email")}
          />
          {errors.email && <p className="auth-error">{errors.email.message}</p>}
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
              autoComplete="current-password"
              placeholder="Enter your password"
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

        {/* Remember / forgot — visual only (no backend support yet) */}
        <div className="auth-row">
          <label className="auth-checkbox-label">
            <input type="checkbox" className="auth-checkbox" />
            Remember me
          </label>
          <button
            type="button"
            onClick={() => toast.info("Password reset is coming soon")}
            className="auth-link"
          >
            Forgot password?
          </button>
        </div>

        <button type="submit" disabled={isSubmitting} className="auth-submit">
          {isSubmitting ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <div className="auth-divider">
        <span className="auth-divider-line" />
        or continue with
        <span className="auth-divider-line" />
      </div>

      <SocialButtons />

      <p className="auth-footer">
        New to ShopHub?{" "}
        <Link href="/signup" className="auth-link">
          Create Account →
        </Link>
      </p>
    </div>
  );
}
