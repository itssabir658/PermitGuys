import Image from "next/image";
import type { CSSProperties } from "react";
import { STUDY_NOTE, plates } from "@/content/imagery";

const sub = ["Clarity in every detail.", "Confidence in every permit."];

/**
 * Opening, after the Studio Foundry reference (docs/MOTION.md, "Hero"): a
 * full-bleed study under a 50% black veil, the name set very large across
 * the middle and the statement at the bottom left.
 *
 * Load: after the Ontario preloader lifts, the picture and the header sit
 * still for 1.5s, then the name rises out of its mask (0.9s) and the
 * statement's lines follow half a second later (globals.css, "Hero").
 *
 * Scroll: a 200vh track holds a 100vh stage. From half a screen of scroll to
 * the end of the track the name rises and the statement sinks, half a screen
 * each, both fading out (HomeMotion, hero module). The picture stays put.
 * Short screens, reduced motion and no JavaScript get the still opening.
 */
export function Hero() {
  const plate = plates.infill;
  return (
    <section data-home-hero="" data-tone="dark" aria-labelledby="hero-heading" className="relative h-svh min-h-[34rem] tracks:h-[200vh]">
      <div className="sticky top-0 isolate h-svh min-h-[34rem] overflow-hidden bg-charcoal-950 text-ivory">
        <div data-hero-image="" className="absolute inset-0 -z-10">
          <Image src={plate.src} alt={plate.alt} fill priority quality={85} sizes="100vw" className="object-cover object-[64%_62%]" />
          <div aria-hidden="true" className="absolute inset-0 bg-black/50" />
        </div>

        <div className="absolute inset-0 flex items-center justify-center px-4">
          <h1 id="hero-heading" data-hero-heading="" className="font-wordmark text-[13.4vw] leading-[0.92] tracking-[-0.015em] whitespace-nowrap uppercase lg:text-[12.2vw]">
            <span className="split-line hero-heading-line">
              <span className="split-line__inner">PermitGuys</span>
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
                <span className="split-line__inner">{line}</span>
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
