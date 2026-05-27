"use client";
import { useState } from "react";
import Navbar from "@/components/shared/Navbar";
import AuthModal from "@/components/shared/AuthModal";

interface User {
  name: string;
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [cartCount] = useState<number>(0);

  const openLogin = (): void => { setAuthMode("login"); setAuthOpen(true); };
  const openSignup = (): void => { setAuthMode("signup"); setAuthOpen(true); };

  return (
    <>
      <Navbar
        user={user}
        cartCount={cartCount}
        onLoginClick={openLogin}
        onSignupClick={openSignup}
      />
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
        onAuth={({ name }) => setUser({ name })}
      />
      {children}
    </>
  );
}