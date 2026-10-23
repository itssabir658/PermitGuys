import type { Route } from "next";
import { paths } from "@/lib/routes";
import { ButtonLink } from "./ButtonLink";
import { Container } from "./Container";

const nextSteps = [
  "You tell us what you are planning and where.",
  "We review the details and reply to explain how we can help.",
  "You decide whether to go ahead.",
];

/** Closing invitation shared by inner pages: one large line, one action, and what happens next. */
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
    <section aria-labelledby={id} data-tone="dark" className="bg-charcoal-950 text-ivory">
      <Container className="py-24 sm:py-32 lg:py-40">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-8">
          <div data-reveal-type="rows" className="lg:col-span-7">
            <p className="text-label text-charcoal-300">Start a conversation</p>
            <h2 id={id} data-reveal-lines="" className="mt-10 font-display text-display-xl font-light text-balance">
              {title}
            </h2>
            <p className="mt-8 max-w-xl text-lede text-charcoal-300">{body}</p>
            <div data-row="" className="mt-12 flex flex-wrap gap-4">
              <ButtonLink href={href} variant="light">
                {primaryLabel}
              </ButtonLink>
              <ButtonLink href={paths.howItWorks} variant="ghost-light">
                How it works
              </ButtonLink>
            </div>
          </div>
          <div data-reveal-type="rows" className="lg:col-span-4 lg:col-start-9 lg:self-end">
            <p className="text-label text-charcoal-300">What happens next</p>
            <ol className="mt-6 border-t border-ivory/15">
              {nextSteps.map((step, i) => (
                <li key={step} className="flex gap-6 border-b border-ivory/15 py-5 text-ivory/90">
                  <span className="text-label pt-1 text-charcoal-300 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Container>
    </section>
  );
}
