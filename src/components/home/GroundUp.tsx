import type { CSSProperties } from "react";
import { Container } from "@/components/ui/Container";
import { GU_ASSEMBLED, GU_EXPLODED, GU_RISE, guLayers } from "@/content/ground-up-drawing";
import { escapeHtml } from "@/lib/html";
import { groundUpSectionVh } from "@/lib/motion/home";

/** The four chapters: what the firm works out at each layer of a house, never a promise of the municipality's decision. */
const chapters = [
  {
    name: "Foundation",
    title: "It starts below ground.",
    body: "Footings and foundation walls come first, drawn for everything that will rest on them.",
  },
  {
    name: "Structure",
    title: "A frame that carries it all.",
    body: "Beams, posts and joists are worked out with the design, so every load has a path to the ground.",
  },
  {
    name: "Floors",
    title: "Rooms around how you live.",
    body: "Walls, stairs, doors and windows, placed floor by floor and checked against the Building Code.",
  },
  {
    name: "Roof",
    title: "Every layer fits the next.",
    body: "The roof closes the house over, and the layers, drawn to fit one another, come together as one.",
  },
];

const pad = (n: number) => String(n).padStart(2, "0");
/** A share of a box, as a CSS percentage. */
const pc = (n: number) => `${(n * 100).toFixed(3)}%`;
const EX = GU_EXPLODED;

/**
 * From the ground up: how the firm designs and engineers a house, told
 * with one illustrative house drawn in five layers, between Selected
 * projects and the values.
 *
 * The drawing (src/content/ground-up-drawing.ts) is an exploded
 * axonometric: the foundation in the ground, the floor framing, the two
 * floors and the roof, each lifted above the last. Every layer is two
 * pictures in one place: its draft (every edge, the hidden ones too) and
 * the layer itself, painted with its hidden lines removed; each carries
 * its tag.
 *
 * Tracks: a 630vh track with one pinned stage (GROUND_UP in
 * src/lib/motion/home.ts; HomeMotion, groundUp module). The layers are
 * drawn from the ground up, a chapter at a time: each draft is drawn line
 * by line in its place, then the layer fills in over it and settles, and
 * the view rises with the drawing; once the roof is in, the gaps close
 * and the layers come together into the house. Beside the drawing the
 * chapters' lines roll through their masks, and the contents mark the
 * chapter being told.
 *
 * Without the tracks (reduced motion, short screens, no JavaScript, print)
 * the chapters are a list beside the exploded drawing, every layer in
 * place and tagged.
 */
export function GroundUp() {
  return (
    <section
      data-groundup=""
      aria-labelledby="groundup-heading"
      className="gu relative tracks:h-(--gu-h)"
      style={{ "--gu-h": `${groundUpSectionVh()}vh` } as CSSProperties}
    >
      <div data-gu-stage="" className="gu-stage">
        <Container className="gu-layout">
          <div className="gu-label">
            <h2 id="groundup-heading" className="text-label text-ink">
              <span className="split-line">
                <span data-label-roll="" className="block">
                  From the ground up
                </span>
              </span>
            </h2>
            <p className="gu-note mt-3 text-[0.8125rem] leading-relaxed text-ink-muted sm:text-[0.875rem]">
              <span className="split-line">
                <span data-label-roll="" className="block">
                  How we design and engineer a house, layer by layer.
                </span>
              </span>
            </p>
          </div>

          <figure className="gu-figure">
            {/* On the tracks, the window the drawing moves in (globals.css). The plane says, as shares of its height, how far a metre of height moves a point (data-gu-rise) and each layer how far it is lifted (data-gu-lift), so HomeMotion needs none of the drawing's code. */}
            <div data-gu-frame="" className="gu-frame">
              <div
                data-gu-plane=""
                data-gu-rise={(GU_RISE / EX.h).toFixed(5)}
                className="gu-plane"
                style={{ "--gu-ar": `${EX.w} / ${EX.h}`, "--gu-fit": (EX.w / GU_ASSEMBLED.h).toFixed(4) } as CSSProperties}
                aria-hidden="true"
              >
                {guLayers.map((l, i) => {
                  const b = l.box;
                  return (
                    <div
                      key={l.id}
                      data-gu-layer={i}
                      data-gu-lift={(l.lift / EX.h).toFixed(5)}
                      className="gu-layer"
                      style={{
                        left: pc((b.x - EX.x) / EX.w),
                        top: pc((b.y - l.lift - EX.y) / EX.h),
                        width: pc(b.w / EX.w),
                        height: pc(b.h / EX.h),
                      }}
                    >
                      <svg data-gu-solid="" className="gu-solid" viewBox={`${b.x} ${b.y} ${b.w} ${b.h}`}>
                        {l.paths.map((p, k) => (
                          <path key={k} className={`${p.kind === "fill" ? "f" : "l"}-${p.cls}`} d={p.d} />
                        ))}
                      </svg>
                      <svg data-gu-draft="" className="gu-draft" viewBox={`${b.x} ${b.y} ${b.w} ${b.h}`}>
                        <path d={l.draft} />
                      </svg>
                      <p className="gu-tag" style={{ left: pc((EX.x - b.x) / b.w), width: pc((l.tag.x - EX.x) / b.w), top: pc((l.tag.y - b.y) / b.h) }}>
                        <span className="split-line">
                          <span data-gu-tag="" className="gu-tag__row">
                            <span className="gu-tag__name">{l.name}</span>
                            <span className="gu-tag__leader" />
                          </span>
                        </span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
            <figcaption data-gu-caption="" className="gu-caption mt-3 text-label text-pretty text-ink-muted">
              An illustrative house<span className="max-sm:hidden">, not a client project</span>.
            </figcaption>
          </figure>

          <ol aria-hidden="true" className="gu-toc">
            {chapters.map((c, i) => (
              <li key={c.name} data-gu-toc={i} className="gu-toc__item">
                <span className="gu-toc__bar">
                  <span data-gu-fill="" className="gu-toc__fill" />
                </span>
                <span className="gu-toc__num tabular-nums">{pad(i + 1)}</span>
                <span className="gu-toc__name">{c.name}</span>
              </li>
            ))}
          </ol>

          <ol className="gu-chapters">
            {chapters.map((c, i) => (
              <li key={c.name} data-gu-chapter={i} className="gu-chapter">
                <p className="gu-chapter__label text-label text-ink-muted">
                  <span className="split-line">
                    <span data-gu-roll="" className="block">
                      {pad(i + 1)} · {c.name}
                    </span>
                  </span>
                </p>
                <h3 data-gu-title="" className="gu-chapter__title mt-3 font-display font-light text-ink" dangerouslySetInnerHTML={{ __html: escapeHtml(c.title) }} />
                <p data-gu-body="" className="gu-chapter__body mt-4 text-ink-muted" dangerouslySetInnerHTML={{ __html: escapeHtml(c.body) }} />
              </li>
            ))}
          </ol>
        </Container>
      </div>
    </section>
  );
}
