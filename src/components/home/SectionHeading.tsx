import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

/** Section title row with optional leading icon, subtitle, and trailing action. */
export default function SectionHeading({
  title,
  subtitle,
  action = "View All",
  icon,
}: {
  title: string;
  subtitle?: string;
  action?: string | null;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
      </div>
      {action && (
        <button className="flex shrink-0 items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
          {action}
          <ArrowRight width={15} height={15} />
        </button>
      )}
    </div>
  );
}
