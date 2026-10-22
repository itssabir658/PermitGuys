import Image from "next/image";
import type { CSSProperties } from "react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ArrowRight } from "@/components/ui/Icons";
import { STUDY_NOTE, plates } from "@/content/imagery";
import { site } from "@/content/site";
import { paths } from "@/lib/routes";

const lines = ["Clarity in", "every detail.", "Confidence in", "every permit."];

const lede = "Permit drawings and permit guidance for homeowners, landlords and businesses across the GTA, prepared for the way municipalities review them.";

/**
 * Full-bleed opening plate. The entrance is pure CSS and plays once on
 * load (globals.css, "Homepage hero entrance"): the photograph unveils
 * from a framed crop and settles from a slight scale, the headline rises
 * line by line out of its masks, then the supporting copy, the actions
 * and the page chrome follow. Everything is usable from the first frame,
 * and none of it moves for visitors who prefer reduced motion.
 */
export function Hero() {
  const plate = plates.infill;
  return (
    <section aria-labelledby="hero-heading" className="relative isolate flex min-h-[max(40rem,100svh)] flex-col overflow-hidden bg-charcoal-950 text-ivory">
      <div className="hero-plate grain absolute inset-0 -z-10">
        <Image
          src={plate.src}
          alt={plate.alt}
          fill
          priority
          quality={84}
          sizes="100vw"
          className="object-cover object-[72%_60%] sm:object-[66%_62%]"
        />
        {/* A photographic scrim, deepest where the type sits. */}
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgb(17_17_16/0.62)_0%,rgb(17_17_16/0.28)_45%,rgb(17_17_16/0)_70%)]" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(0deg,rgb(17_17_16/0.7),rgb(17_17_16/0))]" />
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgb(17_17_16/0.45),rgb(17_17_16/0))]" />
      </div>

      <div className="mx-auto flex w-full max-w-site flex-1 flex-col px-5 pt-28 pb-8 sm:px-8 sm:pt-32 lg:px-12 lg:pb-10 xl:px-16">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-8">
          <p className="hero-chrome text-label text-ivory/75 lg:col-span-6">
            <span className="text-ivory">Permit drawings & approvals</span>
            <span aria-hidden="true"> — </span>
            {site.region.replace(", Ontario", "")}
          </p>
          <p className="hero-fade hidden max-w-sm text-lede text-ivory/85 lg:col-span-4 lg:col-start-9 lg:block" style={{ "--i": 0 } as CSSProperties}>
            {lede}
          </p>
        </div>

        <div className="mt-auto grid gap-10 pt-16 lg:grid-cols-12 lg:items-end lg:gap-8">
          <div className="lg:col-span-8">
            <h1 id="hero-heading" className="font-display text-hero font-light">
              {lines.map((line, i) => (
                <span key={line} className="hero-line line" style={{ "--i": i } as CSSProperties}>
                  <span className={i >= 2 ? "text-ivory/75" : undefined}>{line}</span>
                </span>
              ))}
            </h1>
          </div>
          <div className="lg:col-span-4 lg:pb-4">
            <p className="hero-fade max-w-md text-lede text-ivory/85 lg:hidden" style={{ "--i": 0 } as CSSProperties}>
              {lede}
            </p>
            <div className="hero-fade mt-9 flex flex-wrap items-center gap-x-8 gap-y-5 lg:mt-0 lg:justify-end" style={{ "--i": 1 } as CSSProperties}>
              <ButtonLink href={paths.contact} variant="light">
                Discuss your project
              </ButtonLink>
              <a href="#services" className="group inline-flex items-center gap-3 text-[0.9375rem] font-medium text-ivory">
                <span className="link-rule pb-1">Explore services</span>
                <ArrowRight className="size-4 rotate-90 transition-transform duration-500 ease-out-expo group-hover:translate-y-1" />
              </a>
            </div>
          </div>
        </div>

        <div className="hero-chrome mt-12 flex items-end justify-between gap-6 border-t border-ivory/20 pt-5 text-label text-ivory/70 lg:mt-16">
          <span className="flex items-center gap-4">
            <span aria-hidden="true" className="scroll-cue relative block h-8 w-px overflow-hidden bg-ivory/20 after:absolute after:inset-0 after:bg-ivory" />
            Scroll
          </span>
          <span className="hidden text-right sm:block">
            <span className="text-ivory">Fig. 01</span> — {plate.caption}. {STUDY_NOTE}
          </span>
          <span className="sm:hidden">Fig. 01 — Rendered study</span>
        </div>
      </div>
    </section>
  );
}
