import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { Drawing } from "@/components/ui/Drawing";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { paths } from "@/lib/routes";

/*
 * Editorial hero. The right-hand panel is composed like a drawing sheet with
 * a title block. It shows an illustration until a licensed residential
 * photograph is supplied (swap in <Figure> with a photo; see docs/IMAGES.md).
 * No trust badges are shown because none have been verified yet.
 */
export function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="relative overflow-hidden border-b border-line bg-paper">
      <Container className="grid gap-12 pt-14 pb-16 sm:pt-20 lg:grid-cols-12 lg:gap-10 lg:pt-24 lg:pb-24">
        <div className="motion-rise flex flex-col justify-center lg:col-span-6 xl:col-span-6">
          <Eyebrow>Permit drawings · Greater Toronto Area</Eyebrow>
          <h1 id="hero-heading" className="mt-6 font-display text-display-xl text-balance text-navy-900">
            Your Project. The Right Drawings. <span className="text-copper-600 italic">A Clearer Path</span> to Approval.
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-pretty text-ink-muted sm:text-xl">
            PermitGuys prepares permit drawings and guides homeowners and property owners through the building permit process, so you know what your project needs before you apply.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={paths.contact}>Discuss Your Project</ButtonLink>
            <ButtonLink href={paths.services} variant="secondary">
              Explore Our Services
            </ButtonLink>
          </div>
        </div>

        <div className="motion-rise-delay lg:col-span-6 xl:col-span-6">
          <figure className="relative">
            <div className="relative aspect-[5/4] overflow-hidden bg-navy-900 text-paper/85 sm:aspect-[4/3] lg:aspect-[5/5.2]">
              <div aria-hidden="true" className="bg-drafting-grid-dark absolute inset-0" />
              <div role="img" aria-label="Line drawing of a two-storey house with a proposed rear addition outlined in copper." className="absolute inset-0 flex items-center justify-center p-4 pb-20 sm:p-10 sm:pb-28">
                <Drawing variant="addition" className="h-full w-full" />
              </div>
              <div className="absolute inset-x-0 bottom-0 grid grid-cols-3 border-t border-paper/15 text-[0.7rem] uppercase tracking-[0.16em] text-navy-100/70">
                <div className="border-r border-paper/15 px-4 py-4 sm:px-5">
                  <span className="block text-copper-300">Sheet</span>
                  <span className="mt-1 block text-paper">Elevation</span>
                </div>
                <div className="border-r border-paper/15 px-4 py-4 sm:px-5">
                  <span className="block text-copper-300">Scope</span>
                  <span className="mt-1 block text-paper">Rear addition</span>
                </div>
                <div className="px-4 py-4 sm:px-5">
                  <span className="block text-copper-300">Status</span>
                  <span className="mt-1 block text-paper">Illustrative</span>
                </div>
              </div>
            </div>
            <figcaption className="mt-3 text-xs tracking-wide text-ink-muted" data-placeholder="">
              Illustration. A licensed residential photograph will replace or accompany this drawing.
            </figcaption>
          </figure>
        </div>
      </Container>
    </section>
  );
}
