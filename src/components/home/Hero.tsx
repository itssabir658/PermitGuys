import Image from "next/image";
import type { CSSProperties } from "react";
import { STUDY_NOTE, plates } from "@/content/imagery";

const sub = ["Clarity in every detail.", "Confidence in every permit."];

/**
 * Opening: a full-bleed study under a graded veil (darker at the top for the
 * header and at the bottom for the statement, open across the glazing), the
 * name set very large across the middle and the statement at the bottom
 * left.
 *
 * Load: the preloader's iris opens from the GTA dot onto the picture, which
 * settles from 112% around that point; the name rises out of its mask at
 * 0.45s, the statement's lines from 0.85s (globals.css, "Hero"). After a
 * page transition the same entrance runs sooner.
 *
 * Scroll: a 250vh track holds the stage for 1.5 screens, and from half a
 * screen the intro's ivory sheet rises over it (Intro.tsx). The statement
 * and then the name leave upward through their own masks before the sheet
 * reaches them, while the picture recedes beneath it: it drifts up, grows
 * 8% and darkens (HomeMotion, hero module; heroState). The CSS entrance
 * moves each line's inner span, the scroll moves the [data-hero-roll] span
 * around it, so neither overrides the other.
 * Short screens, reduced motion and no JavaScript get the still opening.
 */
export function Hero() {
  const plate = plates.infill;
  return (
    <section data-home-hero="" data-tone="dark" aria-labelledby="hero-heading" className="relative h-svh min-h-[34rem] tracks:h-[250vh]">
      <div className="sticky top-0 isolate h-svh min-h-[34rem] overflow-hidden bg-charcoal-950 text-ivory">
        <div data-hero-image="" className="absolute inset-0 -z-10">
          <Image src={plate.src} alt={plate.alt} fill priority quality={85} sizes="100vw" className="object-cover object-[72%_58%] sm:object-[64%_62%]" />
          <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0.55)_0%,rgb(0_0_0/0.28)_38%,rgb(0_0_0/0.32)_62%,rgb(0_0_0/0.7)_100%)]" />
          <div data-hero-dim="" aria-hidden="true" className="absolute inset-0 bg-black opacity-0" />
        </div>

        <div className="absolute inset-0 flex items-center justify-center px-4">
          <h1 id="hero-heading" data-hero-heading="" className="font-wordmark text-[13.4vw] leading-[0.92] tracking-[-0.015em] whitespace-nowrap uppercase lg:text-[12.2vw]">
            <span className="split-line hero-heading-line">
              <span data-hero-roll="" className="block">
                <span className="split-line__inner">PermitGuys</span>
              </span>
            </span>
            <span className="sr-only"> — permit drawings and permit guidance in the Greater Toronto Area</span>
          </h1>
        </div>

        <div
          data-hero-sub=""
          className="absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-site flex-col gap-6 px-5 pb-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-12 lg:pb-12 xl:px-16"
        >
          <p className="font-display text-[clamp(1.6rem,1rem+2vw,3rem)] leading-[1.06] font-light tracking-[-0.035em]">
            {sub.map((line, i) => (
              <span key={line} className="split-line hero-sub-line" style={{ "--i": i } as CSSProperties}>
                <span data-hero-roll="" className="block">
                  <span className="split-line__inner">{line}</span>
                </span>
              </span>
            ))}
          </p>
          <p className="hero-fig max-w-xs text-label text-ivory/70 lg:text-right">
            Fig. 01 — {plate.caption}. {STUDY_NOTE}
          </p>
        </div>
      </div>
    </section>
  );
}
