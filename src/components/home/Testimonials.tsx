"use client";

import { useState } from "react";
import { ExternalIcon } from "@/components/ui/Icons";
import { cn } from "@/components/ui/cn";
import type { GoogleReview } from "@/lib/reviews";

/*
 * One review at a time, set large. Only ever shows review text that came
 * from Google (src/lib/reviews.ts); nothing here is written by hand.
 */
export function ReviewReel({ reviews }: { reviews: GoogleReview[] }) {
  const [index, setIndex] = useState(0);
  const review = reviews[index];
  const go = (step: number) => setIndex((i) => (i + step + reviews.length) % reviews.length);
  return (
    <div role="region" aria-roledescription="carousel" aria-label="Recent Google reviews">
      <figure key={index} className="motion-rise">
        <blockquote className="font-display text-display-md font-light text-pretty text-ink">
          <p className="line-clamp-[9]">&ldquo;{review.text}&rdquo;</p>
        </blockquote>
        <figcaption className="mt-10 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[0.9375rem]">
          {review.authorUrl ? (
            <a href={review.authorUrl} className="link-rule font-medium text-ink">
              {review.author}
            </a>
          ) : (
            <span className="font-medium text-ink">{review.author}</span>
          )}
          <span className="text-label text-ink-muted">
            {review.rating} / 5{review.relativeTime ? ` · ${review.relativeTime}` : ""} · Google
          </span>
        </figcaption>
      </figure>
      {reviews.length > 1 ? (
        <div className="mt-12 flex items-center gap-6">
          <button type="button" onClick={() => go(-1)} className="flex size-12 items-center justify-center rounded-full ring-1 ring-ink/20 transition-colors ring-inset hover:bg-ink hover:text-ivory" aria-label="Previous review">
            <span aria-hidden="true">←</span>
          </button>
          <button type="button" onClick={() => go(1)} className="flex size-12 items-center justify-center rounded-full ring-1 ring-ink/20 transition-colors ring-inset hover:bg-ink hover:text-ivory" aria-label="Next review">
            <span aria-hidden="true">→</span>
          </button>
          <span className="text-label text-ink-muted tabular-nums" aria-live="polite">
            {String(index + 1).padStart(2, "0")} / {String(reviews.length).padStart(2, "0")}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export function GoogleLink({ href, className }: { href: string; className?: string }) {
  return (
    <a href={href} className={cn("group inline-flex items-center gap-3 text-[0.9375rem] font-medium text-ink", className)}>
      <span className="link-rule pb-1">Read the reviews on Google</span>
      <ExternalIcon className="size-3.5 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </a>
  );
}
