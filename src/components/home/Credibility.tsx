import type { CSSProperties, ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { ExternalIcon } from "@/components/ui/Icons";
import { Stars } from "@/components/ui/Reviews";
import { homeSteps } from "@/content/process";
import { services } from "@/content/services";
import { site } from "@/content/site";
import type { ReviewSummary } from "@/lib/reviews";

/*
 * A restrained line of facts a visitor can check: the Google rating (live
 * or as recorded from the Business Profile, always linked), the scope of
 * services, our credentials as the business confirmed them, and the
 * process. Nothing here is a credential the business has not confirmed.
 */

function Item({ figure, children, index }: { figure: ReactNode; children: ReactNode; index: number }) {
  return (
    <div data-reveal="" style={{ "--d": index * 90 } as CSSProperties} className="flex flex-col gap-3 border-t border-line pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8 lg:first:border-l-0 lg:first:pl-0">
      <div className="font-display text-[clamp(2.1rem,1.6rem+1.6vw,3.25rem)] leading-none font-light tracking-[-0.045em] text-ink">{figure}</div>
      <div className="max-w-[16rem] text-[0.9375rem] leading-snug text-ink-muted">{children}</div>
    </div>
  );
}

const words = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];

export function Credibility({ reviews }: { reviews: ReviewSummary | null }) {
  const homes = services.filter((s) => s.category === "residential").length;
  const business = services.length - homes;
  return (
    <section aria-label="PermitGuys at a glance" className="bg-ivory">
      <Container className="py-16 sm:py-20">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {reviews ? (
            <Item index={0} figure={<span className="flex items-baseline gap-3">{reviews.rating.toFixed(1)}<Stars rating={reviews.rating} className="text-base" /></span>}>
              <a href={reviews.url} className="group inline-flex items-center gap-1.5 text-ink">
                <span className="link-rule">
                  <span className="sr-only">Rated {reviews.rating.toFixed(1)} out of 5 from </span>
                  {reviews.count} Google reviews
                </span>
                <ExternalIcon className="size-3 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              {reviews.source === "profile" ? <span className="block">as listed on our Business Profile</span> : null}
            </Item>
          ) : null}
          <Item index={1} figure={<>{services.length}</>}>
            permit services, {words[homes - 1] ?? homes} for homes and {words[business - 1] ?? business} for businesses and landlords
          </Item>
          {site.credentials.length ? (
            <Item index={2} figure="BCIN">
              {site.credentials.join(". ")}.
            </Item>
          ) : (
            <Item index={2} figure="GTA">
              Permit drawings and guidance across the Greater Toronto Area
            </Item>
          )}
          <Item index={3} figure={<>{homeSteps.length}</>}>steps from the first conversation to the municipality&rsquo;s decision</Item>
        </div>
      </Container>
    </section>
  );
}
