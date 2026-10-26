import { WORDMARK_HTML, WORDMARK_NAME } from "@/content/wordmark";

/*
 * Split a plain-text element into masked lines, for line-by-line reveals.
 * The firm's name is drawn as the wordmark wherever it appears.
 * Each line becomes
 *   <span class="split-line"><span class="split-line__inner">…</span></span>
 * so it can slide up from behind its own edge. The words stay ordinary text,
 * so screen readers read the paragraph as one. The original text is kept in
 * data-split-text and restored before each split.
 *
 * A split holds for the width the element has once split (data-split-width:
 * a block that shrinks to fit its text narrows to its longest line), and
 * only in the page's fonts: one made while they were still loading is
 * marked, so the next measure (the engine measures again after
 * document.fonts.ready) makes it again.
 *
 * Finding where the lines break needs a layout. `splitAll` splits many
 * elements with one: it writes every element's words, reads every break,
 * writes every line, then reads every new width, where splitting them one
 * by one would lay the page out twice per element.
 */

/** Append a word: as text, or, where it is the firm's name, as the wordmark (any punctuation after it as text). */
function appendWord(parent: HTMLElement, word: string) {
  if (word.startsWith(WORDMARK_NAME)) {
    parent.insertAdjacentHTML("beforeend", WORDMARK_HTML);
    const rest = word.slice(WORDMARK_NAME.length);
    if (rest) parent.append(rest);
  } else parent.append(word);
}

/** The words, separated by spaces, into `parent`. */
function appendWords(parent: HTMLElement, words: string[]) {
  words.forEach((word, i) => {
    if (i) parent.append(" ");
    appendWord(parent, word);
  });
}

/** What a split that still holds would have recorded (see above). */
const fitOf = (el: HTMLElement) => `${el.clientWidth}${document.fonts?.status === "loading" ? "~" : ""}`;

/** The element's words, each in a probe span whose top shows the line it falls on. */
function writeProbes(el: HTMLElement) {
  const text = (el.dataset.splitText ?? el.textContent ?? "").trim();
  el.dataset.splitText = text;
  el.textContent = "";
  const words = text.split(/\s+/);
  return words.map((word, i) => {
    const span = document.createElement("span");
    appendWord(span, word);
    span.style.display = "inline-block";
    el.append(span);
    if (i < words.length - 1) el.append(" ");
    return span;
  });
}

/** Group the words by the line their probes fell on, and write the lines. */
function writeLines(el: HTMLElement, probes: HTMLElement[], tops: number[]) {
  const lines: string[][] = [];
  let lastTop = Number.NEGATIVE_INFINITY;
  probes.forEach((probe, i) => {
    if (Math.abs(tops[i] - lastTop) > 2) {
      lines.push([]);
      lastTop = tops[i];
    }
    lines[lines.length - 1].push(probe.textContent ?? "");
  });
  el.textContent = "";
  const inners = lines.map((line) => {
    const outer = document.createElement("span");
    outer.className = "split-line";
    const inner = document.createElement("span");
    inner.className = "split-line__inner";
    appendWords(inner, line);
    outer.append(inner);
    el.append(outer, " ");
    return inner;
  });
  el.dataset.split = "";
  return inners;
}

export function splitLines(el: HTMLElement): HTMLElement[] {
  const probes = writeProbes(el);
  const inners = writeLines(el, probes, probes.map((p) => p.offsetTop));
  el.dataset.splitWidth = fitOf(el);
  return inners;
}

/** Split, together, every element whose split no longer holds (see above). */
export function splitAll(els: HTMLElement[]) {
  const todo = els.filter((el) => el.dataset.splitWidth !== fitOf(el));
  const probes = todo.map(writeProbes);
  const tops = probes.map((ps) => ps.map((p) => p.offsetTop));
  todo.forEach((el, i) => writeLines(el, probes[i], tops[i]));
  const fits = todo.map(fitOf);
  todo.forEach((el, i) => (el.dataset.splitWidth = fits[i]));
}

/** Split again only if the split no longer holds; otherwise the element's lines as they are (split by `splitAll`, or before). */
export function resplitIfNeeded(el: HTMLElement, current: HTMLElement[]): HTMLElement[] {
  if (el.dataset.splitWidth !== fitOf(el)) return splitLines(el);
  return current.length && current[0].isConnected ? current : [...el.querySelectorAll<HTMLElement>(":scope > .split-line > .split-line__inner")];
}

/** Put the original text back. */
export function unsplit(el: HTMLElement) {
  if (el.dataset.splitText === undefined) return;
  el.textContent = "";
  appendWords(el, el.dataset.splitText.split(/\s+/));
  delete el.dataset.split;
  delete el.dataset.splitWidth;
}
