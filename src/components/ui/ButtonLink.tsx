import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { ArrowRight } from "./Icons";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "copper" | "ghost-light";

const variants: Record<Variant, string> = {
  primary: "bg-navy-900 text-paper hover:bg-navy-800",
  secondary: "border border-navy-900/30 text-navy-900 hover:border-navy-900 hover:bg-navy-900/[0.03]",
  copper: "bg-copper-500 text-navy-950 hover:bg-copper-300",
  "ghost-light": "border border-paper/35 text-paper hover:border-paper hover:bg-paper/5",
};

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
        "group inline-flex min-h-12 items-center justify-center gap-3 rounded-[2px] px-6 py-3 text-[0.95rem] font-medium tracking-[0.01em] transition-colors duration-200",
        variants[variant],
        className,
      )}
    >
      {children}
      {arrow ? <ArrowRight className="size-4 transition-transform duration-300 ease-out-soft group-hover:translate-x-1" /> : null}
    </Link>
  );
}

/** Understated text link with an arrow, for "read more" style actions. */
export function ArrowLink({ href, children, className, onDark }: { href: Route; children: ReactNode; className?: string; onDark?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 border-b pb-1 text-[0.95rem] font-medium transition-colors",
        onDark ? "border-copper-300/60 text-paper hover:border-copper-300" : "border-copper-500/60 text-navy-900 hover:border-copper-600",
        className,
      )}
    >
      {children}
      <ArrowRight className="size-4 transition-transform duration-300 ease-out-soft group-hover:translate-x-1" />
    </Link>
  );
}
