import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { ArrowRight } from "./Icons";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "brand" | "ghost-light" | "light";

/*
 * Calls to action. Pills with a round arrow cell that fills on hover; the
 * label never moves. "brand" is the primary action: graphite with the red
 * PermitGuys dot in its arrow cell. Use one per block.
 */
const variants: Record<Variant, string> = {
  primary: "bg-ink text-ivory hover:bg-charcoal-700",
  brand: "bg-ink text-ivory hover:bg-charcoal-700",
  secondary: "text-ink ring-1 ring-ink/20 ring-inset hover:ring-ink",
  "ghost-light": "text-ivory ring-1 ring-ivory/35 ring-inset hover:ring-ivory",
  light: "bg-ivory text-ink hover:bg-white",
};

const cell: Record<Variant, string> = {
  primary: "bg-ivory/10 group-hover:bg-ivory group-hover:text-ink",
  brand: "bg-brand-500 text-white group-hover:bg-brand-400",
  secondary: "bg-ink/[0.06] group-hover:bg-ink group-hover:text-ivory",
  "ghost-light": "bg-ivory/10 group-hover:bg-ivory group-hover:text-ink",
  light: "bg-ink text-ivory group-hover:bg-brand-500",
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
        "group inline-flex min-h-13 items-center justify-between gap-5 rounded-full py-1.5 pr-1.5 pl-7 text-[0.9375rem] font-medium tracking-[-0.005em] transition-colors duration-500 ease-out-expo",
        !arrow && "pr-7",
        variants[variant],
        className,
      )}
    >
      {children}
      {arrow ? (
        <span aria-hidden="true" className={cn("flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full transition-colors duration-500 ease-out-expo", cell[variant])}>
          <span className="relative block size-4">
            <ArrowRight className="absolute inset-0 size-4 transition-transform duration-500 ease-out-expo group-hover:translate-x-[160%]" />
            <ArrowRight className="absolute inset-0 size-4 -translate-x-[160%] transition-transform duration-500 ease-out-expo group-hover:translate-x-0" />
          </span>
        </span>
      ) : null}
    </Link>
  );
}

/** Understated text link with a drawn underline and an arrow, for "read more" style actions. */
export function ArrowLink({ href, children, className, onDark }: { href: Route; children: ReactNode; className?: string; onDark?: boolean }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-3 text-[0.9375rem] font-medium", onDark ? "text-ivory" : "text-ink", className)}>
      <span className="link-rule pb-1">{children}</span>
      <ArrowRight className="size-4 transition-transform duration-500 ease-out-expo group-hover:translate-x-1" />
    </Link>
  );
}
