import Image from "next/image";
import { ArrowLink, ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ProjectPicker } from "@/components/ui/ProjectPicker";
import { site } from "@/content/site";
import { paths } from "@/lib/routes";
import { HeroDrawing } from "./HeroDrawing";

/*
 * Homepage hero, composed as a drawing sheet: a full-width headline, a large
 * elevation (or a supplied photograph) and a title block along the bottom
 * that doubles as a "what are you planning?" shortcut into the inquiry form.
 * No trust badges are shown because none have been verified yet.
 */
export function Hero() {
  const photo = site.heroPhoto;
  return (
    <section aria-labelledby="hero-heading" className="relative overflow-hidden bg-navy-900 text-paper">
      <div aria-hidden="true" className="bg-drafting-grid-dark absolute inset-0" />
      <Container className="relative">
        <div className="motion-rise pt-12 sm:pt-16 lg:pt-20">
          <Eyebrow onDark code="GTA">
            Building permit drawings and permit support
          </Eyebrow>
          <h1 id="hero-heading" className="mt-7 max-w-[15ch] font-display text-display-2xl text-balance lg:max-w-[22ch]">
            Permit drawings for GTA homes <span className="text-copper-300 italic">and</span> businesses.
          </h1>
        </div>

        <div className="mt-10 grid gap-12 lg:mt-14 lg:grid-cols-12 lg:gap-10">
          <div className="motion-rise-delay lg:col-span-4 lg:pb-16">
            <p className="max-w-md text-lg leading-relaxed text-pretty text-navy-100/85">
              PermitGuys prepares the drawings and documentation your building permit application needs, then supports you through municipal review. Basement apartments, decks, renovations, additions, custom homes and commercial spaces.
            </p>
            <div className="mt-9 flex flex-col items-start gap-6">
              <ButtonLink href={paths.contact} variant="copper">
                Discuss your project
              </ButtonLink>
              <ArrowLink href={paths.howItWorks} onDark>
                How the permit process works
              </ArrowLink>
            </div>
          </div>

          <figure className="motion-rise-delay relative -mx-5 sm:mx-0 lg:col-span-8 lg:-mr-6 lg:self-end">
            {photo ? (
              <div className="relative aspect-[3/2] overflow-hidden">
                <Image src={photo.src} alt={photo.alt} fill priority sizes="(min-width: 1024px) 66vw, 100vw" className="object-cover" />
              </div>
            ) : (
              <div role="img" aria-label="Front elevation drawing of a bungalow with a proposed second-storey addition shown in copper." className="overflow-hidden text-paper/85">
                {/* On phones the drawing is enlarged and cropped so the house, not the margins, fills the width. */}
                <HeroDrawing className="-ml-[18%] h-auto w-[150%] max-w-none sm:ml-0 sm:w-full" />
              </div>
            )}
            <figcaption className="mt-2 px-5 text-right font-mono text-[0.68rem] tracking-[0.08em] text-navy-100/60 sm:px-0" data-placeholder={photo ? undefined : ""}>
              {photo ? <>Photo: {photo.credit}</> : <>Illustration, not a client project. Project photography to be supplied.</>}
            </figcaption>
          </figure>
        </div>
      </Container>

      {/* Title block */}
      <div className="relative border-t border-paper/15 bg-navy-950/40">
        <Container className="grid lg:grid-cols-12">
          <ProjectPicker onDark id="hero-picker" className="py-8 lg:col-span-8 lg:py-10 lg:pr-10" />
          <dl className="grid grid-cols-2 border-t border-paper/15 py-6 font-mono text-[0.7rem] uppercase tracking-[0.12em] lg:col-span-4 lg:border-t-0 lg:border-l lg:py-10 lg:pl-10">
            {[
              ["Region", "Greater Toronto Area"],
              ["Clients", "Homeowners, landlords, businesses"],
              ["We prepare", "Permit drawings and documents"],
              ["The city", "Reviews and issues permits"],
            ].map(([term, detail]) => (
              <div key={term} className="py-3 pr-4">
                <dt className="text-copper-300">{term}</dt>
                <dd className="mt-1.5 leading-relaxed text-navy-100/85 normal-case tracking-[0.02em] font-sans text-sm">{detail}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </div>
    </section>
  );
}
