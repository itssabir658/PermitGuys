import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { ArrowRight } from "./Icons";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "brand" | "ghost-light";

const variants: Record<Variant, string> = {
  primary: "bg-charcoal-900 text-paper shadow-[0_10px_30px_-12px_rgb(28_28_28/0.55)] hover:bg-charcoal-800",
  secondary: "glass text-charcoal-900 hover:bg-white/80",
  brand: "bg-brand-500 text-white shadow-[0_12px_32px_-12px_rgb(202_58_49/0.6)] hover:bg-brand-600",
  "ghost-light": "glass-dark text-paper hover:bg-white/10",
};

const arrowCell: Record<Variant, string> = {
  primary: "bg-white/10",
  secondary: "bg-charcoal-900 text-paper",
  brand: "bg-white/15",
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
        onDark ? "border-brand-300/60 text-paper hover:border-brand-300" : "border-brand-500/60 text-charcoal-900 hover:border-brand-600",
        className,
      )}
    >
      {children}
      <ArrowRight className="size-4 transition-transform duration-300 ease-out-soft group-hover:translate-x-1" />
    </Link>
  );
}
