/*
 * Split a plain-text element into masked lines, for line-by-line reveals.
 * Each line becomes
 *   <span class="split-line"><span class="split-line__inner">…</span></span>
 * so it can slide up from behind its own edge. The words stay ordinary text,
 * so screen readers read the paragraph as one. Call it only after fonts have
 * loaded (the engine measures after document.fonts.ready), and again when
 * the element's width changes: the original text is kept in
 * data-split-text and restored before each split.
 */
export function splitLines(el: HTMLElement): HTMLElement[] {
  const text = (el.dataset.splitText ?? el.textContent ?? "").trim();
  el.dataset.splitText = text;
  el.textContent = "";
  const words = text.split(/\s+/);
  const probes = words.map((word, i) => {
    const span = document.createElement("span");
    span.textContent = word;
    span.style.display = "inline-block";
    el.append(span);
    if (i < words.length - 1) el.append(" ");
    return span;
  });
  const lines: string[][] = [];
  let lastTop = Number.NEGATIVE_INFINITY;
  for (const probe of probes) {
    const top = probe.offsetTop;
    if (Math.abs(top - lastTop) > 2) {
      lines.push([]);
      lastTop = top;
    }
    lines[lines.length - 1].push(probe.textContent ?? "");
  }
  el.textContent = "";
  const inners = lines.map((line) => {
    const outer = document.createElement("span");
    outer.className = "split-line";
    const inner = document.createElement("span");
    inner.className = "split-line__inner";
    inner.textContent = line.join(" ");
    outer.append(inner);
    el.append(outer, " ");
    return inner;
  });
  el.dataset.split = "";
  el.dataset.splitWidth = String(el.clientWidth);
  return inners;
}

/** Split again only if the element's width changed since the last split. */
export function resplitIfNeeded(el: HTMLElement, current: HTMLElement[]): HTMLElement[] {
  if (current.length && el.dataset.splitWidth === String(el.clientWidth)) return current;
  return splitLines(el);
}

/** Put the original text back. */
export function unsplit(el: HTMLElement) {
  if (el.dataset.splitText === undefined) return;
  el.textContent = el.dataset.splitText;
  delete el.dataset.split;
  delete el.dataset.splitWidth;
}
