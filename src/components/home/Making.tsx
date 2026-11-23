import Image from "next/image";
import type { CSSProperties } from "react";
import { Container } from "@/components/ui/Container";
import { escapeHtml } from "@/lib/html";
import { makingSectionVh } from "@/lib/motion/home";
import { Wordmark } from "@/components/ui/Wordmark";
import { MakingDrawings } from "./MakingDrawings";

/** The five chapters: what the firm does at each stage of the house, never a promise of the municipality's decision. */
const chapters = [
  {
    name: "Site",
    title: "It starts with the land.",
    body: "We study the lot first: its shape, its trees, where the light falls and what the zoning allows on it.",
  },
  {
    name: "Plans",
    title: "Rooms around the way you live.",
    body: "The floor plans place every room, stair, door and window around how your household lives.",
  },
  {
    name: "Design",
    title: "Proportion, material and light.",
    body: "Elevations set the house’s proportions, and renderings show its stucco, timber and glass, by day and lit at night, before anything is built.",
  },
  {
    name: "Engineering",
    title: "Engineered to be built as drawn.",
    body: "Beams, posts and footings are worked out with the architecture, so the design holds up as drawn.",
  },
  {
    name: "Permit",
    title: "One set, ready for the permit.",
    body: "Every drawing is coordinated into one set for your building permit application, with our help on any comments the municipality raises.",
  },
];

const pad = (n: number) => String(n).padStart(2, "0");
const day = { src: "/images/projects/making/front-day.jpg", width: 2560, height: 1440 };
const dusk = { src: "/images/projects/making/front-dusk.jpg", width: 2560, height: 1440 };
const glass = { src: "/images/projects/making/front-glass.webp", width: 2560, height: 1440 };
const sizes = "(min-width: 768px) and (min-aspect-ratio: 1/1) 62vw, 100vw";

/**
 * The making of a house: one client house, the big contemporary house the
 * homepage opens on, followed through the firm's whole cycle, from its
 * site to its permit set, between Selected projects and the values.
 *
 * One board, the shape of the house's front view, holds every stage
 * (src/content/making-drawing.ts): the site plan, drawn in until its house
 * is the floor plan; the front elevation, traced from the rendering, so
 * the lit windows and then the rendering itself come up in its lines; the
 * structure over a paper veil; the sheet's border and title block; and the
 * house again, at dusk, where a short film animated from the rendering
 * (a slow push in) plays once.
 *
 * Tracks: an 820vh track with one pinned stage (MAKING in
 * src/lib/motion/home.ts; HomeMotion, making module). Drawings are drafted
 * a segment at a time and layers fade, a chapter at a time; beside the
 * board the chapters' lines roll through their masks, and the contents
 * mark the chapter being told.
 *
 * Without the tracks (reduced motion, short screens, no JavaScript, print)
 * the chapters are a list beside the house at dusk.
 */
