import Image from "next/image";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ProjectPicker } from "@/components/ui/ProjectPicker";
import { RatingBadge } from "@/components/ui/Reviews";
import { site } from "@/content/site";
import type { ReviewSummary } from "@/lib/reviews";
import { paths } from "@/lib/routes";
import { HeroVisual } from "./HeroVisual";

/*
 * Homepage hero: a full-width headline, the interactive elevation (or a
 * supplied photograph) in a glass frame, the Google rating, and a "what are
 * you planning?" row of tiles that opens the inquiry form pre-filled.
 */
export function Hero({ reviews }: { reviews: ReviewSummary | null }) {
  const photo = site.heroPhoto;
  return (
    <section aria-labelledby="hero-heading" className="bg-glow-navy relative overflow-hidden text-paper">
      <div aria-hidden="true" className="bg-drafting-grid-dark absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_90%)]" />
      <Container className="relative pt-10 pb-14 sm:pt-14 lg:pt-16 lg:pb-20">
        <div className="motion-rise">
          <Eyebrow onDark code="GTA">
            Building permit drawings and permit support
          </Eyebrow>
          <h1 id="hero-heading" className="mt-7 max-w-[15ch] font-display text-display-2xl text-balance lg:max-w-[22ch]">
            Permit drawings for GTA homes <span className="text-copper-300">and</span> businesses.
          </h1>
        </div>

        <div className="mt-10 grid gap-12 lg:mt-14 lg:grid-cols-12 lg:gap-10">
          <div className="motion-rise-delay flex flex-col lg:col-span-5 xl:pr-8">
            <p className="max-w-md text-lg leading-relaxed text-pretty text-navy-100/85">
              PermitGuys prepares the drawings and documentation your building permit application needs, then supports you through municipal review. Basement apartments, decks, renovations, additions, custom homes and commercial spaces.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href={paths.contact} variant="copper">
                Discuss your project
              </ButtonLink>
              <ButtonLink href={paths.howItWorks} variant="ghost-light">
                How it works
              </ButtonLink>
            </div>
            {reviews ? <RatingBadge summary={reviews} className="mt-10 self-start lg:mt-auto" /> : null}
          </div>

          <figure className="motion-rise-delay lg:col-span-7">
            {photo ? (
              <div className="glass-dark rounded-[1.75rem] p-2 sm:p-3">
                <div className="relative aspect-[3/2] overflow-hidden rounded-[1.25rem]">
                  <Image src={photo.src} alt={photo.alt} fill priority sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover" />
                </div>
              </div>
            ) : (
              <HeroVisual />
            )}
            <figcaption className="mt-3 px-2 text-right text-xs text-navy-100/60" data-placeholder={photo ? undefined : ""}>
              {photo ? <>Photo: {photo.credit}</> : <>Illustration, not a client project. Project photography to be supplied.</>}
            </figcaption>
          </figure>
        </div>

        <ProjectPicker onDark id="hero-picker" className="motion-rise-delay mt-12 lg:mt-16" />
      </Container>
    </section>
  );
}
