import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { ArrowRight } from "./Icons";
import { cn } from "./cn";

/** Understated text link with a drawn underline and an arrow, for "read more" style actions. */
export function ArrowLink({ href, children, className, onDark }: { href: Route; children: ReactNode; className?: string; onDark?: boolean }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-3 text-[0.9375rem] font-medium", onDark ? "text-ivory" : "text-ink", className)}>
      <span className="link-rule pb-1">{children}</span>
      <ArrowRight className="size-4 transition-transform duration-500 ease-out-expo group-hover:translate-x-1" />
    </Link>
  );
}
