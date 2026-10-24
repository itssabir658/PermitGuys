/*
 * The pictures a page opens on, which the preloader and the page transition
 * wait for before they open onto it: on the homepage the hero's two planes
 * (the house is cut out in its own picture, so there is nothing else to
 * wait for), on other pages the first picture fetched at high priority.
 */

/** One promise per picture to wait for; none of them ever rejects. */
export function openingAssets(): Promise<unknown>[] {
  const planes = [...document.querySelectorAll<HTMLImageElement>("[data-hero-plate] img")];
  const first = document.querySelector<HTMLImageElement>("main img[fetchpriority=high]");
  const pictures = planes.length ? planes : first ? [first] : [];
  return pictures.map((img) => img.decode().catch(() => undefined));
}
