"use client";

import { WORDMARK } from "@/content/wordmark";

/**
 * The wordmark's outlines (Wordmark.tsx). A client component only so that
 * the path data travels once, in a cached script, instead of again in the
 * server payload of every page that sets the name; it renders on the server
 * all the same.
 */
export function WordmarkSvg() {
  return (
    <svg viewBox={WORDMARK.viewBox} className="wordmark__svg" aria-hidden="true" focusable="false">
      <path className="wordmark__permit" d={WORDMARK.permit} />
      <path className="wordmark__guys" d={WORDMARK.guys} />
    </svg>
  );
}
