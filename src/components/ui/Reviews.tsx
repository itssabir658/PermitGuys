import type { GoogleReview, ReviewSummary } from "@/lib/reviews";
import { ExternalIcon } from "./Icons";
import { cn } from "./cn";

/*
 * Google rating and review cards. The figures and any review text come from
 * src/lib/reviews.ts: live from the Places API when it is configured,
 * otherwise the rating recorded from the Business Profile. Review text is
 * never written by hand, and every card credits its author and Google.
 */

const STAR = "M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.6 7.7l5.8-.8z";

function StarRow({ className }: { className?: string }) {
  return (
    <span className={cn("flex gap-0.5", className)}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 20 20" className="size-[1em] shrink-0 fill-current" aria-hidden="true" focusable="false">
          <path d={STAR} />
        </svg>
      ))}
    </span>
  );
}

/** Five stars filled to the rating. Decorative: the number is always given as text. */
export function Stars({ rating, className, onDark }: { rating: number; className?: string; onDark?: boolean }) {
  const filled = (Math.max(0, Math.min(5, rating)) / 5) * 100;
  return (
    <span aria-hidden="true" className={cn("relative inline-flex", className)}>
      <StarRow className={onDark ? "text-white/20" : "text-charcoal-900/15"} />
      <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${filled}%` }}>
        <StarRow className={onDark ? "text-brand-300" : "text-brand-500"} />
      </span>
    </span>
  );
}

const dateFormat = new Intl.DateTimeFormat("en-CA", { dateStyle: "long", timeZone: "UTC" });

/** Large rating card: score, stars, count and a link to the reviews on Google. */
export function RatingCard({ summary, onDark, className, headingLevel = "h3" }: { summary: ReviewSummary; onDark?: boolean; className?: string; headingLevel?: "h2" | "h3" }) {
  const H = headingLevel;
  return (
    <div className={cn("spotlight flex flex-col rounded-3xl p-6 sm:p-8", onDark ? "glass-dark" : "glass", className)}>
      <H className={cn("text-label", onDark ? "text-brand-300" : "text-brand-700")}>Google reviews</H>
      <p className="mt-5 flex items-end gap-4">
        <span className={cn("font-display text-[4.5rem] leading-[0.85] font-semibold tracking-[-0.04em] tabular-nums", onDark ? "text-paper" : "text-charcoal-900")}>
          {summary.rating.toFixed(1)}
        </span>
        <span className="pb-1">
          <Stars rating={summary.rating} onDark={onDark} className="text-xl" />
          <span className={cn("mt-1.5 block text-sm", onDark ? "text-charcoal-100/80" : "text-ink-muted")}>
            <span className="sr-only">Rated {summary.rating.toFixed(1)} out of 5 from </span>
            {summary.count} reviews<span className="sr-only"> on Google</span>
          </span>
        </span>
      </p>
      <a
        href={summary.url}
        className={cn(
          "group mt-8 inline-flex min-h-11 w-fit items-center gap-2 rounded-xl px-4 text-[0.95rem] font-semibold transition-colors",
          onDark ? "bg-white/10 text-paper hover:bg-white/15" : "bg-charcoal-900 text-paper hover:bg-charcoal-800",
        )}
      >
        Read the reviews on Google
        <ExternalIcon />
      </a>
      {summary.source === "profile" && summary.asOf ? (
        <p className={cn("mt-4 text-xs", onDark ? "text-charcoal-100/65" : "text-ink-muted")}>From our Google Business Profile on {dateFormat.format(new Date(summary.asOf))}.</p>
      ) : null}
    </div>
  );
}

/** Compact rating link for tight spaces such as the hero. */
export function RatingBadge({ summary, className }: { summary: ReviewSummary; className?: string }) {
  return (
    <a href={summary.url} className={cn("group glass inline-flex items-center gap-4 rounded-2xl py-3 pr-5 pl-4 transition-colors hover:bg-white", className)}>
      <span className="font-display text-3xl leading-none font-semibold tracking-[-0.03em] text-charcoal-900 tabular-nums">{summary.rating.toFixed(1)}</span>
      <span>
        <Stars rating={summary.rating} className="text-[0.95rem]" />
        <span className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
          <span className="sr-only">Rated {summary.rating.toFixed(1)} out of 5 from </span>
          {summary.count} Google reviews
          <ExternalIcon className="size-3 opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </span>
    </a>
  );
}

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

function ReviewCard({ review, onDark }: { review: GoogleReview; onDark?: boolean }) {
  const author = review.authorUrl ? (
    <a href={review.authorUrl} className="font-semibold underline-offset-4 hover:underline">
      {review.author}
    </a>
  ) : (
    <span className="font-semibold">{review.author}</span>
  );
  return (
    <figure className={cn("flex h-full flex-col rounded-3xl p-6", onDark ? "glass-dark text-paper" : "glass text-charcoal-900")}>
      <Stars rating={review.rating} onDark={onDark} />
      <span className="sr-only">Rated {review.rating} out of 5.</span>
      <blockquote className={cn("mt-4 line-clamp-[8] flex-1 leading-relaxed", onDark ? "text-charcoal-100/90" : "text-ink")}>
        <p>{review.text}</p>
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3 text-sm">
        <span aria-hidden="true" className={cn("flex size-10 shrink-0 items-center justify-center rounded-full font-semibold", onDark ? "bg-brand-500 text-white" : "bg-charcoal-900 text-paper")}>
          {initials(review.author)}
        </span>
        <span>
          {author}
          <span className={cn("block", onDark ? "text-charcoal-100/65" : "text-ink-muted")}>
            {review.relativeTime ? `${review.relativeTime} on Google` : "On Google"}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}

/** Swipeable row of recent reviews. Renders nothing when there is no review text. */
export function ReviewCarousel({ reviews, onDark, className }: { reviews: GoogleReview[]; onDark?: boolean; className?: string }) {
  if (reviews.length === 0) return null;
  return (
    <div
      role="region"
      aria-label="Recent Google reviews"
      tabIndex={0}
      className={cn("-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0", className)}
    >
      {reviews.slice(0, 6).map((review) => (
        <div key={`${review.author}-${review.publishTime ?? review.relativeTime}`} className="w-[85%] shrink-0 snap-start sm:w-[22rem] lg:w-auto">
          <ReviewCard review={review} onDark={onDark} />
        </div>
      ))}
    </div>
  );
}
