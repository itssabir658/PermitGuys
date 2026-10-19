import type { Route } from "next";
import { paths } from "@/lib/routes";
import { ArrowLink, ButtonLink } from "./ButtonLink";
import { Container } from "./Container";
import { Eyebrow } from "./Eyebrow";

const nextSteps = [
  "You tell us what you are planning and where.",
  "We review the details and reply to explain how we can help.",
  "You decide whether to go ahead.",
];

/** Closing inquiry band shared by the homepage and every template. */
export function CtaPanel({
  title = "Tell us about your project.",
  body = "Share what you are planning and where. We will review the details and explain how we can help with drawings and the permit process.",
  primaryLabel = "Discuss your project",
  href = paths.contact,
  id = "cta-heading",
}: {
  /** Inquiry link; service pages pass a link that preselects the project type. */
  href?: Route;
  title?: string;
  body?: string;
  primaryLabel?: string;
  id?: string;
}) {
  return (
    <section aria-labelledby={id} className="relative overflow-hidden bg-navy-900 text-paper">
      <div aria-hidden="true" className="bg-drafting-grid-dark absolute inset-0" />
      <Container className="relative py-16 sm:py-20 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <Eyebrow onDark>Start a conversation</Eyebrow>
            <h2 id={id} className="mt-6 font-display text-display-lg text-balance">
              {title}
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-navy-100/85">{body}</p>
            <div className="mt-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-10">
              <ButtonLink href={href} variant="copper">
                {primaryLabel}
              </ButtonLink>
              <ArrowLink href={paths.howItWorks} onDark>
                How it works
              </ArrowLink>
            </div>
          </div>
          <div className="lg:col-span-5 lg:self-end">
            <p className="font-mono text-[0.72rem] font-medium uppercase tracking-[0.14em] text-copper-300">What happens next</p>
            <ol className="mt-4 border-t border-paper/15">
              {nextSteps.map((step, i) => (
                <li key={step} className="flex gap-5 border-b border-paper/15 py-4 text-navy-100/85">
                  <span className="font-mono text-sm text-copper-300">{String(i + 1).padStart(2, "0")}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Container>
    </section>
  );
}
