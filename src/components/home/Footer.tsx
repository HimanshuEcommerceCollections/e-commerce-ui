import { ShoppingCart } from "lucide-react";
import Container from "./Container";
import { footerColumns, paymentMethods } from "./data";

/** Site footer with navigation columns, legal text, and payment badges. */
export default function Footer() {
  return (
    <footer className="border-t-4 border-blue-600 bg-slate-900 pt-14 pb-8 text-slate-400">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
          {/* Brand */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                <ShoppingCart width={20} height={20} />
              </span>
              <span className="text-xl font-extrabold text-white">ShopHub</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Your one-stop shop for everything you need. Quality products, unbeatable
              prices, and fast delivery.
            </p>
          </div>

          {/* Link columns */}
          {footerColumns.map((col) => (
            <div key={col.heading}>
              <h3 className="text-sm font-semibold text-white">{col.heading}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-slate-400 transition-colors hover:text-white">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-500">
            <p>© 2026 ShopHub. All rights reserved.</p>
            <p className="mt-1">Country: United States | Language: English</p>
          </div>
          <div className="flex items-center gap-2">
            {paymentMethods.map((m) => (
              <span
                key={m}
                className="rounded-md bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}
