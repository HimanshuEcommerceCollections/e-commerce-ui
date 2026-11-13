"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { NotApproved } from "./SellerAuth";
import { SellerShell } from "./SellerShell";
import { Loading } from "./ui";
import { useSellerSession } from "./useSellerSession";

/**
 * Who sees what under /merchant: the sign-in page is public; everything else
 * needs an approved seller (ROLE_MERCHANT). Signed-out visitors go to the
 * sign-in page and come back; signed-in non-sellers see "not approved yet".
 */
export function SellerGate({ children }: { children: ReactNode }) {
  const path = usePathname() ?? "/merchant";
  const router = useRouter();
  const { ready, signedIn, user, isSeller } = useSellerSession();
  const signOut = useAuthStore((s) => s.signOut);
  const isLogin = path === "/merchant/login";

  useEffect(() => {
    if (ready && !signedIn && !isLogin) {
      const next = window.location.pathname + window.location.search;
      router.replace(`/merchant/login?next=${encodeURIComponent(next)}`);
    }
  }, [ready, signedIn, isLogin, router]);

  if (isLogin) return <>{children}</>;
  if (!ready || !signedIn) return <Loading label="Opening the Seller Portal…" />;
  if (!isSeller && user) {
    return (
      <NotApproved
        auth={user}
        onSignOut={async () => {
          await signOut();
          router.replace("/merchant/login");
        }}
      />
    );
  }
  return <SellerShell>{children}</SellerShell>;
}
