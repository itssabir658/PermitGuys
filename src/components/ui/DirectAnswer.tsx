import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * The short, quotable answer that opens service and guide pages. Kept in
 * plain HTML near the top so search and answer engines can lift it cleanly.
 */
export function DirectAnswer({ children, label = "Short answer", onDark }: { children: ReactNode; label?: string; onDark?: boolean }) {
  return (
    <div className={cn("border-l-2 border-copper-500 px-6 py-5 sm:px-8 sm:py-6", onDark ? "bg-navy-950/50" : "bg-paper-100")}>
      <p className={cn("font-mono text-[0.72rem] font-medium uppercase tracking-[0.14em]", onDark ? "text-copper-300" : "text-copper-700")}>{label}</p>
      <p className={cn("mt-3 text-lg leading-relaxed text-pretty", onDark ? "text-paper" : "text-navy-900")}>{children}</p>
    </div>
  );
}
