import type { ReactNode } from "react";
import { Container } from "./Container";
import { cn } from "./cn";

type Tone = "paper" | "light" | "dark";

const tones: Record<Tone, string> = {
  paper: "bg-ivory text-ink",
  light: "bg-stone-100 text-ink",
  dark: "bg-charcoal-950 text-ivory",
};

/**
 * Vertical rhythm and background tone for page sections. `first` is for the
 * section right under the page header (or its picture band), so the header to
 * body handover matches the article pages. Content comes in row by row as it
 * is reached (data-reveal-type="rows"). A dark section turns the header ivory
 * (data-tone). Draw the `bordered` rule only between sections of one tone:
 * where the ground changes, the change already marks the break.
 */
export function Section({
  children,
  tone = "paper",
  id,
  labelledBy,
  className,
  bordered,
  narrow,
  first,
}: {
  children: ReactNode;
  tone?: Tone;
  id?: string;
  labelledBy?: string;
  className?: string;
  bordered?: boolean;
  narrow?: boolean;
  first?: boolean;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      data-tone={tone === "dark" ? "dark" : undefined}
      className={cn(tones[tone], first ? "pt-10 pb-16 sm:pb-20 lg:pt-14 lg:pb-28" : "py-16 sm:py-20 lg:py-28", className)}
    >
      <Container narrow={narrow}>
        {bordered ? <div aria-hidden="true" data-reveal="" data-reveal-type="rule" className={cn("mb-12 h-px lg:mb-16", tone === "dark" ? "bg-ivory/15" : "bg-line")} /> : null}
        <div data-reveal-type="rows">{children}</div>
      </Container>
    </section>
  );
}
