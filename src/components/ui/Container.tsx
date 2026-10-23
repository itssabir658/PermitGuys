import type { ReactNode } from "react";
import { cn } from "./cn";

/** Page gutters and maximum width. Margins widen with the viewport, as in a printed folio. */
export function Container({ children, className, narrow }: { children: ReactNode; className?: string; narrow?: boolean }) {
  return (
    <div className={cn("mx-auto w-full px-5 sm:px-8 lg:px-12 xl:px-16", narrow ? "max-w-5xl" : "max-w-site", className)}>
      {children}
    </div>
  );
}
