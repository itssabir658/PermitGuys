import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { paths } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you were looking for could not be found.",
  // Next.js adds a noindex robots tag to 404 responses itself.
};

export default function NotFound() {
  return (
    <section className="bg-glow-navy relative overflow-hidden text-paper">
      <div aria-hidden="true" className="bg-drafting-grid-dark absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_95%)]" />
      <Container className="relative py-24 sm:py-32">
        <Eyebrow onDark>Page not found</Eyebrow>
        <h1 className="mt-6 max-w-3xl font-display text-display-lg">We could not find that page.</h1>
        <p className="mt-6 max-w-xl text-lg text-navy-100/85">The link may be out of date, or the page may have moved. These are good places to continue.</p>
        <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row">
          <ButtonLink href={paths.home} variant="copper">
            Go to the homepage
          </ButtonLink>
          <ButtonLink href={paths.services} variant="ghost-light">
            Explore services
          </ButtonLink>
          <ButtonLink href={paths.guides} variant="ghost-light">
            Read permit guides
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
