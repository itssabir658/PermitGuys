import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { ArrowRight } from "./Icons";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "copper" | "ghost-light";

const variants: Record<Variant, string> = {
  primary: "bg-navy-900 text-paper shadow-[0_10px_30px_-12px_rgb(20_38_61/0.6)] hover:bg-navy-800",
  secondary: "glass text-navy-900 hover:bg-white/80",
  copper: "bg-copper-500 text-navy-950 shadow-[0_12px_32px_-12px_rgb(199_122_69/0.75)] hover:bg-copper-300",
  "ghost-light": "glass-dark text-paper hover:bg-white/10",
};

const arrowCell: Record<Variant, string> = {
  primary: "bg-white/10",
  secondary: "bg-navy-900 text-paper",
  copper: "bg-navy-950/10",
  "ghost-light": "bg-white/10",
};

/** Rounded call to action with the arrow in its own chip, which nudges forward on hover. */
export function ButtonLink({
  href,
  children,
  variant = "primary",
  className,
  arrow = true,
}: {
  href: Route;
  children: ReactNode;
  variant?: Variant;
  className?: string;
  arrow?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex min-h-12 items-center justify-between gap-4 rounded-2xl py-1.5 pr-1.5 pl-6 text-[0.95rem] font-semibold transition-all duration-300 ease-out-soft hover:-translate-y-0.5",
        !arrow && "pr-6",
        variants[variant],
        className,
      )}
    >
      {children}
      {arrow ? (
        <span aria-hidden="true" className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", arrowCell[variant])}>
          <ArrowRight className="size-4 transition-transform duration-300 ease-out-soft group-hover:translate-x-0.5" />
        </span>
      ) : null}
    </Link>
  );
}

/** Understated text link with an arrow, for "read more" style actions. */
export function ArrowLink({ href, children, className, onDark }: { href: Route; children: ReactNode; className?: string; onDark?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 border-b pb-1 text-[0.95rem] font-semibold transition-colors",
        onDark ? "border-copper-300/60 text-paper hover:border-copper-300" : "border-copper-500/60 text-navy-900 hover:border-copper-600",
        className,
      )}
    >
      {children}
      <ArrowRight className="size-4 transition-transform duration-300 ease-out-soft group-hover:translate-x-1" />
    </Link>
  );
}