export function Making() {
  return (
    <section
      data-making=""
      aria-labelledby="making-heading"
      className="mk relative tracks:h-(--mk-h)"
      style={{ "--mk-h": `${makingSectionVh()}vh` } as CSSProperties}
    >
      <div data-mk-stage="" className="mk-stage">
        <Container className="mk-layout">
          <div className="mk-label">
            <h2 id="making-heading" className="text-label text-ink">
              <span className="split-line">
                <span data-label-roll="" className="block">
                  The making of a house
                </span>
              </span>
            </h2>
            <p className="mk-note mt-3 text-[0.8125rem] leading-relaxed text-ink-muted sm:text-[0.875rem]">
              <span className="split-line">
                <span data-label-roll="" className="block">
                  One client home, from its site to the permit drawings.
                </span>
              </span>
            </p>
          </div>

          <figure className="mk-figure">
            <div data-mk-frame="" className="mk-frame">
              <div data-mk-board="" className="mk-board">
                <div data-mk-fade="day" className="mk-pic" aria-hidden="true">
                  <Image
                    src={day.src}
                    alt="Rendering of a large contemporary house straight on from the front in daylight: white stucco volumes framed in dark panels, a timber-clad strip, tall windows, a tall timber pivot door and two cars on the driveway."
                    fill sizes={sizes} quality={78} />
                </div>
                <div data-mk-fade="dusk" className="mk-pic">
                  <Image
                    src={dusk.src}
                    alt="Rendering of a large contemporary house from the front at dusk: white stucco volumes framed in dark panels, a timber-clad strip, tall lit windows, a tall timber pivot door and two cars on the driveway."
                    fill
                    sizes={sizes}
                    quality={78}
                  />
                  {/* No poster: the still under it shows until the film plays, and a poster would fetch the full-size JPEG on every visit. */}
                  <video data-mk-film="" className="mk-film" aria-hidden="true" muted playsInline preload="none" disablePictureInPicture>
                    <source src="/videos/making/front-dusk-1080.mp4" type='video/mp4; codecs="avc1.640032"' media="(min-width: 1024px)" />
                    <source src="/videos/making/front-dusk-1080.webm" type='video/webm; codecs="vp9"' media="(min-width: 1024px)" />
                    <source src="/videos/making/front-dusk-720.mp4" type='video/mp4; codecs="avc1.64001f"' />
                    <source src="/videos/making/front-dusk-720.webm" type='video/webm; codecs="vp9"' />
                  </video>
                </div>
                <div data-mk-fade="glass" className="mk-pic" aria-hidden="true">
                  <Image src={glass.src} alt="The lit windows of the contemporary house at dusk, shown on their own over the front elevation drawing." fill sizes={sizes} quality={78} />
                </div>
                <div data-mk-fade="veil" className="mk-veil" />

                <MakingDrawings />
                <div data-mk-fade="title" aria-hidden="true" className="mk-title">
                  <div className="mk-title__mark">
                    <p className="mk-title__brand">
                      <Wordmark />
                    </p>
                    <p className="mk-title__label">Architects</p>
                  </div>
                  <div>
                    <p className="mk-title__label">Project</p>
                    <p>Contemporary house</p>
                  </div>
                  <div className="mk-title__set">
                    <p className="mk-title__label">Set</p>
                    <p>Site · Plans · Elevations · Structure</p>
                  </div>
                  <div>
                    <p className="mk-title__label">Issued</p>
                    <p className="mk-title__issued">For building permit</p>
                  </div>
                </div>
              </div>
            </div>
            <figcaption data-mk-caption="" className="mk-caption text-label text-pretty text-ink-muted">
              Renderings and a film of a client project<span className="max-sm:hidden">. The site, plan and structure are drawn to illustrate each stage</span>.
            </figcaption>
          </figure>

          <ol aria-hidden="true" className="mk-toc">
            {chapters.map((c, i) => (
              <li key={c.name} data-mk-toc={i} className="mk-toc__item">
                <span className="mk-toc__bar">
                  <span data-mk-fill="" className="mk-toc__fill" />
                </span>
                <span className="mk-toc__num tabular-nums">{pad(i + 1)}</span>
                <span className="mk-toc__name">{c.name}</span>
              </li>
            ))}
          </ol>

          <ol className="mk-chapters">
            {chapters.map((c, i) => (
              <li key={c.name} data-mk-chapter={i} className="mk-chapter">
                <p className="mk-chapter__label text-label text-ink-muted">
                  <span className="split-line">
                    <span data-mk-roll="" className="block">
                      {pad(i + 1)} · {c.name}
                    </span>
                  </span>
                </p>
                <h3 data-mk-title="" className="mk-chapter__title mt-3 font-display font-light text-ink" dangerouslySetInnerHTML={{ __html: escapeHtml(c.title) }} />
                <p data-mk-body="" className="mk-chapter__body mt-4 text-ink-muted" dangerouslySetInnerHTML={{ __html: escapeHtml(c.body) }} />
              </li>
            ))}
          </ol>
        </Container>
        {/* Night falling over the released stage as Services' sheet rises over it (HomeMotion, making handover). */}
        <div data-mk-shade="" className="mk-shade" aria-hidden="true" />
      </div>
    </section>
  );
}
