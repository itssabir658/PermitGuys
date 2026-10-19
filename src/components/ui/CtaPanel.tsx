import type { Route } from "next";
import { paths } from "@/lib/routes";
import { ButtonLink } from "./ButtonLink";
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
    <section aria-labelledby={id} className="bg-glow-navy relative overflow-hidden text-paper">
      <div aria-hidden="true" className="bg-drafting-grid-dark absolute inset-0 [mask-image:radial-gradient(70%_80%_at_50%_50%,black,transparent)]" />
      <Container className="relative py-16 sm:py-20 lg:py-24">
        <div data-reveal="" className="glass-dark grid gap-12 rounded-[2rem] p-6 sm:p-10 lg:grid-cols-12 lg:gap-16 lg:p-14">
          <div className="lg:col-span-7">
            <Eyebrow onDark>Start a conversation</Eyebrow>
            <h2 id={id} className="mt-6 font-display text-display-lg text-balance">
              {title}
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-navy-100/85">{body}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink href={href} variant="copper">
                {primaryLabel}
              </ButtonLink>
              <ButtonLink href={paths.howItWorks} variant="ghost-light">
                How it works
              </ButtonLink>
            </div>
          </div>
          <div className="lg:col-span-5 lg:self-end">
            <p className="text-label text-copper-300">What happens next</p>
            <ol className="mt-4 space-y-2">
              {nextSteps.map((step, i) => (
                <li key={step} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-navy-100/90">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-copper-300 font-display text-sm font-medium text-navy-950 tabular-nums">{i + 1}</span>
                  <span className="pt-1">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Container>
    </section>
  );
}
