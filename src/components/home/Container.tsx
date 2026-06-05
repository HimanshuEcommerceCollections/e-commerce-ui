import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Centered content column matching the design's 1288px inner width. */
export default function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[1288px] px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}
