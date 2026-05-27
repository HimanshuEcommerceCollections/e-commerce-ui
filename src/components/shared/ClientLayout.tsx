"use client";
import { useState } from "react";
import Navbar from "@/components/shared/Navbar";
import AuthModal, { AuthPayload } from "@/components/shared/AuthModal";
import type { UserRole } from "@/components/shared/AuthModal";

/* ─────────────────────────────────────────────────────────────
   User — mirrors backend AuthResponse fields used client-side
   id        : userId from AuthResponse (UUID)
   accessToken: JWT — used in Authorization: Bearer header
   expiresIn  : token lifetime in ms
───────────────────────────────────────────────────────────── */
export interface User {
  id:           string;        // userId from AuthResponse
  email:        string;
  firstName:    string;
  lastName:     string;
  displayName:  string | null; // nullable per API spec
  role:         UserRole;
  accessToken:  string;        // JWT — used in Authorization: Bearer header
  expiresIn:    number;        // token lifetime in ms
}

/* ─────────────────────────────────────────────────────────────
   CartItem — mirrors GET /api/cart response item exactly
───────────────────────────────────────────────────────────── */
export interface CartItem {
  productId:       string;
  productName:     string;
  sku:             string;
  primaryImageUrl: string;
  unitPrice:       number;
  quantity:        number;
  subtotal:        number;
  available:       boolean;
}

/* ─────────────────────────────────────────────────────────────
   Cart — mirrors GET /api/cart response envelope exactly
───────────────────────────────────────────────────────────── */
export interface Cart {
  cartId:      string;    // cart UUID
  customerId:  string;    // user UUID, matches Cart.java userId
  items:       CartItem[];
  totalItems:  number;    // server-computed total quantity
  totalPrice:  number;    // server-computed total price
  updatedAt:   string;
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [user,     setUser]     = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");

  /* Cart — full Cart object from API; cartCount derived from totalItems */
  const [cart, setCart] = useState<Cart | null>(null);
  const cartCount = cart?.totalItems ?? 0;

  // setCart is used when cart API is integrated; suppress unused-var lint for now
  void setCart;

  const openLogin  = (): void => { setAuthMode("login");  setAuthOpen(true); };
  const openSignup = (): void => { setAuthMode("signup"); setAuthOpen(true); };

  /* Called by AuthModal after mock submit.
     Maps AuthPayload → User client model. */
  const handleAuth = (payload: AuthPayload): void => {
    setUser({
      id:          payload.userId,
      email:       payload.email,
      firstName:   payload.firstName,
      lastName:    payload.lastName,
      displayName: payload.displayName,
      role:        payload.role,
      accessToken: payload.accessToken,
      expiresIn:   payload.expiresIn,
    });
  };

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
        onAuth={handleAuth}
      />
      {children}
    </>
  );
}
