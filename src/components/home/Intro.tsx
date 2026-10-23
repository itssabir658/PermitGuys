import Image from "next/image";
import type { CSSProperties } from "react";
import { coverWidth, plates, type Plate } from "@/content/imagery";
import { escapeHtml } from "@/lib/html";
import { introPhases } from "@/lib/motion/home";

/** The two paragraphs that cut in and out at the centre. */
const copy = [
  "PermitGuys is a permit drawing and consulting practice based in Oakville, working with homeowners, landlords and businesses across the Greater Toronto Area.",
  "We prepare permit drawings and application documents, and support you through the municipality’s review, from a deck in the backyard to a tenant fit-out on a main street.",
];

/** Orbit slots 0 to 5, clockwise from the top centre (ORBIT_SLOTS): six client projects, none of them shown again before Values. */
const renderings: Plate[] = [plates.redBrick, plates.greenBatten, plates.farmhouse, plates.narrow, plates.brick, plates.whiteBatten];

/**
 * The introduction: an ivory sheet that rises over the pinned hero (its
 * flow top sits a screen up, inside the hero's track, from 0.5 to 1.5
 * screens) and then pins for the length of the copy (510vh for two
 * paragraphs; introPhases). Six client renderings glide in from beyond the
 * frame as the sheet rises and travel one squircle path, spaced by its arc
 * length so they never crowd, while the paragraphs rise through their
 * masks at the centre one after the other. At the end the ring is flung
 * outward as the stage releases. All of it is scrubbed by scroll
 * (HomeMotion, intro module), so it runs backwards on the way up.
 *
 * The images are decoration here, so they are hidden from assistive
 * technology; the paragraphs are the content. Without the tracks the
 * paragraphs stand one above the other, with the pictures as a quiet row
 * beneath them. The tiles are square, so each picture is fetched as wide as
 * it is drawn at the tile's height.
 */
export function Intro() {
  const { sectionVh } = introPhases(copy.length);
  return (
    <section
      data-intro=""
      aria-labelledby="intro-heading"
      className="relative tracks:z-10 tracks:-mt-[100vh] tracks:h-(--intro-h)"
      style={{ "--intro-h": `${sectionVh}vh` } as CSSProperties}
    >
      <h2 id="intro-heading" className="sr-only">
        About PermitGuys
      </h2>
      <div data-intro-stage="" className="relative isolate flex flex-col overflow-hidden tracks:sticky tracks:top-0 tracks:h-svh tracks:bg-ivory tracks:shadow-[0_-2rem_3rem_-1.5rem_rgb(0_0_0/0.4)]">
        <ul aria-hidden="true" className="intro-orbit order-2">
          {renderings.map((plate, i) => (
            <li key={plate.src} data-orbit-slot={i} className="intro-orbit__item">
              <Image
                data-orbit-img=""
                src={plate.src}
                alt=""
                fill
                sizes={`(max-width: 767px) ${coverWidth(plate, 1, "34vw")}, ${coverWidth(plate, 1, "26vh")}`}
                quality={75}
                className="object-cover"
                style={{ objectPosition: plate.focus }}
              />
            </li>
          ))}
        </ul>

        <div className="relative z-10 mx-auto grid max-w-site gap-14 px-5 py-32 sm:px-8 lg:px-12 tracks:absolute tracks:inset-0 tracks:block tracks:py-0">
          {copy.map((text, i) => (
            <p
              key={i}
              data-intro-copy=""
              className="intro-copy mx-auto max-w-[19ch] text-center font-display text-[clamp(1.65rem,0.9rem+2.6vw,3.4rem)] leading-[1.1] font-light tracking-[-0.035em] text-ink sm:max-w-[24ch]"
              dangerouslySetInnerHTML={{ __html: escapeHtml(text) }}
            />
          ))}
        </div>

        <p data-intro-caption="" className="absolute inset-x-0 bottom-6 z-10 px-5 text-center text-label text-ink-muted lg:bottom-8">
          Renderings of client projects.
        </p>
      </div>
    </section>
  );
}
