import Image from "next/image";
import type { CSSProperties } from "react";
import { coverWidth, plates, type Plate } from "@/content/imagery";
import { escapeHtml } from "@/lib/html";
import { wordmarkInHtml } from "@/content/wordmark";
import { introPhases } from "@/lib/motion/home";
import { logoHeight, municipalities, type Municipality } from "@/content/recognition";

/** The municipalities as a sentence, in the order of their marks: "A, B and C". */
const places = municipalities.map((m) => m.place);
const placeList = `${places.slice(0, -1).join(", ")} and ${places[places.length - 1]}`;

/** A municipality's mark in its cell, as a fraction of the cell's height: drawn at a weight like its neighbours' (logoHeight). */
function markHeight(m: Municipality) {
  return `${(logoHeight(m, 0.62, 0.22, 0.5) * 100).toFixed(1)}%`;
}

/** The paragraphs that roll in and out beside the frame; the last, naming the municipalities, keeps their marks in the frame. */
const copy = [
  "PermitGuys is an architecture and engineering firm in Oakville, working with homeowners, landlords and businesses across the Greater Toronto Area.",
  "From a deck in the backyard to a custom home or a tenant fit-out on a main street, one team handles the design, the engineering and the drawings for the permit.",
  `We work with the building departments of ${placeList}.`,
];

/** One client rendering for each paragraph before the last: a traditional and a contemporary house, neither shown again before Values. */
const renderings: Plate[] = [plates.redBrick, plates.brick];

/** The frame is 4:3 on wide screens, as the renderings nearly are, and square on phones. */
const FRAME_ASPECT = 4 / 3;

const captions = [...renderings.map(() => "Rendering of a client project."), "Municipalities we work with."];

/**
 * The introduction: an ivory sheet that rises over the pinned hero (its
 * flow top sits a screen up, inside the hero's track) and then pins for the
 * length of the copy (introPhases). The statement is set large on the left,
 * one paragraph at a time rising through its masks; on the right one framed
 * picture at a time, a client rendering for each of the first two and, for
 * the last, the marks of the municipalities the firm works with, set in a
 * hairline grid. Each change of picture wipes up from the frame's lower
 * edge as the text changes over, and the picture inside closes in very
 * slowly while it is read. A short hairline per paragraph fills under the
 * copy as it is read. All of it is scrubbed by scroll (HomeMotion, intro
 * module), so it runs backwards on the way up; on phones the frame sits
 * above the copy.
 *
 * The pictures are decoration here, so the frame is hidden from assistive
 * technology; the paragraphs are the content (the last names every
 * municipality). Without the tracks the paragraphs stand one above the
 * other with the frame's panels in a quiet column beside or below them.
 */
export function Intro() {
  const { sectionVh } = introPhases(copy.length);
  return (
    <section
      data-intro=""
      aria-labelledby="intro-heading"
      className="intro-section relative tracks:z-10 tracks:-mt-[100vh] tracks:h-(--intro-h)"
      style={{ "--intro-h": `${sectionVh}vh` } as CSSProperties}
    >
      <div data-intro-stage="" className="intro-stage">
        <div className="intro-grid">
          <div className="intro-text">
            <h2 id="intro-heading" className="intro-eyebrow text-label text-ink-muted">
              <span className="intro-eyebrow__dot" aria-hidden="true" />
              About the firm
            </h2>
            <div className="intro-copies">
              {copy.map((text, i) => (
                <p
                  key={i}
                  data-intro-copy=""
                  className="intro-copy font-display font-light text-ink"
                  dangerouslySetInnerHTML={{ __html: wordmarkInHtml(escapeHtml(text)) }}
                />
              ))}
            </div>
            <div className="intro-ticks" aria-hidden="true">
              {copy.map((_, i) => (
                <span key={i} className="intro-tick">
                  <span data-intro-tick="" className="intro-tick__fill" />
                </span>
              ))}
            </div>
          </div>

          <figure aria-hidden="true" className="intro-figure">
            <div className="intro-frame">
              {renderings.map((plate, k) => (
                <div key={plate.src} data-frame-slide={k} className="intro-slide">
                  <div data-frame-inner="" className="intro-slide__inner">
                    <Image
                      src={plate.src}
                      alt=""
                      fill
                      sizes={`(max-aspect-ratio: 4/5) ${coverWidth(plate, 1, "92vw", 1.15)}, ${coverWidth(plate, FRAME_ASPECT, "48vw", 1.15)}`}
                      quality={80}
                      className="object-cover"
                      style={{ objectPosition: plate.focus }}
                    />
                  </div>
                </div>
              ))}
              <div data-frame-slide={renderings.length} className="intro-slide intro-slide--marks">
                <div data-frame-inner="" className="intro-slide__inner">
                  <ul className="intro-marks">
                    {municipalities.map((m) => (
                      <li key={m.src} data-frame-mark="" className="intro-mark">
                        {/* eslint-disable-next-line @next/next/no-img-element -- small vector and line-art marks, drawn as they are */}
                        <img src={m.src} alt="" width={m.width} height={m.height} loading="lazy" decoding="async" className="intro-mark__img" style={{ height: markHeight(m) }} />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <figcaption className="intro-captions text-label text-ink-muted">
              {captions.map((text, k) => (
                <span key={k} data-frame-caption={k} className="intro-caption">
                  {text}
                </span>
              ))}
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
