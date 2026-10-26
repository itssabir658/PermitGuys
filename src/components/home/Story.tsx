import Image from "next/image";
import type { CSSProperties } from "react";
import { Container } from "@/components/ui/Container";
import { plates } from "@/content/imagery";
import { site } from "@/content/site";
import { LINE_KINDS, STORY_H, STORY_W, storyGrid, storyLevels, storyLines, storyMembers } from "@/content/story-drawing";
import { escapeHtml } from "@/lib/html";
import { storySectionVh } from "@/lib/motion/home";
import { Wordmark } from "@/components/ui/Wordmark";

/** The four chapters: what happens to a project at each, never a promise of the municipality's decision. */
const chapters = [
  {
    name: "Vision",
    title: "Every project starts with an idea.",
    body: "We begin by listening: how you want to use the space, what the site allows and what matters most to you.",
  },
  {
    name: "Design",
    title: "Designed around you.",
    body: "Plans, elevations and details, shaped with you and refined until every line is right.",
  },
  {
    name: "Engineering",
    title: "Engineered to be built.",
    body: "Structure, framing and Building Code requirements are worked out with the design, not after it.",
  },
  {
    name: "Permit",
    title: "Ready for the building permit.",
    body: "A complete, coordinated set of drawings for your municipality’s review, with our help on any comments it raises.",
  },
];

const plate = plates.narrow;
const pad = (n: number) => String(n).padStart(2, "0");
const d = (s: readonly number[]) => `M${s[0]} ${s[1]}L${s[2]} ${s[3]}`;
/**
 * Lines of one sort are strokes of one path (the sketch's kinds, the grid,
 * the levels, the structure solid and hidden), so a frame that redraws the
 * drawing rewrites nine paths rather than two hundred.
 */
const kinds = LINE_KINDS.filter((k) => storyLines.some((l) => l.kind === k));
const lineD = (k: string) =>
  storyLines
    .filter((l) => l.kind === k)
    .map((l) => d(l.p))
    .join("");
const structureD = (hidden: boolean) =>
  storyMembers
    .filter((m) => m.hidden === hidden)
    .flatMap((m) => m.p.map(d))
    .join("");
/**
 * The markers (grid bubbles, level datums, labels) are drawn in screen px
 * inside a group scaled by the drawing's units per px, so they keep their
 * size whatever the sheet's: HomeMotion sets the scale once it has measured
 * the sheet. This one is for a sheet about 640px across.
 */
const UNITS_PER_PX = 4.4;
const mark = ([x, y]: readonly number[]) => `translate(${x} ${y}) scale(${UNITS_PER_PX})`;

/** A title block value: empty on the blank sheet, rolled in through its mask when the drawing is issued (block). */
function Field({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={`story-block__cell ${className ?? ""}`}>
      <p className="story-block__label">{label}</p>
      <p className="story-block__value split-line">
        <span data-story-field="" className="block">
          {value}
        </span>
      </p>
    </div>
  );
}

/**
 * The story: how a project moves through the firm, told with one client
 * house on one drawing sheet, between the introduction and Selected
 * projects.
 *
 * Tracks: a 580vh track with one pinned stage, 1.2 screens per chapter
 * (storyState in src/lib/motion/home.ts; HomeMotion, story module). The
 * sheet rises with the stage and the house's elevation is sketched on it
 * (Vision); the rendering wipes up from the ground line, the sketch giving
 * way to the picture as the edge passes (Design); trace rises over the
 * picture and the grid, levels and structure are drawn on it
 * (Engineering); the trace turns to paper, the lines come back in ink and
 * straighten into a true elevation, and the title block is filled in
 * (Permit). Beside the sheet the chapters' lines roll through their masks,
 * a chapter at a time, and the contents mark the one being told.
 *
 * The drawing is traced from the rendering (src/content/story-drawing.ts),
 * so every line lands on the picture's own edges. It and the engineering
 * are illustrations, and the caption says so; none of it is a measurement
 * of the project.
 *
 * Without the tracks (reduced motion, short screens, no JavaScript, print)
 * the chapters are a list beside a still sheet: the sketch over the left
 * half of the house and the rendering on the right.
 */
