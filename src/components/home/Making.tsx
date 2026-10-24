import Image from "next/image";
import type { CSSProperties } from "react";
import { Container } from "@/components/ui/Container";
import { site } from "@/content/site";
import { MK_H, MK_W, mkCallouts, mkElevation, mkPlan, mkSite, mkStructure } from "@/content/making-drawing";
import { escapeHtml } from "@/lib/html";
import { makingSectionVh } from "@/lib/motion/home";

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
const view = `0 0 ${MK_W} ${MK_H}`;
/** The sheet's border and its title block's frame, in the board's units (the block itself is HTML, .mk-title). */
const sheetD = (() => {
  const r = (x1: number, y1: number, x2: number, y2: number) => `M${x1} ${y1}L${x2} ${y1}M${x2} ${y1}L${x2} ${y2}M${x2} ${y2}L${x1} ${y2}M${x1} ${y2}L${x1} ${y1}`;
  return r(36, 36, MK_W - 36, MK_H - 36) + r(56, 56, MK_W - 56, MK_H - 56);
})();
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
                  <Image src={day.src} alt="" fill sizes={sizes} quality={78} />
                </div>
                <div data-mk-fade="dusk" className="mk-pic">
                  <Image
                    src={dusk.src}
                    alt="Rendering of a large contemporary house from the front at dusk: white stucco volumes framed in dark panels, a timber-clad strip, tall lit windows, a tall timber pivot door and two cars on the driveway."
                    fill
                    sizes={sizes}
                    quality={78}
                  />
                  <video data-mk-film="" className="mk-film" aria-hidden="true" muted playsInline preload="none" poster={dusk.src} disablePictureInPicture>
                    <source src="/videos/making/front-dusk-1080.mp4" type='video/mp4; codecs="avc1.640032"' media="(min-width: 1024px)" />
                    <source src="/videos/making/front-dusk-1080.webm" type='video/webm; codecs="vp9"' media="(min-width: 1024px)" />
                    <source src="/videos/making/front-dusk-720.mp4" type='video/mp4; codecs="avc1.64001f"' />
                    <source src="/videos/making/front-dusk-720.webm" type='video/webm; codecs="vp9"' />
                  </video>
                </div>
                <div data-mk-fade="glass" className="mk-pic" aria-hidden="true">
                  <Image src={glass.src} alt="" fill sizes={sizes} quality={78} />
                </div>
                <div data-mk-fade="veil" className="mk-veil" />

                <svg data-mk-fade="site" data-mk-zoom="" className="mk-svg" viewBox={view} aria-hidden="true">
                  <path data-mk-fade="siteHouse" className="mk-poche" d={mkSite.house} />
                  <path data-mk-draw="siteFine" className="mk-hair" d={mkSite.fine} />
                  <path data-mk-draw="siteWays" className="mk-thin" d={mkSite.ways} />
                  <path data-mk-draw="siteLot" className="mk-heavy" d={mkSite.lot} />
                  <g data-mk-fade="siteLabels">
                    {mkSite.labels.map((l) => (
                      <text key={l.text} x={l.x} y={l.y}>
                        {l.text}
                      </text>
                    ))}
                  </g>
                </svg>

                <svg data-mk-fade="plan" className="mk-svg" viewBox={view} aria-hidden="true">
                  <path data-mk-fade="planPoche" className="mk-poche" d={mkPlan.poche} />
                  <path data-mk-fade="planPoche" className="mk-cut" d={mkPlan.cuts} />
                  <path data-mk-draw="planWalls" className="mk-mid" d={mkPlan.walls} />
                  <path data-mk-draw="planOpenings" className="mk-thin" d={mkPlan.openings} />
                  <path data-mk-draw="planDoors" className="mk-hair" d={mkPlan.doors} />
                  <path data-mk-draw="planFittings" className="mk-hair" d={mkPlan.fittings} />
                  <g data-mk-fade="planLabels">
                    {mkPlan.labels.map((l, i) => (
                      <text key={i} x={l.x} y={l.y}>
                        {l.text}
                      </text>
                    ))}
                  </g>
                </svg>

                <svg data-mk-fade="lines" className="mk-svg" viewBox={view} aria-hidden="true">
                  <path data-mk-draw="elevJoints" className="mk-hair" d={mkElevation.joints} />
                  <path data-mk-draw="elevMullions" className="mk-thin" d={mkElevation.mullions} />
                  <path data-mk-draw="elevOpenings" className="mk-mid" d={mkElevation.openings} />
                  <path data-mk-draw="elevPanels" className="mk-mid" d={mkElevation.panels} />
                  <path data-mk-draw="elevOutline" className="mk-heavy" d={mkElevation.outline} />
                  <path data-mk-draw="elevGround" className="mk-heavy" d={mkElevation.ground} />
                </svg>

                <svg data-mk-fade="eng" className="mk-svg" viewBox={view} aria-hidden="true">
                  <path data-mk-draw="engHidden" className="mk-red-hidden" d={mkStructure.hidden} />
                  <path data-mk-draw="engSolid" className="mk-red" d={mkStructure.solid} />
                  {/* The callouts in two layouts, one shown for the board's width (globals.css). */}
                  <g data-mk-fade="engLabels">
                    {(["wide", "narrow"] as const).map((k) => (
                      <g key={k} className={`mk-callouts mk-callouts--${k}`}>
                        <path className="mk-red-hidden" d={mkCallouts[k].d} />
                        {mkCallouts[k].labels.map((l) => (
                          <text key={l.text} x={l.x} y={l.y} className="mk-eng-label">
                            {l.text}
                          </text>
                        ))}
                      </g>
                    ))}
                  </g>
                </svg>

                <svg data-mk-fade="sheet" className="mk-svg" viewBox={view} aria-hidden="true">
                  <path data-mk-draw="sheet" className="mk-mid" d={sheetD} />
                </svg>
                <div data-mk-fade="title" aria-hidden="true" className="mk-title">
                  <div className="mk-title__mark">
                    <p className="mk-title__brand font-wordmark">{site.name}</p>
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
      </div>
    </section>
  );
}
