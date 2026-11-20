"use client";

// A client component only so that the outlines travel in a cached script, not again in each page's server payload; it renders on the server all the same.
import { site } from "@/content/site";
import { WORDMARK } from "@/content/wordmark";

/**
 * The PermitGuys logo, drawn as vectors so it is sharp at any size
 * (src/content/wordmark.ts): red "permit", charcoal "guys". On dark grounds
 * "guys" switches to white. Sized by its height (className).
 */
export function Logo({ onDark, className }: { onDark?: boolean; className?: string }) {
  return (
    <svg viewBox={WORDMARK.viewBox} overflow="visible" role="img" aria-label={site.name} className={className ?? "h-6 w-auto"}>
      <path fill={WORDMARK.red} d={WORDMARK.permit} />
      <path fill={onDark ? "#fff" : WORDMARK.charcoal} d={WORDMARK.guys} />
    </svg>
  );
}
