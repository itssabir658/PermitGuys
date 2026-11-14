"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/LinkButton";
import { coverWidth, plates, projectOf, type Plate } from "@/content/imagery";
import { paths } from "@/lib/routes";

/*
 * Selected projects on the About page: a showcase carousel on graphite, in
 * the manner of a product gallery. One project card sits in the middle at
 * full size; the cards before and after it wait in line, smaller, behind
 * frosted glass (blurred on desktops; on phones only the tint, since a
 * moving blur is costly there). Every 7 seconds the line slides left and
 * the next card takes the middle; inside the card in the middle, the
 * rendering drifts slowly from right to left. The active dot fills over
 * those 7 seconds, and its animation's end is the clock, so the dot and
 * the slide never disagree.
 *
 * The cards keep the site's notched sheet frame (.notch-clip): portrait on
 * phones, as before, and wider from tablets up.
 *
 * Autoplay stops while the section is off screen, while the page is
 * hidden, while a visitor's focus or finger is in the carousel, when the
 * pause button is pressed, and never starts with reduced motion (the
 * cards then change without sliding or drifting). Swipe, drag, the arrow
 * buttons, the dots, the arrow keys or a click on a waiting card move it by
 * hand. Only the card in the middle is in the tab order.
 */

const shown: Plate[] = [plates.stone, plates.prairieFront, plates.dusk, plates.greenBatten, plates.narrow, plates.whiteBatten];

const NOTE = "Renderings from client projects. Case studies will appear here as clients approve them.";
const TAG = "Client project · Rendering";
/** How long a card holds the middle, in seconds. */
const HOLD = 7;

/** Card i's place in line with card `active` in the middle: 0 in the middle, negative before it (left), positive after it. */
function offsetOf(i: number, active: number, n: number) {
  const half = Math.floor(n / 2);
  return ((((i - active + half) % n) + n) % n) - half;
}

