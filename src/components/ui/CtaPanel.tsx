import { paths } from "@/lib/routes";
import { ButtonLink } from "./ButtonLink";
import { Container } from "./Container";
import { Eyebrow } from "./Eyebrow";

/** Closing inquiry band shared by the homepage and every template. */
export function CtaPanel({
  title = "Tell us about your project.",
  body = "Share what you are planning and where. We will review the details and explain how we can help with drawings and the permit process.",
  primaryLabel = "Discuss Your Project",
  id = "cta-heading",
}: {
  title?: string;
  body?: string;
  primaryLabel?: string;
  id?: string;
}) {
  return (
    <section aria-labelledby={id} className="relative overflow-hidden bg-navy-900 text-paper">
      <div aria-hidden="true" className="bg-drafting-grid-dark absolute inset-0 opacity-70" />
      <Container className="relative py-20 sm:py-28">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <Eyebrow onDark>Start a conversation</Eyebrow>
            <h2 id={id} className="mt-5 font-display text-display-lg text-balance">
              {title}
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-navy-100/85">{body}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:col-span-4 lg:flex-col lg:items-stretch">
            <ButtonLink href={paths.contact} variant="copper">
              {primaryLabel}
            </ButtonLink>
            <ButtonLink href={paths.howItWorks} variant="ghost-light">
              How it works
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