export function Story() {
  return (
    <section
      data-story=""
      aria-labelledby="story-heading"
      className="story relative tracks:h-(--story-h)"
      style={{ "--story-h": `${storySectionVh(chapters.length)}vh` } as CSSProperties}
    >
      <div data-story-stage="" className="story-stage">
        <Container className="story-layout">
          <div className="story-label">
            <h2 id="story-heading" className="text-label text-ink">
              <span className="split-line">
                <span data-label-roll="" className="block">
                  From idea to permit
                </span>
              </span>
            </h2>
            <p className="story-note mt-3 text-[0.8125rem] leading-relaxed text-ink-muted sm:text-[0.875rem]">
              <span className="split-line">
                <span data-label-roll="" className="block">
                  How we take a project from the first sketch to the permit drawings.
                </span>
              </span>
            </p>
          </div>

          <figure className="story-figure">
            {/* On portrait screens the room the sheet is fitted to (globals.css). */}
            <div className="story-frame">
              <div data-story-sheet="" className="story-sheet">
                <div data-story-plate="" className="story-plate">
                  <div data-story-render="" className="story-render">
                    <Image
                      src={plate.src}
                      alt={plate.alt}
                      fill
                      sizes="(min-width: 768px) and (min-aspect-ratio: 1/1) min(44rem, 76vh, 46vw), 92vw"
                      quality={80}
                      className="object-cover"
                    />
                  </div>
                  <div data-story-veil="" className="story-veil" />
                  <svg data-story-eng="" className="story-eng" viewBox={`0 0 ${STORY_W} ${STORY_H}`} aria-hidden="true">
                    <path data-story-axes="" className="story-eng__grid" d={storyGrid.map((a) => d(a.p)).join("")} />
                    <path data-story-levels="" className="story-eng__level" d={storyLevels.map((l) => d(l.p)).join("")} />
                    <g data-story-structure="">
                      <path data-story-members="solid" className="story-eng__member" d={structureD(false)} />
                      <path data-story-members="hidden" className="story-eng__member story-eng__member--hidden" d={structureD(true)} />
                    </g>
                    {/* The markers over the lines: a bubble or a datum interrupts any line it sits on. */}
                    {storyGrid.map((a) => (
                      <g key={a.label} data-story-bubble="" className="story-eng__bubble" transform={mark(a.pb)}>
                        <circle r="9" />
                        <text dy="0.36em">{a.label}</text>
                      </g>
                    ))}
                    {storyLevels.map((l) => (
                      <g key={l.label} data-story-datum="" className="story-eng__datum" transform={mark([l.p[0], l.p[1]])}>
                        <circle r="5" />
                        <path className="story-eng__datum-fill" d="M0 -5A5 5 0 0 1 5 0L0 0ZM0 5A5 5 0 0 1 -5 0L0 0Z" />
                        <text x="10" y="-5" className={l.short ? "story-eng__long" : undefined}>
                          {l.label}
                        </text>
                        {l.short ? (
                          <text x="10" y="-5" className="story-eng__short">
                            {l.short}
                          </text>
                        ) : null}
                      </g>
                    ))}
                    {storyMembers.map((m, i) =>
                      m.label ? (
                        <text key={i} data-story-member-label={i} className="story-eng__member-label" transform={mark(m.pl)}>
                          {m.label}
                        </text>
                      ) : null,
                    )}
                  </svg>
                  <svg data-story-lines="" className="story-lines" viewBox={`0 0 ${STORY_W} ${STORY_H}`} aria-hidden="true">
                    {kinds.map((k) => (
                      <path key={k} data-kind={k} d={lineD(k)} />
                    ))}
                  </svg>
                  <span data-story-scan="" aria-hidden="true" className="story-scan" />
                </div>

                <div data-story-block="" aria-hidden="true" className="story-block">
                  <div className="story-block__cell story-block__mark">
                    <p className="text-[1.3em] leading-none">
                      <Wordmark />
                    </p>
                    <p className="story-block__label mt-1.5">Architects</p>
                  </div>
                  <Field label="Project" value="Narrow contemporary house" className="story-block__project" />
                  <Field label="Drawing" value="Front elevation" className="story-block__drawing" />
                  <Field label="Sheet" value="A-201" className="story-block__sheet" />
                  <Field label="Issued" value="For building permit" className="story-block__status" />
                  {site.credentials[0] ? (
                    <div className="story-block__cell story-block__credential">
                      <p className="story-block__label">{site.credentials[0]}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            <figcaption data-story-caption="" className="story-caption mt-3 text-label text-pretty text-ink-muted">
              Rendering of a client project, with linework drawn over it for illustration.
            </figcaption>
          </figure>

          <ol aria-hidden="true" className="story-toc">
            {chapters.map((c, i) => (
              <li key={c.name} data-story-toc={i} className="story-toc__item">
                <span className="story-toc__bar">
                  <span data-story-fill="" className="story-toc__fill" />
                </span>
                <span className="story-toc__num tabular-nums">{pad(i + 1)}</span>
                <span className="story-toc__name">{c.name}</span>
              </li>
            ))}
          </ol>

          <ol className="story-chapters">
            {chapters.map((c, i) => (
              <li key={c.name} data-story-chapter={i} className="story-chapter">
                <p className="story-chapter__label text-label text-ink-muted">
                  <span className="split-line">
                    <span data-story-roll="" className="block">
                      {pad(i + 1)} · {c.name}
                    </span>
                  </span>
                </p>
                <h3 data-story-title="" className="story-chapter__title mt-3 font-display font-light text-ink" dangerouslySetInnerHTML={{ __html: escapeHtml(c.title) }} />
                <p data-story-body="" className="story-chapter__body mt-4 text-ink-muted" dangerouslySetInnerHTML={{ __html: escapeHtml(c.body) }} />
              </li>
            ))}
          </ol>
        </Container>
      </div>
    </section>
  );
}
