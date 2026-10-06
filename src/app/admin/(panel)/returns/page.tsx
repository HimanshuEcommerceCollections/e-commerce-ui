"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Returns live under Orders › Returns (design 12); old links keep working. */
export default function AdminReturnsRedirect() {
  const router = useRouter();
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    router.replace(`/admin/orders?tab=returns${id ? `&return=${encodeURIComponent(id)}` : ""}`);
  }, [router]);
  return null;
}
