import { Mail } from "lucide-react";
import Container from "./Container";

/** Email capture band shown above the footer. */
export default function Newsletter() {
  return (
    <section className="bg-slate-50 py-12">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-12 text-center sm:px-12">
          <div className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 right-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

          <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white">
            <Mail width={26} height={26} />
          </span>
          <h2 className="relative mt-5 text-2xl font-bold text-white sm:text-3xl">
            Get The Latest Deals
          </h2>
          <p className="relative mx-auto mt-2 max-w-md text-sm text-blue-100">
            Subscribe to our newsletter for exclusive offers, new arrivals, and insider-only discounts.
          </p>

          <form className="relative mx-auto mt-7 flex max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              placeholder="Enter your email address"
              className="h-12 flex-1 rounded-xl border-0 bg-white px-4 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-white/60"
            />
            <button
              type="submit"
              className="h-12 shrink-0 rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Subscribe
            </button>
          </form>
        </div>
      </Container>
    </section>
  );
}
