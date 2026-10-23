/*
 * The pictures a page opens on, which the preloader and the page transition
 * wait for before they open onto it: on the homepage the hero's planes,
 * both pictures and the matte that masks the house (until the matte arrives
 * the house is not drawn at all), on other pages the first picture fetched
 * at high priority.
 */

/** The url() images of an element's mask, resolved by the browser. */
function maskImages(el: Element) {
  const style = getComputedStyle(el);
  const value = style.maskImage || style.webkitMaskImage || "";
  return [...value.matchAll(/url\("?([^")]+)"?\)/g)].map((m) => m[1]);
}

/** Loads and decodes an image the way CSS fetches a mask (CORS), so the copy cached is the one the mask uses. */
function decodeMask(src: string) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  return img.decode().catch(() => undefined);
}

/** One promise per picture (and mask) to wait for; none of them ever rejects. */
export function openingAssets(): Promise<unknown>[] {
  const planes = [...document.querySelectorAll<HTMLImageElement>("[data-hero-plate] img")];
  const first = document.querySelector<HTMLImageElement>("main img[fetchpriority=high]");
  const pictures = planes.length ? planes : first ? [first] : [];
  return [
    ...pictures.map((img) => img.decode().catch(() => undefined)),
    ...[...document.querySelectorAll("[data-hero-matte]")].flatMap(maskImages).map(decodeMask),
  ];
}
