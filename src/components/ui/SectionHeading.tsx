import type { ReactNode } from "react";
import { Eyebrow } from "./Eyebrow";
import { cn } from "./cn";

export function SectionHeading({
  id,
  eyebrow,
  code,
  title,
  intro,
  onDark,
  className,
  as: Tag = "h2",
  size = "lg",
}: {
  /** md suits headings set in a narrow column. */
  size?: "lg" | "md";
  id?: string;
  eyebrow?: string;
  /** Sheet number shown with the eyebrow. */
  code?: string;
  title: ReactNode;
  intro?: ReactNode;
  onDark?: boolean;
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className={cn("max-w-3xl", className)}>
      {eyebrow ? <Eyebrow onDark={onDark} code={code}>{eyebrow}</Eyebrow> : null}
      <Tag id={id} className={cn("mt-6 font-display text-balance", size === "lg" ? "text-display-lg" : "text-display-md", onDark ? "text-paper" : "text-navy-900")}>
        {title}
      </Tag>
      {intro ? (
        <div className={cn("mt-6 max-w-2xl text-lg leading-relaxed text-pretty", onDark ? "text-navy-100/85" : "text-ink-muted")}>
          {intro}
        </div>
      ) : null}
    </div>
  );
}
