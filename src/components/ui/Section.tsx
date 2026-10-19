import type { ReactNode } from "react";
import { Container } from "./Container";
import { cn } from "./cn";

type Tone = "paper" | "light" | "navy";

const tones: Record<Tone, string> = {
  paper: "bg-paper text-ink",
  light: "bg-paper-100 text-ink",
  navy: "bg-navy-900 text-paper",
};

/** Vertical rhythm and background tone for every page section. */
export function Section({
  children,
  tone = "paper",
  id,
  labelledBy,
  className,
  bordered,
  narrow,
}: {
  children: ReactNode;
  tone?: Tone;
  id?: string;
  labelledBy?: string;
  className?: string;
  bordered?: boolean;
  narrow?: boolean;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(tones[tone], "py-20 sm:py-24 lg:py-32", bordered && "border-t border-line", className)}
    >
      <Container narrow={narrow}>{children}</Container>
    </section>
  );
}