export function ProjectShowcase() {
  const items = shown.flatMap((plate) => {
    const project = projectOf(plate);
    return project ? [{ plate, href: paths.projectRenderings(project.id) }] : [];
  });
  const n = items.length;

  const [active, setActive] = useState(0);
  /** The card that last held the middle, whose caption is on its way out. */
  const [leaving, setLeaving] = useState(-1);
  /** Bumped on every move, so the dot's 7-second fill starts again. */
  const [cycle, setCycle] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [inView, setInView] = useState(false);
  const [visible, setVisible] = useState(true);
  const [held, setHeld] = useState(false);
  const [focused, setFocused] = useState(false);

  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; y: number; dx: number; on: boolean; moved: boolean } | null>(null);

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
    const io = el ? new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 }) : null;
    if (el && io) io.observe(el);
    return () => {
      mq.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", onVis);
      io?.disconnect();
    };
  }, []);

  const go = useCallback(
    (i: number) => {
      const to = ((i % n) + n) % n;
      if (to === active) return;
      setLeaving(active);
      setActive(to);
      setCycle((c) => c + 1);
    },
    [n, active],
  );
  const next = useCallback(() => go(active + 1), [go, active]);
  const prev = useCallback(() => go(active - 1), [go, active]);

  const running = playing && !reduced && inView && visible && !held && !focused;

  const setDrag = (px: number) => track.current?.style.setProperty("--drag", `${px.toFixed(1)}px`);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || drag.current) return;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, on: false, moved: false };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.on) {
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
      d.on = true;
      d.moved = true;
      setHeld(true);
      track.current?.setAttribute("data-dragging", "");
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    d.dx = dx;
    setDrag(dx * 0.85);
  };
  const endDrag = (e: PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = d.moved ? { ...d, id: -1 } : null;
    track.current?.removeAttribute("data-dragging");
    setDrag(0);
    setHeld(false);
    if (!d.on || cancelled) return;
    const w = track.current?.offsetWidth ?? 400;
    const far = Math.max(40, Math.min(120, w * 0.12));
    if (d.dx <= -far) next();
    else if (d.dx >= far) prev();
  };
  const onTrackClick = (e: MouseEvent<HTMLDivElement>) => {
    // A drag ends in a click on whatever is under the pointer: swallow it.
    if (drag.current?.moved) {
      drag.current = null;
      e.preventDefault();
      return;
    }
    drag.current = null;
    const card = (e.target as Element).closest<HTMLElement>("[data-showcase-card]");
    const i = card ? Number(card.dataset.showcaseCard) : -1;
    if (i >= 0 && i !== active) go(i);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    }
  };

  const current = items[active];

  return (
    <section
      ref={root}
      data-showcase=""
      data-tone="dark"
      aria-labelledby="works-heading"
      className="showcase bg-charcoal-900 text-ivory"
      style={{ "--hold": `${HOLD}s` } as CSSProperties}
      data-running={running ? "" : undefined}
      data-reduced={reduced ? "" : undefined}
    >
      <Container className="showcase__head">
        <div className="lg:col-span-7">
          <p className="text-label text-stone-300">Client project renderings</p>
          <h2 id="works-heading" className="mt-6 font-display text-display-xl font-light text-ivory">
            Selected projects
          </h2>
        </div>
        <p className="showcase__note text-stone-300">{NOTE}</p>
      </Container>

      <div
        role="group"
        aria-roledescription="carousel"
        aria-label="Client project renderings"
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
        }}
      >
        <div
          ref={track}
          className="showcase__track"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(e) => endDrag(e, false)}
          onPointerCancel={(e) => endDrag(e, true)}
          onClickCapture={onTrackClick}
        >
          {items.map((s, i) => {
            const d = offsetOf(i, active, n);
            const jump = leaving >= 0 && Math.abs(d - offsetOf(i, leaving, n)) > 1;
            const a = Math.abs(d);
            const style = { "--sgn": Math.sign(d), "--a": a, zIndex: n - a } as CSSProperties;
            return (
              <div
                key={s.href}
                data-showcase-card={i}
                data-pos={d === 0 ? "middle" : d < 0 ? "before" : "after"}
                data-far={a > 2 ? "" : undefined}
                data-jump={jump ? "" : undefined}
                className="showcase-card"
                style={style}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${n}: ${s.plate.caption}`}
                aria-hidden={d === 0 ? undefined : true}
              >
                <div className="showcase-card__frame notch-clip">
                  <div className="showcase-card__pic">
                    <Image
                      src={s.plate.src}
                      alt={s.plate.alt}
                      fill
                      draggable={false}
                      loading="eager"
                      sizes={`(min-width: 1024px) ${coverWidth(s.plate, 1.6, "64vw", 1.1)}, (min-width: 768px) ${coverWidth(s.plate, 4 / 3, "62vw", 1.1)}, ${coverWidth(s.plate, 0.8, "78vw", 1.1)}`}
                      quality={80}
                      className="object-cover"
                      style={{ objectPosition: s.plate.focus }}
                    />
                  </div>
                  <span aria-hidden="true" className="showcase-card__glass" />
                </div>
              </div>
            );
          })}
        </div>

        {/* The middle card's caption: every project's is set in one place, and the middle one's rises in as the line slides. */}
        <div className="showcase__captions">
          {items.map((s, i) => (
            <div key={s.href} className="showcase-caption" data-on={i === active ? "" : undefined} data-leaving={i === leaving && i !== active ? "" : undefined} aria-hidden={i === active ? undefined : true}>
              <div className="showcase-caption__text">
                <p className="text-label text-stone-300">
                  <span className="showcase-caption__mask">
                    <span className="showcase-caption__line">{TAG}</span>
                  </span>
                </p>
                <h3 className="mt-3 font-display text-display-md font-light text-ivory">
                  <span className="showcase-caption__mask">
                    <span className="showcase-caption__line">
                      {s.plate.caption}
                    </span>
                  </span>
                </h3>
              </div>
              <div className="showcase-caption__action">
                <LinkButton href={s.href} tone="light" className={i === active ? undefined : "pointer-events-none"}>
                  View the project<span className="sr-only">: {s.plate.caption}</span>
                </LinkButton>
              </div>
            </div>
          ))}
        </div>

        <div className="showcase__controls">
          <button type="button" className="showcase__arrow" onClick={prev} aria-label="Previous project">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-4" aria-hidden="true" focusable="false">
              <path d="M17 10H4M9 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="showcase__dots">
            {items.map((s, i) => (
              <button
                key={s.href}
                type="button"
                className="showcase__dot"
                data-on={i === active ? "" : undefined}
                aria-label={`Show project ${i + 1}: ${s.plate.caption}`}
                aria-current={i === active ? "true" : undefined}
                onClick={() => go(i)}
              >
                {i === active ? <span key={cycle} className="showcase__fill" onAnimationEnd={next} /> : null}
              </button>
            ))}
          </div>
          <button type="button" className="showcase__arrow" onClick={next} aria-label="Next project">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-4" aria-hidden="true" focusable="false">
              <path d="M3 10h13M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {reduced ? null : (
            <button type="button" className="showcase__arrow showcase__play" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause the slideshow" : "Play the slideshow"}>
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
        <p className="sr-only" aria-live="polite">
          {running ? "" : `Project ${active + 1} of ${n}: ${current?.plate.caption ?? ""}`}
        </p>
      </div>
    </section>
  );
}
