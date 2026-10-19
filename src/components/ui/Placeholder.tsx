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
        onDark ? "border-copper-300/70 bg-copper-300/10 text-copper-300" : "border-copper-500 bg-copper-500/[0.07] text-copper-700",
        block ? "block rounded-[2px] p-4 leading-relaxed" : "inline-block rounded-[2px] px-1.5 py-0.5",
        className,
      )}
    >
      <span className="font-semibold">PLACEHOLDER:</span> {children}
    </Tag>
  );
}
