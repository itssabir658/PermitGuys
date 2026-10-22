import type { ReactNode } from "react";
import { Container } from "./Container";
import { cn } from "./cn";

type Tone = "paper" | "light" | "dark";

const tones: Record<Tone, string> = {
  paper: "bg-ivory text-ink",
  light: "bg-stone-100 text-ink",
  dark: "bg-charcoal-950 text-ivory",
};

/** Vertical rhythm and background tone for page sections. Content rises into view (data-reveal). */
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
    <section id={id} aria-labelledby={labelledBy} className={cn(tones[tone], "py-20 sm:py-28 lg:py-36", className)}>
      <Container narrow={narrow}>
        {bordered ? <div aria-hidden="true" data-reveal="" data-reveal-type="rule" className={cn("mb-16 h-px lg:mb-24", tone === "dark" ? "bg-ivory/15" : "bg-line")} /> : null}
        <div data-reveal="">{children}</div>
      </Container>
    </section>
  );
}
