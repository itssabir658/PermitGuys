import Image from "next/image";
import type { CSSProperties } from "react";
import { coverWidth, plates, type Plate } from "@/content/imagery";
import { escapeHtml } from "@/lib/html";
import { wordmarkInHtml } from "@/content/wordmark";
import { introPhases } from "@/lib/motion/home";
import { logoHeight, municipalities, type Municipality } from "@/content/recognition";
import { IntroMap } from "./IntroMap";

/** The municipalities as a sentence, in the order of their marks: "A, B and C". */
const places = municipalities.map((m) => m.place);
const placeList = `${places.slice(0, -1).join(", ")} and ${places[places.length - 1]}`;

/** A municipality's mark in the sliding row, in rem: drawn at a weight like its neighbours' (logoHeight). */
function markHeight(m: Municipality) {
  return `${logoHeight(m, 2.9, 1.35, 3.1).toFixed(3)}rem`;
}

/** The paragraphs that roll in and out beside the frame; the last, naming the municipalities, has the map of the firm's projects in the frame. */
const copy = [
  "PermitGuys is an architecture and engineering firm in Oakville, working with homeowners and businesses across the Greater Toronto Area.",
  "From a deck in the backyard to a custom home or a tenant fit-out on a commercial unit, one team handles the design, the engineering and the drawings for the permit.",
  `We work with the building departments of ${placeList}.`,
];

/** One client rendering for each paragraph before the last: a traditional and a contemporary house, neither shown anywhere else on the site but the projects page. */
const renderings: Plate[] = [plates.redBrick, plates.brick];

/** The frame is 4:3 on wide screens, as the renderings nearly are, and square on phones. */
const FRAME_ASPECT = 4 / 3;

const captions = [...renderings.map(() => "Rendering of a client project."), "Our client projects across the GTA."];

/**
 * The introduction: an ivory sheet that rises over the pinned hero (its
 * flow top sits a screen up, inside the hero's track) and then pins for the
 * length of the copy (introPhases). The statement is set large on the left,
 * one paragraph at a time rising through its masks; on the right one framed
 * picture at a time, a client rendering for each of the first two and, for
 * the last, the map of the firm's projects (IntroMap). Under both, the
 * marks of the municipalities it works with slide past in an endless row
 * (a CSS marquee, still for reduced motion). Each change of picture wipes up from the frame's lower
 * edge as the text changes over, and the picture inside closes in very
 * slowly while it is read. A short hairline per paragraph fills under the
 * copy as it is read. All of it is scrubbed by scroll (HomeMotion, intro
 * module), so it runs backwards on the way up; on phones the frame sits
 * above the copy.
 *
 * The renderings and captions are decoration here, so they are hidden from
 * assistive technology; the paragraphs are the content (the last names
 * every municipality), and the map is a labelled region. Without the
 * tracks the paragraphs stand one above the other with the frame's panels
 * in a quiet column beside or below them, and the marks stand still.
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

          <figure className="intro-figure">
            <div className="intro-frame">
              {renderings.map((plate, k) => (
                <div key={plate.src} data-frame-slide={k} aria-hidden="true" className="intro-slide">
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
              <div data-frame-slide={renderings.length} data-frame-flat="" className="intro-slide intro-slide--map">
                <div data-frame-inner="" className="intro-slide__inner">
                  <IntroMap />
                </div>
              </div>
            </div>
            <figcaption aria-hidden="true" className="intro-captions text-label text-ink-muted">
              {captions.map((text, k) => (
                <span key={k} data-frame-caption={k} className="intro-caption">
                  {text}
                </span>
              ))}
            </figcaption>
          </figure>
        </div>

        <div className="intro-marquee">
          <ul aria-label="Municipalities we work with" className="intro-marquee__track">
            {[0, 1].map((copyNo) =>
              municipalities.map((m) => (
                <li key={`${copyNo}-${m.src}`} aria-hidden={copyNo === 1 || undefined} className="intro-marquee__item">
                  {/* eslint-disable-next-line @next/next/no-img-element -- small vector and line-art marks, drawn as they are */}
                  <img src={m.src} alt="" width={m.width} height={m.height} loading="lazy" decoding="async" className="intro-marquee__mark" style={{ height: markHeight(m) }} />
                  {copyNo === 0 ? <span className="sr-only">{m.name}</span> : null}
                </li>
              )),
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
