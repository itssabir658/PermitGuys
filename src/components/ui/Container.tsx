import type { ReactNode } from "react";
import { cn } from "./cn";

export function Container({ children, className, narrow }: { children: ReactNode; className?: string; narrow?: boolean }) {
  return (
    <div className={cn("mx-auto w-full px-5 sm:px-8 lg:px-12", narrow ? "max-w-4xl" : "max-w-site", className)}>
      {children}
    </div>
  );
}
