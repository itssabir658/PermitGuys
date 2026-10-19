import type { ReactNode } from "react";
import { Eyebrow } from "./Eyebrow";
import { cn } from "./cn";

export function SectionHeading({
  id,
  eyebrow,
  title,
  intro,
  onDark,
  className,
  as: Tag = "h2",
}: {
  id?: string;
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  onDark?: boolean;
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className={cn("max-w-3xl", className)}>
      {eyebrow ? <Eyebrow onDark={onDark}>{eyebrow}</Eyebrow> : null}
      <Tag id={id} className={cn("mt-5 font-display text-display-lg text-balance", onDark ? "text-paper" : "text-navy-900")}>
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
