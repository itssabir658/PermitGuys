import type { CSSProperties } from "react";
import { ArrowLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Plate } from "@/components/ui/Plate";
import { plates } from "@/content/imagery";
import { paths } from "@/lib/routes";

const statement = ["A building permit is", "a set of drawings,", "a set of rules and", "a conversation", "with the city."];

const prepares = ["Permit drawings", "Application documents", "Responses to review comments"];

/** Editorial introduction: an oversized statement set against a tall detail plate. */
export function Intro() {
  return (
    <section aria-labelledby="intro-heading" className="overflow-hidden bg-ivory pb-24 sm:pb-32 lg:pb-44">
      <Container>
        <div aria-hidden="true" data-reveal="" data-reveal-type="rule" className="h-px bg-line" />
        <div className="grid gap-16 pt-14 lg:grid-cols-12 lg:gap-8 lg:pt-20">
          <div className="lg:col-span-7">
            <Eyebrow code="01">The practice</Eyebrow>
            <h2 id="intro-heading" data-reveal="" data-reveal-type="lines" className="mt-10 font-display text-display-xl font-light text-ink">
              {statement.map((line, i) => (
                <span key={line} className="line" style={{ "--i": i } as CSSProperties}>
                  <span>{line}</span>
                </span>
              ))}
            </h2>
            <div className="mt-14 grid gap-12 sm:grid-cols-2 lg:mt-20 lg:max-w-2xl">
              <p data-reveal="" className="text-lede text-ink-muted">
                We prepare the first, read the second for your property, and support you through the third, so your application reaches the municipality clear and complete.
              </p>
              <div data-reveal="" style={{ "--d": 120 } as CSSProperties}>
                <p className="text-label text-ink-muted">What we prepare</p>
                <ul className="mt-4 divide-y divide-line border-y border-line">
                  {prepares.map((item, i) => (
                    <li key={item} className="flex items-baseline gap-4 py-3 text-[0.9375rem]">
                      <span className="text-label text-ink-muted tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <ArrowLink href={paths.about} className="mt-8">
                  About PermitGuys
                </ArrowLink>
              </div>
            </div>
          </div>
          <div className="lg:col-span-4 lg:col-start-9 lg:pt-40">
            <Plate plate={plates.detail} fig="02" drift="slow" sizes="(min-width: 1024px) 30vw, 100vw" />
          </div>
        </div>
      </Container>
    </section>
  );
}
