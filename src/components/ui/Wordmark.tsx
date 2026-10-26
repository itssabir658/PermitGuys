import { Fragment, type ReactNode } from "react";
import { WORDMARK } from "@/content/wordmark";
import { site } from "@/content/site";
import { cn } from "./cn";

/**
 * The logo in running text: the name set as the wordmark, at the size of the
 * text around it (the letters are the font's own, so at 1em they sit on the
 * line as the font would). Red "permit"; "guys" in the logo's charcoal, or
 * white on dark grounds (globals.css, "Wordmark"). The name itself stays in
 * the text, for screen readers, search and copying.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("wordmark", className)}>
      <svg viewBox={WORDMARK.viewBox} className="wordmark__svg" aria-hidden="true" focusable="false">
        <path className="wordmark__permit" d={WORDMARK.permit} />
        <path className="wordmark__guys" d={WORDMARK.guys} />
      </svg>
      <span className="sr-only">{site.name}</span>
    </span>
  );
}

/** Text with every mention of the name shown as the wordmark. */
export function withWordmark(text: string): ReactNode {
  const parts = text.split(site.name);
  if (parts.length === 1) return text;
  return parts.map((part, i) => (
    <Fragment key={i}>
      {i > 0 ? <Wordmark /> : null}
      {part}
    </Fragment>
  ));
}
