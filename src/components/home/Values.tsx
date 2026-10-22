import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { plates, type Plate } from "@/content/imagery";
import { escapeHtml } from "@/lib/html";

/*
 * The practice's values, after the reference's Values section
 * (docs/MOTION.md, "Values"). The content is the "How we work" principles
 * from the About page.
 *
 * Tracks: each value has a 110vh block with its picture in the middle,
 * growing from half size to full size as it passes the top of the screen.
 * One title and description stay pinned in the centre and change to the
 * value whose picture is nearest; the title rises in over a fifth of a
 * screen and out over two fifths, the description's lines slide up from
 * their masks and leave at twice the title's speed. The text is set twice:
 * ink on the page and ivory clipped to the picture's live outline, so one
 * line of type turns light exactly where it crosses the image.
 *
 * The pinned text is decoration over the per-value text, which stays in the
 * page for assistive technology (visually hidden on the tracks) and shows
 * beside each picture without them.
 */
const values: { title: string; body: string; plate: Plate }[] = [
  {
    title: "Clarity",
    body: "Before drawing anything, we look at what you want to build against the zoning and Building Code considerations we can identify for your lot.",
    plate: plates.detail,
  },
  {
    title: "Candour",
    body: "Some projects also need an engineer, a survey or a planning approval. When yours does, we flag it at the start.",
    plate: plates.aerial,
  },
  {
    title: "Ownership",
    body: "You, PermitGuys, other consultants or the municipality: who carries each step is written down, so nothing is assumed.",
    plate: plates.front,
  },
  {
    title: "Integrity",
    body: "We describe what your municipality asks for, not rules of thumb, and we never promise an approval or a date. That decision is the city’s.",
    plate: plates.storefront,
  },
];

function ValueText({ tone }: { tone: "ink" | "ivory" }) {
  return (
    <div className={`values-text ${tone === "ink" ? "text-ink" : "text-ivory"}`}>
      <p data-values-title="" className="font-wordmark text-[clamp(3.25rem,1rem+9vw,10rem)] leading-[0.9] tracking-[-0.01em] uppercase" dangerouslySetInnerHTML={{ __html: escapeHtml(values[0].title) }} />
      <p data-values-desc="" className="mt-8 max-w-[22rem] text-center text-[1.0625rem] leading-relaxed" dangerouslySetInnerHTML={{ __html: escapeHtml(values[0].body) }} />
    </div>
  );
}

export function Values() {
  return (
    <section data-values="" aria-labelledby="values-heading" className="relative pb-20 tracks:pb-0">
      {/* On the tracks: a screen-high sticky layer over the whole track, so the label stays in the corner and scrolls away with the last value. */}
      <div className="relative z-20 tracks:pointer-events-none tracks:absolute tracks:inset-0">
        <div className="tracks:sticky tracks:top-0 tracks:h-svh">
          <Container className="pt-28 lg:pt-32">
            <h2 id="values-heading" className="text-label text-ink">
              Our values
            </h2>
            <p className="mt-3 max-w-xs text-[0.875rem] leading-relaxed text-ink-muted">How we work on every project, whatever its size.</p>
          </Container>
        </div>
      </div>

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 hidden tracks:block">
        <div data-values-stage="" className="sticky top-0 h-svh overflow-hidden">
          <ValueText tone="ink" />
          <div data-values-mask="" className="absolute inset-0" style={{ clipPath: "inset(50% 50% 50% 50%)" }}>
            <ValueText tone="ivory" />
          </div>
        </div>
      </div>

      {values.map((v, i) => (
        <div key={v.title} data-values-outer={i} data-title={v.title} data-desc={v.body} className="values-outer">
          <div data-values-frame="" className="values-frame">
            <div data-values-image="" className="absolute inset-0 overflow-hidden bg-stone-300">
              <Image src={v.plate.src} alt="" fill sizes="(min-width: 1024px) 34vw, 80vw" quality={80} className="object-cover" style={{ objectPosition: v.plate.focus }} />
              <div aria-hidden="true" className="absolute inset-0 bg-black/40" />
            </div>
          </div>
          <div className="values-outer__text tracks:sr-only">
            <h3 className="font-wordmark text-[clamp(2.4rem,1rem+5vw,5rem)] leading-[0.9] uppercase">{v.title}</h3>
            <p className="mt-4 max-w-md leading-relaxed text-ink-muted">{v.body}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
