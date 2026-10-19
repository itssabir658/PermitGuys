import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * Sheet label: the small mono annotation above section headings, styled like
 * the sheet number and title on a drawing set. `code` adds a sheet number
 * ("02") so a long page reads as an ordered set rather than a stack of blocks.
 */
export function Eyebrow({ children, className, onDark, code }: { children: ReactNode; className?: string; onDark?: boolean; code?: string }) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 font-mono text-[0.72rem] font-medium uppercase tracking-[0.14em]",
        onDark ? "text-copper-300" : "text-copper-700",
        className,
      )}
    >
      {code ? (
        <>
          <span>{code}</span>
          <span aria-hidden="true" className={cn("h-px w-6", onDark ? "bg-paper/30" : "bg-navy-900/25")} />
        </>
      ) : (
        <span aria-hidden="true" className="size-1.5 bg-copper-500" />
      )}
      <span className={onDark ? "text-navy-100/80" : "text-ink-muted"}>{children}</span>
    </p>
  );
}
