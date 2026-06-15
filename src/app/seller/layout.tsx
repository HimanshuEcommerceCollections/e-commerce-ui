import type { ReactNode } from "react";

export default function SellerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
