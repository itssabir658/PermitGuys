import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Placeholder } from "@/components/ui/Placeholder";
import { Stars } from "@/components/ui/Reviews";
import type { ReviewSummary } from "@/lib/reviews";
import { GoogleLink, ReviewReel } from "./Testimonials";

const dateFormat = new Intl.DateTimeFormat("en-CA", { dateStyle: "long", timeZone: "UTC" });

/*
 * Client feedback, kept authentic: the Google rating, set as a large
 * figure, and recent review text only when it comes live from Google's
 * Places API. Without it, the section sends visitors to read the reviews
 * where they were written rather than quoting them here.
 */
export function Reviews({ reviews }: { reviews: ReviewSummary | null }) {
  return (
    <section aria-labelledby="reviews-heading" className="bg-stone-100 py-24 sm:py-32 lg:py-44">
      <Container>
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Eyebrow code="07">Client feedback</Eyebrow>
            <h2 id="reviews-heading" className="sr-only">
              Client reviews
            </h2>
            {reviews ? (
              <div data-reveal="" className="mt-10">
                <p className="font-display text-[clamp(6rem,4rem+8vw,12rem)] leading-[0.8] font-light tracking-[-0.07em] text-ink tabular-nums">
                  {reviews.rating.toFixed(1)}
                </p>
                <div className="mt-8 flex items-center gap-4">
                  <Stars rating={reviews.rating} className="text-lg" />
                  <span className="text-[0.9375rem] text-ink-muted">
                    <span className="sr-only">Rated {reviews.rating.toFixed(1)} out of 5 from </span>
                    {reviews.count} reviews on Google
                  </span>
                </div>
                {reviews.source === "profile" && reviews.asOf ? <p className="mt-3 text-label text-ink-muted">Business Profile, {dateFormat.format(new Date(reviews.asOf))}</p> : null}
              </div>
            ) : (
              <Placeholder block className="mt-10">
                Google rating and a link to the Business Profile, once confirmed
              </Placeholder>
            )}
          </div>
          <div data-reveal="" className="lg:col-span-7 lg:col-start-6 lg:pt-16">
            {reviews && reviews.reviews.length > 0 ? (
              <>
                <ReviewReel reviews={reviews.reviews.slice(0, 6)} />
                <GoogleLink href={reviews.url} className="mt-12" />
              </>
            ) : (
              <>
                <p className="font-display text-display-md font-light text-balance text-ink">
                  We would rather you read our reviews where our clients wrote them than as quotes we chose.
                </p>
                {reviews ? <GoogleLink href={reviews.url} className="mt-10" /> : null}
              </>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
