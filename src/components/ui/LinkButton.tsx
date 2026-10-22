import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { ArrowRight } from "./Icons";
import { cn } from "./cn";

/*
 * The reference's link button (docs/MOTION.md, "Link buttons"): a label
 * plate and a square icon cell. On hover or keyboard focus, four things
 * happen at once (globals.css, "Link button"):
 *   - both plates round their corners (0.35s, cubic out);
 *   - a wipe fills the label plate from the left (0.35s);
 *   - the icon cell turns a quarter on a cube to its second face (0.4s);
 *   - a highlight sweeps across the label (0.8s).
 */
export function LinkButton({ href, children, tone = "dark", className }: { href: Route; children: ReactNode; tone?: "dark" | "light"; className?: string }) {
  return (
    <Link href={href} className={cn("link-button", tone === "light" && "link-button--light", className)}>
      <span className="link-button__plate">
        <span aria-hidden="true" className="link-button__wipe" />
        <span className="link-button__label" data-text={typeof children === "string" ? children : undefined}>
          {children}
        </span>
      </span>
      <span aria-hidden="true" className="link-button__icon">
        <span className="link-button__cube">
          <span className="link-button__face">
            <ArrowRight className="size-4" />
          </span>
          <span className="link-button__face link-button__face--side">
            <ArrowRight className="size-4" />
          </span>
        </span>
      </span>
    </Link>
  );
}
