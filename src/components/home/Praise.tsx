import Image from "next/image";
import type { CSSProperties } from "react";
import { Container } from "@/components/ui/Container";
import { ExternalIcon } from "@/components/ui/Icons";
import { LogoRow } from "@/components/ui/LogoRow";
import { Stars } from "@/components/ui/Reviews";
import { featuredReviews, holmesQuote, partners } from "@/content/recognition";
import type { ReviewSummary } from "@/lib/reviews";

/**
 * Praise, straight after the introduction, so the firm's reputation comes
 * before its work: the Google rating, Mike Holmes on #HolmesFamilyRescue
 * beside a photograph of him with the team, five Google reviews, and the
 * companies PermitGuys has worked with or been featured by.
 *
 * It flows on the page's cream ground, between the intro's pinned stage and
 * the story's, with no stage of its own: the heading's lines rise out of
 * their masks and the pieces fade up as they reach the screen
 * (InteractionEffects), the same reveals as the inner pages. On phones the
 * reviews are a row to swipe; from 768px they are set in columns.
 *
 * The review text and the quote are the business's own published copy
 * (src/content/recognition.ts); no review structured data is added.
 */
export function Praise({ reviews }: { reviews: ReviewSummary | null }) {
  const { photo } = holmesQuote;
  return (
    <section data-praise="" aria-labelledby="praise-heading" className="praise relative">
      <Container>
        <div className="praise-head">
          <div>
            <p data-reveal="" className="text-label text-ink-muted">
              Reviews
            </p>
            <h2 id="praise-heading" data-reveal-lines="" className="mt-5 font-display text-display-xl font-light text-ink">
              In our clients’ words.
            </h2>
          </div>
          {reviews ? (
            <a data-reveal="" href={reviews.url} className="praise-rating group" style={{ "--d": 120 } as CSSProperties}>
              <span className="font-display text-[clamp(4rem,3rem+3vw,6.5rem)] leading-[0.82] font-light tracking-[-0.06em] text-ink tabular-nums">
                {reviews.rating.toFixed(1)}
              </span>
              <span className="pb-1">
                <Stars rating={reviews.rating} className="text-lg" />
                <span className="mt-2 flex items-center gap-1.5 text-sm text-ink-muted">
                  <span className="sr-only">Rated {reviews.rating.toFixed(1)} out of 5 from </span>
                  <span className="link-rule">{reviews.count} Google reviews</span>
                  <ExternalIcon className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </span>
            </a>
          ) : null}
        </div>

        <figure className="praise-feature">
          <div data-reveal="" className="praise-photo">
            <Image
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              sizes="(min-width: 1024px) 34vw, (min-width: 768px) 40vw, 92vw"
              quality={85}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="praise-quote">
            <blockquote data-reveal="" style={{ "--d": 80 } as CSSProperties}>
              <p className="font-display text-display-md font-light text-ink">
                <span aria-hidden="true">“</span>
                {holmesQuote.text}
                <span aria-hidden="true">”</span>
              </p>
            </blockquote>
            <figcaption data-reveal="" className="mt-8 flex items-baseline gap-3" style={{ "--d": 160 } as CSSProperties}>
              <span className="font-medium text-ink">{holmesQuote.author}</span>
              <span className="text-label text-ink-muted">{holmesQuote.note}</span>
            </figcaption>
          </div>
        </figure>

        <div className="praise-reviews">
          <h3 data-reveal="" className="text-label text-ink-muted">
            From our Google reviews
          </h3>
          <div role="region" aria-label="Google reviews" tabIndex={0} className="praise-scroll">
            <ul role="list" className="praise-list">
              {featuredReviews.map((review) => (
                <li key={review.author} data-reveal="" className="praise-card">
                  <figure>
                    <blockquote>
                      <p className="text-[1.0625rem] leading-relaxed text-ink">{review.text}</p>
                    </blockquote>
                    <figcaption className="mt-6 text-sm">
                      <span className="font-semibold text-ink">{review.author}</span>
                      <span className="block text-ink-muted">On Google</span>
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="praise-partners">
          <h3 data-reveal="" className="text-label text-ink-muted">
            Worked with and featured by
          </h3>
          <LogoRow logos={partners} label="Companies we have worked with or been featured by" className="mt-6" />
        </div>
      </Container>
    </section>
  );
}
