"use client";
import { useState, useEffect, ChangeEvent } from "react";
import { X } from "lucide-react";

type AuthMode = "signup" | "login";
export type UserRole = "ROLE_CUSTOMER" | "ROLE_MERCHANT" | "ROLE_ADMIN";

export interface AuthPayload {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  role: UserRole;
  issuedAt: string;
  mode: AuthMode;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
  onAuth: (payload: AuthPayload) => void;
}

interface FormState {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  password: string;
}

const AuthModal = ({
  isOpen,
  onClose,
  initialMode = "signup",
  onAuth,
}: AuthModalProps) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    displayName: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [isMerchant, setIsMerchant] = useState<boolean>(false);

  useEffect(() => {
    setMode(initialMode);
    setForm({ firstName: "", lastName: "", displayName: "", email: "", password: "" });
    setIsMerchant(false);
  }, [initialMode, isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (): Promise<void> => {
    setLoading(true);
    await new Promise<void>((r) => setTimeout(r, 800));
    setLoading(false);
    onAuth({
      accessToken: "mock-token",
      tokenType: "Bearer",
      expiresIn: 86400000,
      userId: "",
      email: form.email,
      firstName: form.firstName,
      lastName: form.lastName,
      displayName: form.displayName.trim() || null,
      role: isMerchant ? "ROLE_MERCHANT" : "ROLE_CUSTOMER",
      issuedAt: new Date().toISOString(),
      mode,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-[rgba(0,0,0,0.7)] backdrop-blur-[8px]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md relative rounded-2xl p-8 bg-[var(--bg-surface)] border border-[#222222]">

        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all bg-[var(--bg-muted)] text-[var(--text-muted)] hover:bg-[var(--border-default)] hover:text-[var(--text-white)]">
          <X size={15} />
        </button>

        {/* ── SIGN UP ─────────────────────────────────────────── */}
        {mode === "signup" ? (
          <>
            <h2 className="text-lg font-bold mt-3 mb-1 text-[var(--text-primary)]">Create your account</h2>

            <div className="space-y-4">

              {/* First + Last name — side by side, matches backend firstName / lastName */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-[var(--text-muted)]">First Name</label>
                  <input
                    className="w-full text-sm px-4 py-3 rounded-xl outline-none transition-colors bg-[var(--bg-elevated)] border-[1.5px] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:border-[var(--brand)]"
                    name="firstName"
                    placeholder="John"
                    autoComplete="given-name"
                    value={form.firstName}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-[var(--text-muted)]">Last Name</label>
                  <input
                    className="w-full text-sm px-4 py-3 rounded-xl outline-none transition-colors bg-[var(--bg-elevated)] border-[1.5px] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:border-[var(--brand)]"
                    name="lastName"
                    placeholder="Doe"
                    autoComplete="family-name"
                    value={form.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Display Name — optional, backend displayName field */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-[var(--text-muted)]">Display Name (optional)</label>
                <input
                  className="w-full text-sm px-4 py-3 rounded-xl outline-none transition-colors bg-[var(--bg-elevated)] border-[1.5px] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:border-[var(--brand)]"
                  name="displayName"
                  placeholder="How should we call you?"
                  autoComplete="nickname"
                  value={form.displayName}
                  onChange={handleChange}
                />
              </div>

              {/* Email — matches backend email field (unique, max 255) */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-[var(--text-muted)]">Email Address</label>
                <input
                  className="w-full text-sm px-4 py-3 rounded-xl outline-none transition-colors bg-[var(--bg-elevated)] border-[1.5px] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:border-[var(--brand)]"
                  name="email"
                  type="email"
                  placeholder="you@email.com"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>

              {/* Password — hashed on backend */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-[var(--text-muted)]">Password</label>
                <input
                  className="w-full text-sm px-4 py-3 rounded-xl outline-none transition-colors bg-[var(--bg-elevated)] border-[1.5px] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:border-[var(--brand)]"
                  type="password"
                  name="password"
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                />
              </div>

              {/* Role toggle — Customer (left) / Merchant (right) */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-[var(--text-muted)]">I am a</label>
                <div
                  className="relative flex rounded-xl cursor-pointer select-none overflow-hidden"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1.5px solid var(--border-default)",
                  }}
                  onClick={() => setIsMerchant((p) => !p)}
                >
                  <div
                    className="absolute top-0 bottom-0 w-1/2 rounded-xl transition-all duration-300"
                    style={{
                      background: "var(--brand)",
                      left: isMerchant ? "50%" : "0",
                    }}
                  />
                  <span
                    className="relative z-10 flex-1 text-center text-sm font-semibold py-2.5 transition-colors duration-300"
                    style={{ color: !isMerchant ? "#ffffff" : "var(--text-muted)" }}
                  >
                    Customer
                  </span>
                  <span
                    className="relative z-10 flex-1 text-center text-sm font-semibold py-2.5 transition-colors duration-300"
                    style={{ color: isMerchant ? "#ffffff" : "var(--text-muted)" }}
                  >
                    Merchant
                  </span>
                </div>
              </div>

            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn btn-primary w-full mt-6 py-3 rounded-xl"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>

            <p className="text-center text-sm mt-5 text-[var(--text-muted)]">
              Already have an account?{" "}
              <span onClick={() => setMode("login")} className="font-semibold cursor-pointer transition-colors text-[var(--brand)] hover:text-[var(--brand-soft)]">
                Login
              </span>
            </p>
          </>

        ) : (

        /* ── LOGIN ──────────────────────────────────────────── */
          <>
            <h2 className="text-lg font-bold mt-3 mb-1 text-[var(--text-primary)]">Welcome back</h2>

            <p className="text-xs mb-6 text-[var(--text-muted)]">Login to continue shopping</p>

            <div className="space-y-4">

              {/* Email — backend authenticates only via email, no phone */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-[var(--text-muted)]">Email Address</label>
                <input
                  className="w-full text-sm px-4 py-3 rounded-xl outline-none transition-colors bg-[var(--bg-elevated)] border-[1.5px] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:border-[var(--brand)]"
                  name="email"
                  type="email"
                  placeholder="you@email.com"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-[var(--text-muted)]">Password</label>
                <input
                  className="w-full text-sm px-4 py-3 rounded-xl outline-none transition-colors bg-[var(--bg-elevated)] border-[1.5px] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:border-[var(--brand)]"
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                />
              </div>

            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn btn-primary w-full mt-6 py-3 rounded-xl"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <p className="text-center text-sm mt-5 text-[var(--text-muted)]">
              Don&apos;t have an account?{" "}
              <span onClick={() => setMode("signup")} className="font-semibold cursor-pointer transition-colors text-[var(--brand)] hover:text-[var(--brand-soft)]">
                Create one
              </span>
            </p>
          </>
        )}

      </div>
    </div>
  );
};

export default AuthModal;
