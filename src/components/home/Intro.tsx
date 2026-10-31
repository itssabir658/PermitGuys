import Image from "next/image";
import type { CSSProperties } from "react";
import { coverWidth, plates, type Plate } from "@/content/imagery";
import { escapeHtml } from "@/lib/html";
import { wordmarkInHtml } from "@/content/wordmark";
import { introPhases } from "@/lib/motion/home";
import { logoHeight, municipalities, type Municipality } from "@/content/recognition";

/** The municipalities as a sentence, in the order of their seals: "A, B and C". */
const places = municipalities.map((m) => m.place);
const placeList = `${places.slice(0, -1).join(", ")} and ${places[places.length - 1]}`;

/**
 * A logo's box inside its seal, as fractions of the seal's diameter: drawn
 * at a weight like its neighbours' (logoHeight), and no wider than the
 * circle allows at that height.
 */
function sealMark(m: Municipality) {
  const aspect = m.width / m.height;
  const h = Math.min(logoHeight(m, 0.66, 0.15, 0.42), 0.7 / aspect);
  return { width: `${(h * aspect * 100).toFixed(2)}%`, height: `${(h * 100).toFixed(2)}%` };
}

/** The paragraphs that cut in and out at the centre; with the last, the ring turns to the municipalities' seals. */
const copy = [
  "PermitGuys is an architecture and engineering firm in Oakville, working with homeowners, landlords and businesses across the Greater Toronto Area.",
  "From a deck in the backyard to a custom home or a tenant fit-out on a main street, one team handles the design, the engineering and the drawings for the permit.",
  `We work with the building departments of ${placeList}.`,
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
 * With the last paragraph, which names the municipalities the firm works
 * with, the ring turns: a wave runs round it from the top, each picture
 * shrinking away as a round seal opens in its place, the logo of one of
 * those municipalities in the ink of the page (SEALS). The seals travel
 * the ring and are flung out with it at the end.
 *
 * The images are decoration here, so they are hidden from assistive
 * technology; the paragraphs are the content. Without the tracks the
 * paragraphs stand one above the other, with the pictures and then the
 * seals as quiet rows beneath them; the paragraph names every municipality,
 * so the seals are left out of the reading too. The tiles are square, so each picture is fetched as wide as
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

        <ul aria-hidden="true" className="intro-orbit intro-seals order-3">
          {municipalities.map((m, i) => (
            <li key={m.src} data-seal={i} className="intro-seal">
              {/* eslint-disable-next-line @next/next/no-img-element -- small vector and line-art marks, drawn as they are */}
              <img
                src={m.src}
                alt=""
                width={m.width}
                height={m.height}
                loading="lazy"
                decoding="async"
                className="intro-seal__mark"
                style={sealMark(m)}
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
              dangerouslySetInnerHTML={{ __html: wordmarkInHtml(escapeHtml(text)) }}
            />
          ))}
        </div>

        <p data-intro-caption="" className="absolute inset-x-0 bottom-6 z-10 px-5 text-center text-label text-ink-muted lg:bottom-8">
          Renderings of client projects.
        </p>
        <p data-seals-caption="" aria-hidden="true" className="absolute inset-x-0 bottom-6 z-10 hidden px-5 text-center text-label text-ink-muted opacity-0 lg:bottom-8 tracks:block">
          Municipalities we work with.
        </p>
      </div>
    </section>
  );
}
