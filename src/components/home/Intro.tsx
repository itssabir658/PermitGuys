import Image from "next/image";
import type { CSSProperties } from "react";
import { plates, type Plate } from "@/content/imagery";
import { escapeHtml } from "@/lib/html";
import { ORBIT_SLOTS, introPhases } from "@/lib/motion/home";

/** The two paragraphs that cut in and out at the centre. */
const copy = [
  "PermitGuys is a permit drawing and consulting practice based in Oakville, working with homeowners, landlords and businesses across the Greater Toronto Area.",
  "We prepare permit drawings and application documents, and support you through the municipality’s review, from a deck in the backyard to a tenant fit-out on a main street.",
];

/** Orbit slots 1 to 6, as on the reference homepage. */
const studies: Plate[] = [plates.detail, plates.deck, plates.front, plates.aerial, plates.storefront, plates.basement];

/**
 * The introduction, after the reference's orbit (docs/MOTION.md, "Intro
 * orbit"). The track is computed from the number of paragraphs (600vh for
 * two) and holds a 100vh stage. Six rendered studies spread out from the
 * centre and circle it, each at its own radius and speed, while the two
 * paragraphs rise through the middle one after the other; at the end the
 * ring is flung outward. All of it is scrubbed by scroll (HomeMotion, intro
 * module), so it runs backwards on the way up.
 *
 * The images are decoration here, so they are hidden from assistive
 * technology; the paragraphs are the content. Without the tracks the
 * paragraphs simply stand one above the other.
 */
export function Intro() {
  const { sectionVh } = introPhases(copy.length);
  return (
    <section
      data-intro=""
      aria-labelledby="intro-heading"
      className="relative tracks:h-(--intro-h)"
      style={{ "--intro-h": `${sectionVh}vh` } as CSSProperties}
    >
      <h2 id="intro-heading" className="sr-only">
        About PermitGuys
      </h2>
      <div className="relative isolate overflow-hidden tracks:sticky tracks:top-0 tracks:h-svh">
        <ul aria-hidden="true" className="intro-orbit">
          {studies.map((plate, i) => (
            <li
              key={plate.src}
              data-orbit-slot={i + 1}
              className="intro-orbit__item"
              style={{ "--size": `${ORBIT_SLOTS[i + 1].size}vh` } as CSSProperties}
            >
              <Image src={plate.src} alt="" fill sizes="20vh" quality={75} className="object-cover" style={{ objectPosition: plate.focus }} />
            </li>
          ))}
        </ul>

        <div className="relative z-10 mx-auto grid max-w-site gap-14 px-5 py-32 sm:px-8 lg:px-12 tracks:absolute tracks:inset-0 tracks:block tracks:py-0">
          {copy.map((text, i) => (
            <p
              key={i}
              data-intro-copy=""
              className="intro-copy mx-auto max-w-[19ch] text-center font-display text-[clamp(1.65rem,0.9rem+2.6vw,3.4rem)] leading-[1.1] font-light tracking-[-0.035em] text-ink sm:max-w-[24ch]"
              dangerouslySetInnerHTML={{ __html: escapeHtml(text) }}
            />
          ))}
        </div>

        <p className="absolute inset-x-0 bottom-6 z-10 px-5 text-center text-label text-ink-muted lg:bottom-8">Rendered studies for illustration, not client projects.</p>
      </div>
    </section>
  );
}
