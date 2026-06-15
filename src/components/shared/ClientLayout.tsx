"use client";
import Navbar from "@/components/home/Navbar";
import AuthModal from "@/components/shared/AuthModal";
import type { UserRole } from "@/components/shared/AuthModal";
import { useState } from "react";

export interface User {
  id:           string;
  email:        string;
  firstName:    string;
  lastName:     string;
  displayName:  string | null;
  role:         UserRole;
  accessToken:  string;
  expiresIn:    number;
}

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

export interface Cart {
  cartId:      string;
  customerId:  string;
  items:       CartItem[];
  totalItems:  number;
  totalPrice:  number;
  updatedAt:   string;
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [authOpen, setAuthOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");

  void setAuthMode;

  return (
    <>
      <Navbar />
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
        onAuth={() => {}}
      />
      {children}
    </>
  );
}
