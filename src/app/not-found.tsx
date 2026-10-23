import type { Metadata } from "next";
import { OntarioOutline } from "@/components/layout/OntarioOutline";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LinkButton } from "@/components/ui/LinkButton";
import { paths } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you were looking for could not be found.",
  // Next.js adds a noindex robots tag to 404 responses itself.
};

/*
 * The 404 enters like an inner page's header (globals.css, "Inner pages"):
 * the numeral, set like the homepage's CONTACT, rises out of its mask with
 * the title's lines, and on wide screens the outline of Ontario draws
 * beside them, as on the opening screen.
 */
export default function NotFound() {
  return (
    <section className="bg-ivory text-ink">
      <Container className="pt-28 pb-24 sm:pt-32 sm:pb-28 lg:pt-36 lg:pb-32">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-8">
          <div className="lg:col-span-8">
            <p aria-hidden="true" className="split-line font-wordmark text-[clamp(6rem,2rem+16vw,16rem)] leading-[0.85] tracking-[-0.01em] uppercase">
              <span className="not-found__numeral block">404</span>
            </p>
            <div className="split-line mt-10 lg:mt-14">
              <Eyebrow className="page-eyebrow">Page not found</Eyebrow>
            </div>
            <h1 data-reveal-lines="entrance" className="page-title mt-8 max-w-4xl font-display text-display-xl font-light text-balance">
              We could not find that page.
            </h1>
            <p className="motion-rise mt-8 max-w-xl text-lede text-pretty text-ink-muted">The link may be out of date, or the page may have moved. These are good places to continue.</p>
            <div className="motion-rise-delay mt-10 flex flex-wrap gap-3">
              <LinkButton href={paths.home}>Go to the homepage</LinkButton>
              <LinkButton href={paths.services} tone="light">
                Explore services
              </LinkButton>
              <LinkButton href={paths.guides} tone="light">
                Read permit guides
              </LinkButton>
            </div>
          </div>
          <div className="hidden lg:col-span-4 lg:block">
            <OntarioOutline className="not-found__map ml-auto h-auto w-full max-w-[22rem] overflow-visible text-ink/45" />
          </div>
        </div>
      </Container>
    </section>
  );
}
