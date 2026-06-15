import type { ReactNode } from "react";
import Navbar from "@/components/home/Navbar";

export default function SellerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* <Navbar /> */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
