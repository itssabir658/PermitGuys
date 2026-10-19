import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { Figure } from "@/components/ui/Figure";
import { MapCard } from "@/components/ui/MapCard";
import { Placeholder } from "@/components/ui/Placeholder";
import { RatingCard, ReviewCarousel } from "@/components/ui/Reviews";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { site } from "@/content/site";
import { getProjects } from "@/lib/content";
import type { ReviewSummary } from "@/lib/reviews";
import { paths } from "@/lib/routes";

/*
 * Trust, stated as things a visitor can check: the Google rating and
 * reviews, where to find us on the map, and plain facts about pricing and
 * qualifications. Every item is a verified fact or a visible placeholder.
 * Approved case studies appear underneath automatically once they exist.
 */

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-t border-white/10 py-4 first:border-t-0 first:pt-0 last:pb-0">
      <dt className="text-label text-brand-300">{label}</dt>
      <dd className="mt-1.5 leading-relaxed text-charcoal-100/90">{children}</dd>
    </div>
  );
}

const linkClass = "underline decoration-brand-300/60 underline-offset-4 hover:text-paper hover:decoration-brand-300";

export function ReviewsAndMap({ reviews }: { reviews: ReviewSummary | null }) {
  const projects = getProjects().slice(0, 3);
  const { credentials, map } = site;

  return (
    <section aria-labelledby="proof-heading" className="bg-glow-dark relative overflow-hidden text-paper">
      <div aria-hidden="true" className="bg-drafting-grid-dark absolute inset-0 opacity-70" />
      <Container className="relative py-16 sm:py-20 lg:py-28">
        <div data-reveal="">
          <SectionHeading
            id="proof-heading"
            onDark
            code="03"
            eyebrow="Reviews and location"
            title="Straight answers, and the record to back them."
            intro="We tell you what your project is likely to need, who else may need to be involved, and what is outside our control. We never promise a permit approval: that decision belongs to your municipality."
          />
        </div>

        <div data-reveal="" className="mt-12 grid gap-4 lg:mt-16 lg:grid-cols-12">
          {reviews ? (
            <RatingCard summary={reviews} onDark className="lg:col-span-4" />
          ) : (
            <div className="glass-dark rounded-3xl p-6 sm:p-8 lg:col-span-4">
              <Placeholder onDark>Google rating and a link to the Business Profile, once confirmed</Placeholder>
            </div>
          )}
          <MapCard query={map.query} label={map.label} note={map.note} className="lg:col-span-8 lg:row-span-2" />
          <dl className="glass-dark rounded-3xl p-6 sm:p-8 lg:col-span-4">
            <Fact label="Qualifications">
              {credentials.length > 0 ? credentials.join(". ") : <Placeholder onDark>designer registration (BCIN) details for the drawings, once confirmed</Placeholder>}
            </Fact>
            <Fact label="Projects">
              {projects.length > 0 ? (
                <Link href={paths.projects} className={linkClass}>
                  Read our case studies
                </Link>
              ) : (
                <Placeholder onDark>approved project photos and case studies</Placeholder>
              )}
            </Fact>
            <Fact label="Pricing">Quoted for each project once we understand the scope. We do not publish set prices, because they depend on the work.</Fact>
            <Fact label="Where we work">
              Homeowners and property owners across the Greater Toronto Area.{" "}
              <Link href={paths.serviceAreas} className={linkClass}>
                Service areas
              </Link>
            </Fact>
          </dl>
        </div>

        <div data-reveal="" className="mt-4">
          {reviews && reviews.reviews.length > 0 ? (
            <ReviewCarousel reviews={reviews.reviews} onDark />
          ) : (
            <Placeholder onDark block>
              recent Google reviews appear here, with each reviewer&apos;s name, once the Places API key and place ID are set (see docs/REVIEWS.md). Review text is never written by hand.
            </Placeholder>
          )}
        </div>

        {projects.length > 0 ? (
          <div data-reveal="" className="mt-16 lg:mt-20">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <h3 className="font-display text-display-sm text-paper">Recent projects</h3>
              <ArrowLink href={paths.projects} onDark>
                All projects
              </ArrowLink>
            </div>
            <ul className="mt-8 grid gap-4 md:grid-cols-3">
              {projects.map((p) => (
                <li key={p.slug}>
                  <Link href={paths.project(p.slug)} className="group glass-dark block h-full rounded-3xl p-2 transition-transform duration-500 ease-out-soft hover:-translate-y-1">
                    <Figure visual={p.visual} tone="dark" caption={false} />
                    <span className="block p-4">
                      <span className="block font-display text-xl text-paper group-hover:text-brand-300">{p.title}</span>
                      <span className="mt-2 block text-charcoal-100/75">{p.summary}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Container>
    </section>
  );
}
