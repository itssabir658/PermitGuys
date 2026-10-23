import { cssEase } from "./math";

/*
 * The link button's fill (globals.css, "Link button"; docs/MOTION.md, "Link
 * buttons").
 *
 * The fill is one band across the label plate, from --lb-a to --lb-b
 * (percent of its width). The wipe and the outline tones' second label are
 * both clipped to it, so the label always turns exactly where the fill is.
 * Hover or keyboard focus runs the band's far edge across the plate (0.45s,
 * --e-sheet); leaving runs its near edge after the far one, so the fill
 * leaves forwards, through the edge it was heading for, and once it is gone
 * it waits at the start again, unseen. Every change starts from wherever the
 * band is: a pointer that only passes over a button draws a sliver that
 * runs out ahead of it, and one that comes back while the fill is leaving
 * turns it round. Nothing ever jumps.
 *
 * Hover follows the mouse events, which touch screens emulate the way they
 * hold :hover, so the fill agrees with the rest of the hover (the cube, the
 * shine). Reduced motion moves the band at once.
 */

export const WIPE_MS = 450;
/** The shortest run, as a share of a full one, for a band with only a little way to go. */
const WIPE_MIN = 1 / 3;

export interface Band {
  /** Near edge, percent of the plate. */
  a: number;
  /** Far edge. */
  b: number;
}

/**
 * Where the band goes from `from`: across the whole plate while the button
 * is hovered or focused, otherwise its near edge up to its far one. The run
 * takes a time in proportion to the way it has to go (a third of a full run
 * at least). Null when it is there already.
 */
export function wipeStep(from: Band, on: boolean): (Band & { ms: number }) | null {
  const to = on ? { a: 0, b: 100 } : { a: from.b, b: from.b };
  const way = Math.max(Math.abs(to.a - from.a), Math.abs(to.b - from.b)) / 100;
  if (way < 0.001) return null;
  return { ...to, ms: Math.round(WIPE_MS * Math.max(WIPE_MIN, Math.min(1, way))) };
}

const REDUCED = "(prefers-reduced-motion: reduce)";

/** Drive every link button's fill on the page, now and later (delegated). Returns the cleanup. */
export function linkButtonWipes() {
  const root = document.documentElement;
  const hovered = new WeakSet<Element>();
  const runs = new WeakMap<HTMLElement, Animation>();

  const update = (el: HTMLElement) => {
    const on = hovered.has(el) || (el === document.activeElement && el.matches(":focus-visible"));
    if (on === "filled" in el.dataset) return;
    // Read the band where it is (mid-run, the animated value) before letting go of the run that put it there.
    const style = getComputedStyle(el);
    const from = { a: parseFloat(style.getPropertyValue("--lb-a")) || 0, b: parseFloat(style.getPropertyValue("--lb-b")) || 0 };
    runs.get(el)?.cancel();
    runs.delete(el);
    if (on) el.dataset.filled = "";
    else delete el.dataset.filled;
    const step = wipeStep(from, on);
    if (!step || matchMedia(REDUCED).matches) return;
    // No fill mode: at its end the run hands over to the resting band (data-filled), which is where it ends, or as empty.
    const run = el.animate(
      [
        { "--lb-a": `${from.a}%`, "--lb-b": `${from.b}%` },
        { "--lb-a": `${step.a}%`, "--lb-b": `${step.b}%` },
      ],
      { duration: step.ms, easing: cssEase.sheet },
    );
    runs.set(el, run);
  };

  const buttonOf = (target: EventTarget | null) => (target instanceof Element ? target.closest<HTMLElement>(".link-button") : null);
  const over = (e: MouseEvent) => {
    const el = buttonOf(e.target);
    if (!el || hovered.has(el)) return;
    hovered.add(el);
    update(el);
  };
  const out = (e: MouseEvent) => {
    const el = buttonOf(e.target);
    if (!el || (e.relatedTarget instanceof Node && el.contains(e.relatedTarget))) return;
    hovered.delete(el);
    update(el);
  };
  const focus = (e: FocusEvent) => {
    if (e.target instanceof HTMLElement && e.target.classList.contains("link-button")) update(e.target);
  };

  document.addEventListener("mouseover", over, { passive: true });
  document.addEventListener("mouseout", out, { passive: true });
  document.addEventListener("focusin", focus);
  document.addEventListener("focusout", focus);
  root.dataset.wipes = "";
  return () => {
    document.removeEventListener("mouseover", over);
    document.removeEventListener("mouseout", out);
    document.removeEventListener("focusin", focus);
    document.removeEventListener("focusout", focus);
    delete root.dataset.wipes;
  };
}
