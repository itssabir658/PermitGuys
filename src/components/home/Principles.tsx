import type { CSSProperties } from "react";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";

const principles = [
  {
    title: "We start with what your property allows.",
    body: "Before drawing anything, we look at what you want to build against the zoning and Building Code considerations we can identify for your lot.",
  },
  {
    title: "We tell you early when you need others.",
    body: "Some projects also need an engineer, a survey or a planning approval. When yours does, we flag it at the start.",
  },
  {
    title: "Every step has a named owner.",
    body: "You, PermitGuys, other consultants or the municipality: who carries each step is written down, so nothing is assumed.",
  },
  {
    title: "Requirements as the municipality sets them.",
    body: "We describe what your municipality asks for, not rules of thumb, and we never promise an approval or a date. That decision is the city's.",
  },
];

const statement = ["Straight answers.", "Complete drawings.", "No promises we", "cannot keep."];

/** The dark moment of the page: the practice's principles, set as typography alone. */
export function Principles() {
  return (
    <section aria-labelledby="principles-heading" className="bg-charcoal-950 py-24 text-ivory sm:py-32 lg:py-44">
      <Container>
        <Eyebrow code="05" onDark>
          Why PermitGuys
        </Eyebrow>
        <h2 id="principles-heading" data-reveal="" data-reveal-type="lines" className="mt-12 font-display text-display-2xl font-light">
          {statement.map((line, i) => (
            <span key={line} className="line" style={{ "--i": i } as CSSProperties}>
              <span className={i >= 2 ? "text-charcoal-300" : undefined}>{line}</span>
            </span>
          ))}
        </h2>

        <ol className="mt-20 grid gap-x-8 gap-y-14 border-t border-ivory/15 pt-14 sm:grid-cols-2 lg:mt-32 lg:grid-cols-4 lg:pt-16">
          {principles.map((p, i) => (
            <li key={p.title} data-reveal="" style={{ "--d": i * 110 } as CSSProperties}>
              <span className="text-label text-charcoal-300 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-8 font-display text-display-sm text-ivory">{p.title}</h3>
              <p className="mt-4 leading-relaxed text-charcoal-300">{p.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
