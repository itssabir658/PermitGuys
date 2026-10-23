import type { Route } from "next";
import { paths } from "@/lib/routes";
import { Container } from "./Container";
import { LinkButton } from "./LinkButton";

const nextSteps = [
  "You tell us what you are planning and where.",
  "We review the details and reply to explain how we can help.",
  "You decide whether to go ahead.",
];

/**
 * Closing invitation shared by inner pages: one large line, one action, and
 * what happens next. It closes on paper, as the homepage closes on its
 * Contact sheet, so the footer is the page's one dark band (and the
 * footer's own call to action stands down while this is on the page:
 * data-cta-panel, globals.css).
 */
export function CtaPanel({
  title = "Tell us about your project.",
  body = "Share what you are planning and where. We will review the details and explain how we can help with drawings and the permit process.",
  primaryLabel = "Discuss your project",
  href = paths.contact,
  secondary = { href: paths.howItWorks, label: "How it works" },
  id = "cta-heading",
}: {
  /** Inquiry link; service pages pass a link that preselects the project type. */
  href?: Route;
  title?: string;
  body?: string;
  primaryLabel?: string;
  /** The quieter second action; a page that is itself the default's target passes another, or null for none. */
  secondary?: { href: Route; label: string } | null;
  id?: string;
}) {
  return (
    <section aria-labelledby={id} data-cta-panel="" className="bg-stone-100 text-ink">
      <Container className="py-20 sm:py-28 lg:py-32">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-8">
          <div data-reveal-type="rows" className="lg:col-span-7">
            <p className="text-label text-ink-muted">Start a conversation</p>
            <h2 id={id} data-reveal-lines="" className="mt-10 font-display text-display-xl font-light text-balance text-ink">
              {title}
            </h2>
            <p className="mt-8 max-w-xl text-lede text-ink-muted">{body}</p>
            <div data-row="" className="mt-12 flex flex-wrap gap-4">
              <LinkButton href={href}>{primaryLabel}</LinkButton>
              {secondary ? (
                <LinkButton href={secondary.href} tone="outline">
                  {secondary.label}
                </LinkButton>
              ) : null}
            </div>
          </div>
          <div data-reveal-type="rows" className="lg:col-span-4 lg:col-start-9 lg:self-end">
            <p className="text-label text-ink-muted">What happens next</p>
            <ol className="mt-6 border-t border-line">
              {nextSteps.map((step, i) => (
                <li key={step} className="flex gap-6 border-b border-line py-5 text-ink">
                  <span className="text-label pt-1 text-ink-muted tabular-nums">{String(i + 1).padStart(2, "0")}</span>
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
