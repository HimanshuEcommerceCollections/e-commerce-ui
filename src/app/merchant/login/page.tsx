"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthShell, NotApproved, SellerSignIn } from "@/components/seller/SellerAuth";
import { Loading } from "@/components/seller/ui";
import { useSellerSession, useTitle } from "@/components/seller/useSellerSession";
import { useAuthStore } from "@/store/useAuthStore";
import type { AuthResponse } from "@/types/api/auth.types";

/** Only same-site portal paths: never an open redirect. */
const safeNext = (raw: string | null) => (raw && raw.startsWith("/merchant") && !raw.startsWith("//") ? raw : "/merchant");

export default function SellerLoginPage() {
  useTitle("Sign in");
  const router = useRouter();
  const { ready, user, isSeller } = useSellerSession();
  const signOut = useAuthStore((s) => s.signOut);
  const [next, setNext] = useState("/merchant");
  const [justSignedIn, setJustSignedIn] = useState<AuthResponse | null>(null);

  useEffect(() => {
    setNext(safeNext(new URLSearchParams(window.location.search).get("next")));
  }, []);

  useEffect(() => {
    if (ready && isSeller) router.replace(next);
  }, [ready, isSeller, next, router]);

  const who = justSignedIn ?? user;
  if (!ready) return <Loading />;
  if (who && who.role !== "ROLE_MERCHANT") {
    return (
      <NotApproved
        auth={who}
        onSignOut={async () => {
          await signOut();
          setJustSignedIn(null);
        }}
      />
    );
  }
  if (isSeller) return <Loading label="Signing you in…" />;
  return (
    <AuthShell>
      <SellerSignIn
        onSignedIn={(auth) => {
          if (auth.role === "ROLE_MERCHANT") router.replace(next);
          else setJustSignedIn(auth);
        }}
      />
    </AuthShell>
  );
}
