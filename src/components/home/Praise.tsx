import Image from "next/image";
import type { CSSProperties } from "react";
import { Container } from "@/components/ui/Container";
import { ExternalIcon } from "@/components/ui/Icons";
import { LogoRow } from "@/components/ui/LogoRow";
import { Stars } from "@/components/ui/Reviews";
import { featuredReviews, holmesQuote, partners } from "@/content/recognition";
import type { ReviewSummary } from "@/lib/reviews";

/** A reviewer's initials for the card's avatar: the first letters of the first and last names. */
function initials(name: string) {
  const parts = name.split(/[\s-]+/).filter(Boolean);
  return `${parts[0]?.[0] ?? ""}${parts.length > 1 ? parts[parts.length - 1][0] : ""}`.toUpperCase();
}

/** Google's "G", drawn in the ink of the page as the other marks are. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 flex-none" fill="currentColor">
      <path d="M21.6 12.23c0-.68-.06-1.36-.18-2.02H12v3.83h5.39a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.9-1.74 2.98-4.3 2.98-7.33Z" />
      <path d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.23-2.5c-.9.6-2.04.96-3.39.96-2.6 0-4.81-1.76-5.6-4.12H3.07v2.58A10 10 0 0 0 12 22Z" />
      <path d="M6.4 13.9a6 6 0 0 1 0-3.8V7.52H3.07a10 10 0 0 0 0 8.96L6.4 13.9Z" />
      <path d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.86-2.86A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.52L6.4 10.1C7.19 7.74 9.4 5.98 12 5.98Z" />
    </svg>
  );
}

/** A partner's mark by the start of its name (recognition.ts), for the "As seen on" badge. */
function partnerLogo(name: string) {
  const logo = partners.find((p) => p.name.startsWith(name));
  if (!logo) throw new Error(`No partner logo named ${name}`);
  return logo;
}

/**
 * Praise, straight after the introduction, so the firm's reputation comes
 * before its work: the Google rating, Mike Holmes on #HolmesFamilyRescue
 * beside a photograph of him with the team (badged "As seen on HGTV",
 * both marks in the ink of the page), five Google reviews, and the
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
  const hgtv = partnerLogo("HGTV");
  const show = partnerLogo("Holmes Family Rescue");
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
            <p data-reveal="" className="seen-on" style={{ "--d": 40 } as CSSProperties}>
              <span className="seen-on__dot" aria-hidden="true" />
              <span className="seen-on__label">As seen on</span>
              {/* eslint-disable-next-line @next/next/no-img-element -- a small vector mark, drawn as it is */}
              <img src={hgtv.src} alt="HGTV" width={hgtv.width} height={hgtv.height} className="seen-on__hgtv" />
              <span className="seen-on__rule" aria-hidden="true" />
              {/* eslint-disable-next-line @next/next/no-img-element -- a small line-art mark, drawn as it is */}
              <img src={show.src} alt="Holmes Family Rescue" width={show.width} height={show.height} className="seen-on__show" />
            </p>
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
              {featuredReviews.map((review, i) => (
                <li key={review.author} data-reveal="" className="praise-card" style={{ "--d": i * 70 } as CSSProperties}>
                  <figure className="flex h-full flex-col">
                    <figcaption className="praise-card__head">
                      <span className="praise-card__avatar" aria-hidden="true">
                        {initials(review.author)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-ink">{review.author}</span>
                        <span className="praise-card__source">
                          <GoogleMark />
                          Google review
                        </span>
                      </span>
                    </figcaption>
                    {review.rating ? (
                      <p className="mt-5 flex items-center gap-2">
                        <Stars rating={review.rating} className="praise-card__stars" />
                        <span className="sr-only">Rated {review.rating} out of 5</span>
                      </p>
                    ) : null}
                    <blockquote className="mt-4 flex-1">
                      <p className="text-[1.0625rem] leading-relaxed text-ink">{review.text}</p>
                    </blockquote>
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
