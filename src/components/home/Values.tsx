import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { coverWidth, plates, type Plate } from "@/content/imagery";
import { escapeHtml } from "@/lib/html";

/*
 * The practice's values. The content is the "How we work" principles from
 * the About page.
 *
 * Tracks: each value has a 100vh block with its picture in the middle,
 * growing from 0.72 to full size as it reaches the centre of the screen.
 * One word stays on screen the whole way through, pinned in the centre:
 * all four words and descriptions are set, stacked in one place, and each
 * rolls through its own mask at its value's moment, the outgoing word up
 * and out as the next rises under it, like an odometer, on clean ivory
 * between two pictures. The text is set twice: ink on the page and ivory
 * clipped to the outline of every picture on screen, so the word turns
 * light exactly where it crosses one; a line of the description shows in
 * one colour or the other, as its row is over a picture or not. Below
 * 1024px the words are fitted a little wider than the picture, so every one
 * of them is split by its edges. A word is never taller than about a sixth
 * of the screen, and shrinks where it would print over the corner label
 * (HomeMotion, values module).
 *
 * The pinned text is decoration over the per-value text, which stays in the
 * page for assistive technology (visually hidden on the tracks) and shows
 * beside each picture without them.
 */
const values: { title: string; body: string; plate: Plate }[] = [
  {
    title: "Clarity",
    body: "Before we design anything, we weigh what you want to build against the zoning and Building Code considerations we can identify for your lot.",
    plate: plates.prairieCorner,
  },
  {
    title: "Candour",
    body: "Some projects also need a survey, a planning approval or another specialist. When yours does, we tell you at the start.",
    plate: plates.farmhouse,
  },
  {
    title: "Ownership",
    body: "You, PermitGuys, other consultants or the municipality: who carries each step is written down, so nothing is assumed.",
    plate: plates.redBrick,
  },
  {
    title: "Integrity",
    body: "We describe what your municipality asks for, not rules of thumb, and we never promise an approval or a date. That decision is the city’s.",
    plate: plates.brick,
  },
];

function ValueText({ tone }: { tone: "ink" | "ivory" }) {
  return (
    <div className={`values-text ${tone === "ink" ? "text-ink" : "text-ivory"}`}>
      <div className="values-text__titles">
        {values.map((v, i) => (
          <p key={v.title} data-values-title={i} className="split-line font-wordmark text-[length:min(clamp(3.25rem,1rem+9vw,10rem),17svh)] leading-[0.9] tracking-[-0.01em] uppercase">
            <span data-values-roll="" className="inline-block">
              {v.title}
            </span>
          </p>
        ))}
      </div>
      <div className="values-text__descs">
        {values.map((v, i) => (
          <p key={v.title} data-values-desc={i} className="text-center text-[1.125rem] leading-relaxed" dangerouslySetInnerHTML={{ __html: escapeHtml(v.body) }} />
        ))}
      </div>
    </div>
  );
}

export function Values() {
  return (
    <section data-values="" aria-labelledby="values-heading" className="relative pb-20 tracks:pb-0">
      {/* On the tracks: a screen-high sticky layer over the whole track, so the label stays in the corner and scrolls away with the last value. It sits under the pictures, so a passing picture covers it rather than the label printing on the picture. Label and note roll in with the stage. */}
      <div className="relative z-0 tracks:pointer-events-none tracks:absolute tracks:inset-0">
        <div className="tracks:sticky tracks:top-0 tracks:h-svh">
          <Container className="pt-28 lg:pt-32">
            <h2 id="values-heading" className="text-label text-ink">
              <span className="split-line">
                <span data-label-roll="" className="block">
                  Our values
                </span>
              </span>
            </h2>
            <p className="mt-3 max-w-[16rem] text-[0.875rem] leading-relaxed text-ink-muted">
              <span className="split-line">
                <span data-label-roll="" className="block">
                  How we work on every project, whatever its size.
                </span>
              </span>
            </p>
          </Container>
        </div>
      </div>

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 hidden tracks:block">
        <div data-values-stage="" className="sticky top-0 h-svh overflow-hidden">
          <ValueText tone="ink" />
          <div data-values-mask="" className="absolute inset-0" style={{ clipPath: "inset(50%)" }}>
            <ValueText tone="ivory" />
          </div>
        </div>
      </div>

      {values.map((v, i) => (
        <div key={v.title} data-values-outer={i} className="values-outer">
          <div data-values-frame="" className="values-frame">
            <div data-values-image="" className="absolute inset-0 overflow-hidden bg-stone-300">
              <Image
                src={v.plate.src}
                alt=""
                fill
                sizes={`(min-width: 1024px) ${coverWidth(v.plate, 3 / 4, "26rem")}, ${coverWidth(v.plate, 3 / 4, "80vw")}`}
                quality={80}
                className="object-cover"
                style={{ objectPosition: v.plate.focus }}
              />
              {/* On the tracks only, a scrim shaped around the text keeps the ivory description legible on bright skies and pale walls; the still layout shows the pictures untouched. */}
              <div aria-hidden="true" className="absolute inset-0 hidden tracks:block" style={{ background: "radial-gradient(70% 45% at 50% 52%, rgb(17 17 16 / 0.58), rgb(17 17 16 / 0.2) 100%)" }} />
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
