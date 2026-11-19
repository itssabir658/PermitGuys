"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/LinkButton";
import { coverWidth, plates, projectOf, type Plate } from "@/content/imagery";
import { paths } from "@/lib/routes";

/*
 * Selected projects on the About page, laid out like the project index of
 * an architecture monograph: one large plate on the left, the index of
 * projects on the right (below it on phones and tablets), numbered 01 to 04.
 *
 * Choosing a project (a row of the index, the arrows, the arrow keys or a
 * swipe across the plate) draws its rendering across the plate like a sheet
 * pulled over a drawing table: the new picture's frame slides in from the
 * side it comes from while the picture inside it slides the other way, so
 * the picture itself stays still and only its edge travels. The picture
 * underneath eases a little away. Both are transforms only (composited), so
 * the change never waits on the page's main thread and always finishes: a
 * new choice mid-way simply starts a new sheet over the old one.
 *
 * While a project holds the plate its rendering settles slowly closer, and
 * a hairline under its row in the index fills over 5 seconds; the end of
 * that fill is the clock that moves to the next project, so the line and
 * the change never disagree.
 *
 * Autoplay keeps rolling while a mouse moves over the section; choosing a
 * project starts that project's 5 seconds afresh. It stops while the
 * section is off screen, while the page is hidden, while a finger is on the
 * plate or keyboard focus is in it, when the pause button is pressed, and
 * never starts with reduced motion (then the pictures change at once,
 * without sliding or settling). A mouse click on a row leaves focus on it
 * but does not stop the slideshow: only keyboard focus (:focus-visible) does.
 *
 * Desktops: the heading, the plate and the index fit in one screen under
 * the header (the plate's height comes from the screen's, see .pj__stage).
 *
 * Keyboard: the index is a tab list (arrow keys, Home and End move along it
 * and show that project; only the chosen row is in the tab order), the plate
 * and its link are its tab panel.
 */

const shown: Plate[] = [plates.whiteBatten, plates.prairieFront, plates.dusk, plates.farmhouseWide];

const NOTE = "Finished client projects, shown with each client’s permission.";
const TAG = "Client project · Finished";
/** How long a project holds the plate, in seconds. */
const HOLD = 5;
/** How far a finger or pointer must travel across the plate to change project, in pixels. */
const SWIPE = 48;

const two = (i: number) => String(i).padStart(2, "0");

