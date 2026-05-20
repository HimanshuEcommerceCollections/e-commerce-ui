"use client";

import Link from "next/link";
import { ShoppingCart, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/useCartStore";

export default function Navbar() {
  const totalItems = useCartStore((s) => s.totalItems());

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white/80 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/catalog" className="flex items-center gap-2 font-bold text-xl">
          <Store className="h-5 w-5 text-slate-700" />
          NexusCommerce
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/catalog" className="text-sm text-slate-600 hover:text-slate-900">
            Shop
          </Link>
          <Link href="/merchant" className="text-sm text-slate-600 hover:text-slate-900">
            Sell
          </Link>
          <Link href="/cart">
            <Button variant="outline" size="icon" className="relative">
              <ShoppingCart className="h-4 w-4" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                  {totalItems}
                </span>
              )}
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
