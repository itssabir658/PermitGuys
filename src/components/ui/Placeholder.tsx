import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * Visible marker for information the business has not supplied yet.
 * Deliberately conspicuous so it cannot be mistaken for real content.
 * Every instance carries data-placeholder for QA searches.
 */
export function Placeholder({
  children,
  className,
  block,
  onDark,
}: {
  children: ReactNode;
  className?: string;
  block?: boolean;
  onDark?: boolean;
}) {
  const Tag = block ? "div" : "span";
  return (
    <Tag
      data-placeholder=""
      className={cn(
        "border border-dashed font-mono text-[0.8em] tracking-tight",
        onDark ? "border-brand-300/60 text-brand-300" : "border-brand-500/70 text-brand-700",
        block ? "block rounded-[2px] p-4 leading-relaxed" : "inline-block rounded-[2px] px-1.5 py-0.5",
        className,
      )}
    >
      <span className="font-semibold">PLACEHOLDER:</span> {children}
    </Tag>
  );
}
