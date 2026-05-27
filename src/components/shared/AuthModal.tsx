"use client";
import { useState, useEffect, ChangeEvent } from "react";
import { X } from "lucide-react";

type AuthMode = "signup" | "login";

interface AuthPayload {
  name: string;
  mode: AuthMode;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
  onAuth: (payload: AuthPayload) => void;
}

interface FormState {
  name: string;
  contact: string;
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
    name: "",
    contact: "",
    password: "",
  });
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setMode(initialMode);
    setForm({ name: "", contact: "", password: "" });
  }, [initialMode, isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (): Promise<void> => {
    setLoading(true);
    await new Promise<void>((r) => setTimeout(r, 800));
    setLoading(false);
    onAuth({ name: form.name || form.contact, mode });
    onClose();
  };

  const inputCls =
    "w-full bg-[#1a1a1a] border border-[#2a2a2a] focus:border-violet-600 rounded-xl text-slate-200 placeholder:text-[#444] text-sm px-4 py-3 outline-none transition-colors";
  const labelCls =
    "block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5";

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box">
        <button onClick={onClose} className="modal-close-btn">
          <X size={15} />
        </button>

        <p className="nexus-logo text-xl">
          Nexus<span className="nexus-logo-dot">.</span>
        </p>

        {mode === "signup" ? (
          <>
            <h2 className="modal-title">Create your account</h2>
            <p className="modal-subtitle">
              Join thousands shopping smarter on Nexus
            </p>

            <div className="space-y-4">
              <div>
                <label className="modal-label">Full Name</label>
                <input
                  className="modal-input"
                  name="name"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="modal-label">Phone / Email</label>
                <input
                  className="modal-input"
                  name="contact"
                  placeholder="+91 98765 43210 or you@email.com"
                  value={form.contact}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="modal-label">Password</label>
                <input
                  className="modal-input"
                  type="password"
                  name="password"
                  placeholder="Create a strong password"
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
              {loading ? "Creating account..." : "Sign Up"}
            </button>

            <p className="modal-footer">
              Already have an account?{" "}
              <span
                onClick={() => setMode("login")}
                className="modal-footer-link"
              >
                Login
              </span>
            </p>
          </>
        ) : (
          <>
            <h2 className="modal-title">Welcome back</h2>
            <p className="modal-subtitle">Login to continue shopping</p>

            <div className="space-y-4">
              <div>
                <label className="modal-label">Phone / Email</label>
                <input
                  className="modal-input"
                  name="contact"
                  placeholder="+91 98765 43210 or you@email.com"
                  value={form.contact}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="modal-label">Password</label>
                <input
                  className="modal-input"
                  type="password"
                  name="password"
                  placeholder="Enter your password"
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

            <p className="modal-footer">
              Don&apos;t have an account?{" "}
              <span
                onClick={() => setMode("signup")}
                className="modal-footer-link"
              >
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
