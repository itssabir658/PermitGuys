import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * The short, quotable answer that opens service and guide pages. Kept in
 * plain HTML near the top so search and answer engines can lift it cleanly.
 */
export function DirectAnswer({ children, label = "Short answer", onDark }: { children: ReactNode; label?: string; onDark?: boolean }) {
  return (
    <div className={cn("border-l pl-6 sm:pl-8", onDark ? "border-ivory/30" : "border-ink/25")}>
      <p className={cn("flex items-center gap-3 text-label", onDark ? "text-charcoal-300" : "text-ink-muted")}>
        <span aria-hidden="true" className="size-1.5 rounded-full bg-brand-400" />
        {label}
      </p>
      <p className={cn("mt-4 text-lede text-pretty", onDark ? "text-ivory" : "text-ink")}>{children}</p>
    </div>
  );
}
