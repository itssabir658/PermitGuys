import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * Small mono label above headings, set like the annotation on a drawing
 * sheet. `code` adds a sheet number ("01") so a long page reads in order;
 * without one, the label carries the red dot. `as` sets it as a small
 * heading where it names a list (region names, "Related guides").
 */
export function Eyebrow({ children, className, onDark, code, as: Tag = "p" }: { children: ReactNode; className?: string; onDark?: boolean; code?: string; as?: "p" | "h2" | "h3" }) {
  return (
    <Tag className={cn("flex items-center gap-3 text-label", onDark ? "text-charcoal-300" : "text-ink-muted", className)}>
      {code ? (
        <span className={cn("tabular-nums", onDark ? "text-ivory" : "text-ink")}>{code}</span>
      ) : (
        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-brand-400" />
      )}
      {code ? <span aria-hidden="true" className={cn("h-px w-8", onDark ? "bg-ivory/30" : "bg-ink/25")} /> : null}
      <span>{children}</span>
    </Tag>
  );
}
