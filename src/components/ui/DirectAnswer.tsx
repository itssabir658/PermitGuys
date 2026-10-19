import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * The short, quotable answer that opens service and guide pages. Kept in
 * plain HTML near the top so search and answer engines can lift it cleanly.
 */
export function DirectAnswer({ children, label = "Short answer", onDark }: { children: ReactNode; label?: string; onDark?: boolean }) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl px-6 py-5 sm:px-8 sm:py-6", onDark ? "glass-dark" : "glass")}>
      <span aria-hidden="true" className="absolute inset-y-5 left-0 w-1 rounded-r-full bg-brand-500" />
      <p className={cn("text-label", onDark ? "text-brand-300" : "text-brand-700")}>{label}</p>
      <p className={cn("mt-3 text-lg leading-relaxed text-pretty", onDark ? "text-paper" : "text-charcoal-900")}>{children}</p>
    </div>
  );
}
