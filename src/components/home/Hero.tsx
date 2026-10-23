import { getImageProps } from "next/image";
import type { CSSProperties } from "react";
import { preload } from "react-dom";
import { coverWidthByHeight, heroLayers, plateNote, plates } from "@/content/imagery";

const sub = ["Beautifully designed.", "Precisely engineered."];

const plate = plates.terrace;
/** Phones held upright get the tall crop (cut around the umbrella, 55% across); every wider screen the whole picture. Keep in step with the tall rules in globals.css ("Hero"). */
const TALL = "(max-aspect-ratio: 3/5)";
/** The house grows 8% as the page scrolls (heroState). */
const GROW = 1.08;

/**
 * Opening: a full-bleed client rendering in three planes. Behind, the sky;
 * then the name, set very large; in front of it the rendering itself, masked
 * by its matte to the house, the pine, the trees and the ground (docs/
 * IMAGES.md, "The hero's layers"), so the roof's peak hides the foot of the
 * letters beneath it, as if the name stood behind the house. The stylesheet
 * places the name from the picture's geometry (globals.css, "Hero"): the
 * peak always falls under R, M, I or T, the chimney never hides a letter.
 * Each plane carries the same graded veil (darker at the top for the header
 * and at the bottom for the statement, open across the glazing), and the
 * statement sits at the bottom left. Phones held upright get tall crops of
 * the same pictures, so they fetch the slices they show (art direction: one
 * <picture> a plane, so only one file of each ever loads).
 *
 * Load: the preloader's iris opens from the GTA dot onto the picture, whose
 * planes settle from 112% around that point; the name rises out of its mask
 * at 0.45s, the statement's lines from 0.85s (globals.css, "Hero"). After a
 * page transition the same entrance runs sooner. The preloader and the page
 * transition wait for both pictures and the matte.
 *
 * Pointer: with a fine pointer on the tracks the planes are drawn 4% larger,
 * and the house moves against the pointer while the sky moves with it, the
 * name holding still between them (HomeMotion, hero module).
 *
 * Scroll: a 250vh track holds the stage for 1.5 screens, and from half a
 * screen the intro's ivory sheet rises over it (Intro.tsx). The statement
 * and then the name leave upward through their own masks before the sheet
 * reaches them, while the picture recedes beneath it, each plane at its own
 * depth: the house drifts up, grows 8% and darkens, the sky drifts and grows
 * less (HomeMotion, hero module; heroState). The CSS entrance moves each
 * line's inner span, the scroll moves the [data-hero-roll] span around it,
 * so neither overrides the other.
 * Short screens, reduced motion and no JavaScript get the still opening,
 * with the name placed the same way.
 */
function HeroPicture({ src, tallSrc, alt }: { src: string; tallSrc: string; alt: string }) {
  const tall = plate.tall!;
  const common = { alt, fill: true, quality: 80, fetchPriority: "high", loading: "eager" } as const;
  const {
    props: { srcSet: tallSet, sizes: tallSizes },
  } = getImageProps({ ...common, src: tallSrc, sizes: coverWidthByHeight({ ...plate, ...tall }, "100vh", GROW) });
  const {
    props: { style, ...img },
  } = getImageProps({
    ...common,
    src,
    sizes: `(max-aspect-ratio: ${plate.width}/${plate.height}) ${coverWidthByHeight(plate, "100vh", GROW)}, ${GROW * 100}vw`,
  });
  return (
    <picture>
      <source media={TALL} srcSet={tallSet} sizes={tallSizes} />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- the props come from next/image (getImageProps), alt included */}
      <img {...img} style={{ ...style, objectFit: "cover" }} />
    </picture>
  );
}

/** The veil every plane carries, and the darkening the scroll brings (HomeMotion). */
function Grade() {
  return (
    <>
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0.55)_0%,rgb(0_0_0/0.28)_38%,rgb(0_0_0/0.32)_62%,rgb(0_0_0/0.7)_100%)]" />
      <div data-hero-dim="" aria-hidden="true" className="absolute inset-0 bg-black opacity-0" />
    </>
  );
}

export function Hero() {
  // CSS masks are fetched in CORS mode, so the preloads say so too (and are used, not fetched twice). Until its matte arrives the house is not drawn at all.
  preload(heroLayers.matte.src, { as: "image", crossOrigin: "anonymous", fetchPriority: "high", media: `not all and ${TALL}` });
  preload(heroLayers.matte.tall, { as: "image", crossOrigin: "anonymous", fetchPriority: "high", media: TALL });
  const matte = { "--matte": `url(${heroLayers.matte.src})`, "--matte-tall": `url(${heroLayers.matte.tall})` } as CSSProperties;
  return (
    <section data-home-hero="" data-tone="dark" aria-labelledby="hero-heading" className="relative h-svh min-h-[34rem] tracks:h-[250vh]">
      <div data-hero-stage="" className="hero-stage sticky top-0 isolate h-svh min-h-[34rem] overflow-hidden bg-charcoal-950 text-ivory">
        <div data-hero-layer="far" aria-hidden="true" className="hero-layer">
          <div data-hero-plate="" className="hero-plate">
            <HeroPicture src={heroLayers.sky.src} tallSrc={heroLayers.sky.tall} alt="" />
            <Grade />
          </div>
        </div>

        <h1 id="hero-heading" data-hero-heading="" className="hero-name font-wordmark leading-[0.92] tracking-[-0.015em] whitespace-nowrap uppercase">
          <span className="split-line hero-heading-line">
            <span data-hero-roll="" className="block">
              <span className="split-line__inner">PermitGuys</span>
            </span>
          </span>
          <span className="sr-only"> — architecture, engineering and permit drawings in the Greater Toronto Area</span>
        </h1>

        <div data-hero-layer="near" data-hero-image="" className="hero-layer">
          <div data-hero-plate="" data-hero-matte="" className="hero-plate hero-plate--near" style={matte}>
            <HeroPicture src={plate.src} tallSrc={plate.tall!.src} alt={plate.alt} />
            <Grade />
          </div>
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
            {plateNote(plate)}
          </p>
        </div>
      </div>
    </section>
  );
}
