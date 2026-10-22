import Image from "next/image";
import type { CSSProperties } from "react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ArrowRight } from "@/components/ui/Icons";
import { STUDY_NOTE, plates } from "@/content/imagery";
import { paths } from "@/lib/routes";
import { HeroScroll } from "./HeroScroll";

const WORDMARK = "PERMITGUYS";
const lines = ["Clarity in every detail.", "Confidence in every permit."];
const lede = "Permit drawings and permit guidance for homeowners, landlords and businesses across the GTA, prepared for the way municipalities review them.";

/**
 * Full-bleed opening, after the Studio Foundry reference: an oversized
 * wordmark across the top of the photograph and the statement at the
 * bottom left.
 *
 * Entrance (globals.css, "Homepage hero"): the photograph unveils and
 * settles, the wordmark's letters rise one after another, then the
 * statement and the header follow. On a first visit it waits for the
 * Ontario intro (ScreenTransition) to lift.
 *
 * Scroll (HeroScroll sets --p from 0 to 1 over one screen of scrolling while
 * the hero stays pinned):
 *   0–40%   the wordmark lifts and fades, the photograph slowly zooms;
 *   20–70%  the photograph draws in to a framed plate and darkens;
 *   45–85%  the introduction and actions rise into the frame;
 *   100%    the next section scrolls up over it.
 * With reduced motion, or without JavaScript, everything is shown at once
 * and nothing is pinned.
 */
export function Hero() {
  const plate = plates.infill;
  return (
    <section aria-labelledby="hero-heading" data-hero="" className="hero relative bg-charcoal-950 text-ivory">
      <HeroScroll />
      <div className="hero__stage sticky top-0 isolate flex h-svh min-h-[36rem] flex-col overflow-hidden">
        <div className="hero__media absolute inset-0 -z-10">
          <div className="hero__plate absolute inset-0">
            <Image src={plate.src} alt={plate.alt} fill priority quality={84} sizes="100vw" className="hero__img object-cover object-[64%_62%]" />
          </div>
          <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgb(17_17_16/0.5)_0%,rgb(17_17_16/0.1)_32%,rgb(17_17_16/0.1)_55%,rgb(17_17_16/0.72)_100%)]" />
          <div aria-hidden="true" className="hero__shade absolute inset-0 bg-charcoal-950" />
        </div>

        {/* The wordmark is decoration; the brand name is in the header logo and the page title. */}
        <p aria-hidden="true" className="hero__word mx-auto mt-[5.5rem] w-full max-w-site px-4 text-center font-wordmark leading-[0.8] tracking-[-0.02em] sm:mt-24 sm:px-6 lg:px-8">
          {WORDMARK.split("").map((ch, i) => (
            <span key={i} className="hero__mask">
              <span className="hero__ch" style={{ "--i": i } as CSSProperties}>
                {ch}
              </span>
            </span>
          ))}
        </p>

        <div className="mx-auto mt-auto grid w-full max-w-site gap-10 px-5 pb-8 sm:px-8 lg:grid-cols-12 lg:items-end lg:gap-8 lg:px-12 lg:pb-12 xl:px-16">
          <h1 id="hero-heading" className="hero__title font-display text-[clamp(2.25rem,1rem+3.4vw,4.75rem)] leading-[1.02] font-light tracking-[-0.035em] lg:col-span-8">
            {lines.map((line, i) => (
              <span key={line} className="hero-line line" style={{ "--i": i } as CSSProperties}>
                <span>{line}</span>
              </span>
            ))}
          </h1>
          <div className="hero__more lg:col-span-4">
            <p className="max-w-md text-lede text-ivory/85">{lede}</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-5">
              <ButtonLink href={paths.contact} variant="light">
                Discuss your project
              </ButtonLink>
              <a href="#services" className="group inline-flex items-center gap-3 text-[0.9375rem] font-medium text-ivory">
                <span className="link-rule pb-1">Explore services</span>
                <ArrowRight className="size-4 rotate-90 transition-transform duration-500 ease-out-expo group-hover:translate-y-1" />
              </a>
            </div>
            <p className="mt-8 text-label text-ivory/60">
              Fig. 01 — {plate.caption}. {STUDY_NOTE}
            </p>
          </div>
        </div>

        <div aria-hidden="true" className="hero__cue absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 text-label text-ivory/70 lg:flex">
          <span className="scroll-cue relative block h-10 w-px overflow-hidden bg-ivory/20 after:absolute after:inset-0 after:bg-ivory" />
          <span>Scroll</span>
        </div>
      </div>
    </section>
  );
}
