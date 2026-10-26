import { getImageProps } from "next/image";
import type { CSSProperties } from "react";
import { coverWidthByHeight, heroLayers, plateNote, plates } from "@/content/imagery";

const sub = ["Beautifully designed.", "Precisely engineered."];

const plate = plates.terrace;
const tall = plate.tall!;
/** Phones held upright get the tall crop (cut around the umbrella, 55% across); every wider screen the whole picture. Keep in step with the tall rules in globals.css ("Hero"). */
const TALL = "(max-aspect-ratio: 3/5)";
/** The house grows 8% as the page scrolls (heroState). */
const GROW = 1.08;
/** How wide each crop is drawn: to the stage's height (8% over, for the scroll's growth), or the whole picture to the width of a stage wider than it. */
const sizes = {
  wide: `(max-aspect-ratio: ${plate.width}/${plate.height}) ${coverWidthByHeight(plate, "100vh", GROW)}, ${GROW * 100}vw`,
  tall: coverWidthByHeight({ ...plate, ...tall }, "100vh", GROW),
};

/**
 * Opening: a full-bleed client rendering in two planes. Behind, the sky; in
 * front of it the rendering itself, cut out around the house, the pine, the
 * trees and the ground (docs/IMAGES.md, "The hero's layers"), so the two can
 * move at their own depths. Both pictures carry the same graded veil, drawn
 * into them (darker at the top for the header and at the bottom for the
 * statement, open across the glazing), and the statement sits at the bottom
 * left. The page's heading is for screen readers and search engines only
 * (Sebra took the big name off the picture, 26 October 2026). Phones held
 * upright get tall crops of the same pictures, so they fetch the slices
 * they show (art direction: one <picture> a plane, so only one file of each
 * ever loads).
 *
 * Each plane is one picture on its own layer, so moving it costs the screen
 * nothing but compositing: the cut-out is in the near picture's own alpha
 * (no CSS mask), the darkening the scroll brings is one overlay above both,
 * and the planes are kept as layers (globals.css, will-change) so a change
 * of scale never redraws them.
 *
 * Load: the preloader's iris opens from the GTA dot onto the picture, whose
 * planes settle from 112% around that point; the statement's lines rise
 * from 0.85s (globals.css, "Hero"). After a page transition the same
 * entrance runs sooner. The preloader and the page transition wait for both
 * pictures; should the house still be on its way when they open (a slow
 * connection), the sky waits for it too and both fade in together
 * (HomeMotion, hero module), as the sky plate alone is a half-built
 * background.
 *
 * Pointer: with a fine pointer on the tracks the planes are drawn 4% larger,
 * and the house moves against the pointer while the sky moves with it
 * (HomeMotion, hero module).
 *
 * Scroll: a 250vh track holds the stage for 1.5 screens, and from half a
 * screen the intro's ivory sheet rises over it (Intro.tsx). The statement
 * leaves upward through its masks before the sheet reaches it, while the
 * picture recedes beneath it, each plane at its own depth: the house drifts
 * up and grows 8%, the sky drifts and grows less, and both darken
 * (HomeMotion, hero module; heroState). The CSS entrance moves each line's
 * inner span, the scroll moves the [data-hero-roll] span around it, so
 * neither overrides the other.
 * Short screens, reduced motion and no JavaScript get the still opening.
 */

/** The far plane, through the image optimizer. */
function FarPicture() {
  const common = { alt: "", fill: true, quality: 80, fetchPriority: "high", loading: "eager" } as const;
  const {
    props: { srcSet: tallSet },
  } = getImageProps({ ...common, src: heroLayers.far.tall, sizes: sizes.tall });
  const {
    props: { style, ...img },
  } = getImageProps({ ...common, src: heroLayers.far.src, sizes: sizes.wide });
  return (
    <picture>
      <source media={TALL} srcSet={tallSet} sizes={sizes.tall} />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- the props come from next/image (getImageProps), alt included */}
      <img {...img} style={{ ...style, objectFit: "cover" }} />
    </picture>
  );
}

/** The near plane, served as it is (heroLayers): the cut-out at the picture's width, three quarters and half of it, and the tall crop. */
function NearPicture() {
  const { near } = heroLayers;
  const w = plate.width;
  return (
    <picture>
      <source media={TALL} type="image/webp" srcSet={`${near.tall} ${tall.width}w`} sizes={sizes.tall} />
      <img
        src={near.src}
        srcSet={`${near.half} ${w / 2}w, ${near.threeQuarter} ${w * 0.75}w, ${near.src} ${w}w`}
        sizes={sizes.wide}
        alt={plate.alt}
        fetchPriority="high"
        loading="eager"
        decoding="async"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", color: "transparent" }}
      />
    </picture>
  );
}

export function Hero() {
  return (
    <section data-home-hero="" data-tone="dark" aria-labelledby="hero-heading" className="relative h-svh min-h-[34rem] tracks:h-[250vh]">
      <div data-hero-stage="" className="hero-stage sticky top-0 isolate h-svh min-h-[34rem] overflow-hidden bg-charcoal-950 text-ivory">
        <div data-hero-layer="far" aria-hidden="true" className="hero-layer">
          <div data-hero-plate="" className="hero-plate">
            <FarPicture />
          </div>
        </div>

        <h1 id="hero-heading" className="sr-only">
          PermitGuys: architecture, engineering and permit drawings in the Greater Toronto Area
        </h1>

        <div data-hero-layer="near" data-hero-image="" className="hero-layer">
          <div data-hero-plate="" className="hero-plate">
            <NearPicture />
          </div>
        </div>

        {/* The darkening the scroll brings (HomeMotion), over both planes; invisible, so not drawn, until it darkens anything. */}
        <div data-hero-dim="" aria-hidden="true" className="pointer-events-none invisible absolute inset-0 bg-black opacity-0 will-change-[opacity]" />

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
