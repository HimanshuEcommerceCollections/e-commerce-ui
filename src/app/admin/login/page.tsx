"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/lib/apiError";
import { Icon } from "@/components/admin/ui";
import { useAdminSession } from "@/components/admin/useAdminSession";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, logout } = useAuth();
  const { ready, isAdmin } = useAdminSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && isAdmin) router.replace("/admin/products");
  }, [ready, isAdmin, router]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      const auth = await login({ email: email.trim(), password });
      if (auth.role !== "ROLE_ADMIN") {
        // A valid customer or merchant account: don't keep it signed in here.
        logout();
        setError("This account doesn't have admin access.");
        return;
      }
      router.replace("/admin/products");
    } catch (err) {
      setError(getApiErrorMessage(err, "Sign-in failed. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dla login-page">
      <main className="login-card">
        <div className="login-brand">
          <b>Daylora</b>
          <span>Admin</span>
        </div>
        <div>
          <h1>Sign in to the admin panel</h1>
          <p className="lead">Manage products, orders, inventory and catalog imports.</p>
        </div>

        <form className="form" onSubmit={submit} noValidate>
          {error ? (
            <div className="login-alert" role="alert">
              <Icon name="info" />
              <span>{error}</span>
            </div>
          ) : null}
          <div className="fld">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="inp"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              autoFocus
            />
          </div>
          <div className="fld">
            <label htmlFor="password">Password</label>
            <div className="pw">
              <input
                id="password"
                className="inp"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShow((s) => !s)} aria-pressed={show}>
                {show ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            <Icon name="lock" />
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="login-foot">Admin access only. Customers sign in on the storefront.</p>
      </main>
    </div>
  );
}