export function ProjectShowcase() {
  const items = shown.flatMap((plate) => {
    const project = projectOf(plate);
    return project ? [{ plate, href: paths.projectRenderings(project.id) }] : [];
  });
  const n = items.length;

  const [active, setActive] = useState(0);
  /** The project that held the plate before, lying under the new sheet as it is drawn. */
  const [under, setUnder] = useState(-1);
  /** The way the last sheet was drawn; unset until the first change, so nothing animates on arrival. */
  const [dir, setDir] = useState<"next" | "prev" | null>(null);
  /** Bumped on every change, so the row's 5-second line and the plate's settle start again. */
  const [cycle, setCycle] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [inView, setInView] = useState(false);
  const [visible, setVisible] = useState(true);
  const [held, setHeld] = useState(false);
  const [focused, setFocused] = useState(false);

  const root = useRef<HTMLElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const swipe = useRef<{ id: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setReduced(mq.matches);
      if (mq.matches) setPlaying(false);
    };
    sync();
    mq.addEventListener("change", sync);
    const onVis = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    const el = root.current;
    const io = el ? new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.3 }) : null;
    if (el && io) io.observe(el);
    return () => {
      mq.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", onVis);
      io?.disconnect();
    };
  }, []);

  /** Show project `i`; the sheet comes from the right going forward, from the left going back. */
  const go = useCallback(
    (i: number, way?: "next" | "prev") => {
      const to = ((i % n) + n) % n;
      if (to === active) return;
      setUnder(active);
      setActive(to);
      setDir(way ?? (to > active ? "next" : "prev"));
      setCycle((c) => c + 1);
    },
    [n, active],
  );
  const next = useCallback(() => go(active + 1, "next"), [go, active]);
  const prev = useCallback(() => go(active - 1, "prev"), [go, active]);

  const running = playing && !reduced && inView && visible && !held && !focused;

  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    let to = -1;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") to = (active + 1) % n;
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") to = (active - 1 + n) % n;
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = n - 1;
    if (to < 0) return;
    e.preventDefault();
    go(to, e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "Home" ? "prev" : "next");
    tabs.current[to]?.focus();
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    swipe.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    if (e.pointerType !== "mouse") setHeld(true);
  };
  const onPointerEnd = (e: PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const s = swipe.current;
    if (!s || s.id !== e.pointerId) return;
    swipe.current = null;
    setHeld(false);
    if (cancelled) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) < SWIPE || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    if (dx < 0) next();
    else prev();
  };

  const current = items[active];

  return (
    <section
      ref={root}
      data-showcase=""
      data-tone="dark"
      aria-labelledby="works-heading"
      className="pj bg-charcoal-900 text-ivory"
      style={{ "--hold": `${HOLD}s` } as CSSProperties}
      data-running={running ? "" : undefined}
      data-reduced={reduced ? "" : undefined}
    >
      <Container className="pj__head">
        <div className="lg:col-span-7">
          <p className="text-label text-stone-300">Finished client projects</p>
          <h2 id="works-heading" className="mt-6 font-display text-display-xl font-light text-ivory">
            Selected projects
          </h2>
        </div>
        <p className="pj__note text-stone-300">{NOTE}</p>
      </Container>

      <Container>
        <div
          className="pj__body"
          aria-roledescription="carousel"
          role="region"
          aria-label="Finished client projects"
          onFocus={(e) => setFocused(e.target.matches(":focus-visible"))}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
          }}
        >
          <div id="pj-panel" role="tabpanel" aria-labelledby={`pj-tab-${active}`} className="pj__panel">
            {/* The plate: every project's rendering is a layer; the chosen one is drawn over the one before. */}
            <div
              className="pj__stage notch-clip"
              data-dir={dir ?? undefined}
              onPointerDown={onPointerDown}
              onPointerUp={(e) => onPointerEnd(e, false)}
              onPointerCancel={(e) => onPointerEnd(e, true)}
            >
              {items.map((s, i) => (
                <div
                  key={s.href}
                  className="pj-layer"
                  data-pj-layer={i}
                  data-state={i === active ? "on" : i === under ? "under" : "off"}
                  aria-hidden={i === active ? undefined : true}
                >
                  <div className="pj-layer__pic">
                    {/* Keyed by the change that brought it in, so its settle starts afresh then and holds where it got to while it lies under the next sheet. */}
                    <div key={i === active ? cycle : i === under ? cycle - 1 : "off"} className="pj-layer__settle">
                      <Image
                        src={s.plate.src}
                        alt={s.plate.alt}
                        fill
                        draggable={false}
                        sizes={`(min-width: 1024px) ${coverWidth(s.plate, 1.6, "60vw", 1.1)}, (min-width: 768px) ${coverWidth(s.plate, 1.5, "92vw", 1.1)}, ${coverWidth(s.plate, 0.8, "92vw", 1.1)}`}
                        quality={80}
                        className="object-cover"
                        style={{ objectPosition: s.plate.focus }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <span aria-hidden="true" className="pj__shade" />
            </div>

            <div className="pj__foot">
              <p className="pj__count text-label text-stone-300" aria-hidden="true">
                <span className="pj__digits">
                  {items.map((s, i) => (
                    <span key={s.href} className="pj__digit" data-on={i === active ? "" : undefined}>
                      {two(i + 1)}
                    </span>
                  ))}
                </span>
                <span className="pj__of">/ {two(n)}</span>
                <span className="pj__tag">{TAG}</span>
              </p>
              <LinkButton href={current.href} tone="light">
                View the project<span className="sr-only">: {current.plate.caption}</span>
              </LinkButton>
            </div>
          </div>

          <div className="pj__index">
            <p className="text-label text-stone-400" aria-hidden="true">
              Index
            </p>
            <div role="tablist" aria-label="Projects" aria-orientation="vertical" className="pj__list" onKeyDown={onTabKey}>
              {items.map((s, i) => {
                const on = i === active;
                return (
                  <button
                    key={s.href}
                    ref={(el) => {
                      tabs.current[i] = el;
                    }}
                    id={`pj-tab-${i}`}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    aria-controls="pj-panel"
                    tabIndex={on ? 0 : -1}
                    className="pj-row"
                    data-on={on ? "" : undefined}
                    onClick={() => go(i)}
                  >
                    <span className="pj-row__num">{two(i + 1)}</span>
                    <span className="pj-row__title">{s.plate.caption}</span>
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="pj-row__arrow" aria-hidden="true" focusable="false">
                      <path d="M3 10h13M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {on && !reduced ? <span key={cycle} aria-hidden="true" className="pj-row__line" onAnimationEnd={next} /> : null}
                  </button>
                );
              })}
            </div>

            <div className="pj__controls">
              <button type="button" className="pj__btn" onClick={prev} aria-label="Previous project">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-4" aria-hidden="true" focusable="false">
                  <path d="M17 10H4M9 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button type="button" className="pj__btn" onClick={next} aria-label="Next project">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-4" aria-hidden="true" focusable="false">
                  <path d="M3 10h13M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {reduced ? null : (
                <button type="button" className="pj__btn pj__play" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause the slideshow" : "Play the slideshow"}>
                  {playing ? (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="size-3.5" aria-hidden="true" focusable="false">
                      <rect x="5" y="4" width="3.2" height="12" rx="0.8" />
                      <rect x="11.8" y="4" width="3.2" height="12" rx="0.8" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="size-3.5" aria-hidden="true" focusable="false">
                      <path d="M6 3.8v12.4a.8.8 0 0 0 1.2.7l10-6.2a.8.8 0 0 0 0-1.4l-10-6.2A.8.8 0 0 0 6 3.8Z" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>

          <p className="sr-only" aria-live="polite">
            {running ? "" : `Project ${active + 1} of ${n}: ${current?.plate.caption ?? ""}`}
          </p>
        </div>
      </Container>
    </section>
  );
}
