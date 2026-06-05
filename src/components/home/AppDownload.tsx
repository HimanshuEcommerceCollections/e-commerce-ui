import { Check, Apple, Play, Smartphone } from "lucide-react";
import Container from "./Container";
import { appFeatures } from "./data";

/** App promotion with feature highlights and store badges. */
export default function AppDownload() {
  return (
    <section className="bg-white py-12">
      <Container>
        <div className="grid items-center gap-10 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-900 p-8 lg:grid-cols-2 lg:p-14">
          {/* Left: copy */}
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Download Our App
            </h2>
            <p className="mt-3 text-base text-slate-300">
              Shop on the go with exclusive app-only deals
            </p>

            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {appFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-200">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-300">
                    <Check width={13} height={13} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <button className="flex items-center gap-3 rounded-xl bg-white px-5 py-2.5 text-left text-slate-900 transition-transform hover:scale-105">
                <Apple width={26} height={26} />
                <span className="flex flex-col leading-tight">
                  <span className="text-[10px] uppercase tracking-wide text-slate-500">
                    Download on the
                  </span>
                  <span className="text-sm font-bold">App Store</span>
                </span>
              </button>
              <button className="flex items-center gap-3 rounded-xl bg-white px-5 py-2.5 text-left text-slate-900 transition-transform hover:scale-105">
                <Play width={24} height={24} className="fill-slate-900" />
                <span className="flex flex-col leading-tight">
                  <span className="text-[10px] uppercase tracking-wide text-slate-500">
                    Get it on
                  </span>
                  <span className="text-sm font-bold">Google Play</span>
                </span>
              </button>
            </div>
          </div>

          {/* Right: phone mockup */}
          <div className="flex justify-center">
            <div className="relative h-72 w-44 rounded-[2rem] border-4 border-white/20 bg-gradient-to-br from-blue-600 to-indigo-700 shadow-2xl">
              <div className="absolute left-1/2 top-3 h-1.5 w-16 -translate-x-1/2 rounded-full bg-white/30" />
              <div className="flex h-full items-center justify-center">
                <Smartphone className="h-16 w-16 text-white/50" strokeWidth={1.5} />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
