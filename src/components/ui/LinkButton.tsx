import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { ArrowRight } from "./Icons";
import { cn } from "./cn";

/*
 * The site's one call to action (docs/MOTION.md, "Link buttons"): a mono
 * label plate and a square icon cell. On hover or keyboard focus (globals.css,
 * "Link button"):
 *   - a darker sheet of the plate's own colour wipes across the label
 *     (0.45s, --e-sheet) and leaves forwards, through the far edge;
 *   - a highlight passes over the label (0.6s);
 *   - just after, the icon cell turns a quarter on a cube to its second
 *     face, where the arrow is the button's one red (0.45s, power3.out);
 *   - both cells round their corners by 2px.
 * Tones: "dark" (ink, the default), "light" (ivory, on dark grounds and
 * pictures), "outline" (the quieter second action on paper: an ink ring that
 * fills with ink, the label turning ivory as the fill passes) and "ghost"
 * (the same on dark grounds, in ivory).
 */

export type LinkButtonTone = "dark" | "light" | "outline" | "ghost";

export function linkButtonClass(tone: LinkButtonTone = "dark", className?: string) {
  return cn("link-button", tone !== "dark" && `link-button--${tone}`, className);
}

/**
 * The inside of a link button, for a <button> or an outside link that wants the same face (the contact form's submit,
 * the map card). `icon` replaces the arrow on both faces; `front` replaces it on the face at rest only (a spinner).
 */
export function LinkButtonFace({ children, icon, front }: { children: ReactNode; icon?: ReactNode; front?: ReactNode }) {
  const glyph = icon ?? <ArrowRight className="size-4" />;
  return (
    <>
      <span className="link-button__plate">
        <span aria-hidden="true" className="link-button__wipe" />
        <span className="link-button__label">{children}</span>
        {/* The outline tones' label in the fill's opposite colour, uncovered with the fill (the plain label stays under it). */}
        <span aria-hidden="true" className="link-button__over">
          <span className="link-button__label link-button__label--over">{children}</span>
        </span>
      </span>
      <span aria-hidden="true" className="link-button__icon">
        <span className="link-button__cube">
          <span className="link-button__face">{front ?? glyph}</span>
          <span className="link-button__face link-button__face--side">{glyph}</span>
        </span>
      </span>
    </>
  );
}

export function LinkButton({ href, children, tone = "dark", className }: { href: Route; children: ReactNode; tone?: LinkButtonTone; className?: string }) {
  return (
    <Link href={href} className={linkButtonClass(tone, className)}>
      <LinkButtonFace>{children}</LinkButtonFace>
    </Link>
  );
}
