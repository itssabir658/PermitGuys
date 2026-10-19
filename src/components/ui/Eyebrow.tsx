import type { ReactNode } from "react";
import { cn } from "./cn";

/** Small uppercase label with a copper rule, used above section headings. */
export function Eyebrow({ children, className, onDark }: { children: ReactNode; className?: string; onDark?: boolean }) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em]",
        onDark ? "text-copper-300" : "text-copper-700",
        className,
      )}
    >
      <span aria-hidden="true" className="h-px w-8 bg-copper-500" />
      {children}
    </p>
  );
}
