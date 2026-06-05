import { Sparkles } from "lucide-react";

/** Thin announcement strip above the navbar. */
export default function PromoBar() {
  return (
    <div className="flex h-10 w-full items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-center text-[13px] font-medium text-white">
      <Sparkles width={15} height={15} className="shrink-0" />
      <span>Summer Savings Up To 70% Off</span>
    </div>
  );
}
