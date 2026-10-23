/*
 * Scroll reveals on inner pages (InteractionEffects.tsx, globals.css
 * "Inner pages"). Pure helpers, so the ordering can be tested without a
 * browser.
 */

/** Pieces that reach the screen together follow one another this far apart (ms). */
export const REVEAL_STEP = 60;
/** …up to this many steps, so a long batch never waits more than 480ms. */
export const REVEAL_MAX_STEPS = 8;
/** Pieces already in the first screen wait for the page header's entrance (ms after data-revealed). */
export const REVEAL_SETTLE = 600;

/**
 * What counts as a row inside a [data-reveal-type="rows"] group: list items,
 * disclosures, table rows, definition pairs, paragraphs, small headings,
 * placeholder blocks and anything marked data-row. A row inside another row
 * moves with it and is not a row of its own.
 */
export const ROW_SELECTOR = "li, details, tr, caption, figcaption, dl > div, p, h3, h4, [data-placeholder], [data-row]";

/**
 * Reading order for pieces revealed together: top to bottom, and left to
 * right within the same line (tops within `tolerance` px count as one line).
 */
export function readingOrder<T extends { top: number; left: number }>(items: T[], tolerance = 8): T[] {
  const byTop = [...items].sort((a, b) => a.top - b.top);
  const lines: T[][] = [];
  for (const item of byTop) {
    const line = lines[lines.length - 1];
    if (line && item.top - line[0].top <= tolerance) line.push(item);
    else lines.push([item]);
  }
  return lines.flatMap((line) => line.sort((a, b) => a.left - b.left));
}

/** Delay in ms for the k-th piece of a batch: `base`, then one step more for each piece before it, capped. */
export function revealDelay(k: number, base = 0): number {
  return base + REVEAL_STEP * Math.min(Math.max(0, k), REVEAL_MAX_STEPS);
}
