import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * Small label chip above section headings. `code` adds a step number
 * ("01") so a long page reads in order.
 */
export function Eyebrow({ children, className, onDark, code }: { children: ReactNode; className?: string; onDark?: boolean; code?: string }) {
  return (
    <p
      className={cn(
        "inline-flex w-fit items-center gap-2.5 rounded-full border py-1.5 pr-3.5 pl-2 text-label",
        onDark ? "border-white/15 bg-white/[0.06] text-navy-100" : "border-navy-900/10 bg-white/70 text-navy-800",
        className,
      )}
    >
      {code ? (
        <span className={cn("rounded-full px-2 py-0.5 tabular-nums", onDark ? "bg-copper-300 text-navy-950" : "bg-navy-900 text-paper")}>{code}</span>
      ) : (
        <span aria-hidden="true" className={cn("ml-1 size-1.5 rounded-full", onDark ? "bg-copper-300" : "bg-copper-500")} />
      )}
      {children}
    </p>
  );
}
