"use client";

import { useEffect, useState } from "react";

const pad = (n: number) => n.toString().padStart(2, "0");

/** Live HH:MM:SS countdown. Starts from the given offset and ticks down. */
export default function Countdown({
  hours = 12,
  minutes = 33,
  seconds = 4,
}: {
  hours?: number;
  minutes?: number;
  seconds?: number;
}) {
  const [total, setTotal] = useState(hours * 3600 + minutes * 60 + seconds);

  useEffect(() => {
    const id = setInterval(() => {
      setTotal((t) => (t <= 0 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  const blocks = [
    { value: pad(h), label: "Hours" },
    { value: pad(m), label: "Mins" },
    { value: pad(s), label: "Secs" },
  ];

  return (
    <div className="flex items-center gap-1.5">
      {blocks.map((b, i) => (
        <div key={b.label} className="flex items-center gap-1.5">
          <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-slate-900 text-white">
            <span className="text-base font-bold leading-none tabular-nums">{b.value}</span>
            <span className="mt-0.5 text-[9px] text-white/60">{b.label}</span>
          </div>
          {i < blocks.length - 1 && (
            <span className="text-lg font-bold text-blue-600">:</span>
          )}
        </div>
      ))}
    </div>
  );
}
