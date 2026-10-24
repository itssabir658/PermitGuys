import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/LinkButton";
import { coverWidth, coverWidthByHeight, plates, projectOf, type Plate } from "@/content/imagery";
import { getProjects } from "@/lib/content";
import { escapeHtml } from "@/lib/html";
import { paths } from "@/lib/routes";

/*
 * Three client projects, shown as a pinned viewer: a rendering of each,
 * labelled as one, leading to its renderings on the projects page.
 * Approved case studies are listed at the top as soon as any exist.
 *
 * Tracks: three 140vh panels only set the section's length (420vh); one
 * 100vh stage stays pinned over them, holding a single notched frame and
 * the three title blocks. Exactly one project is composed at a time. At each
 * handover the next picture wipes up from the bottom over the last, which
 * dims as it is covered, while the outgoing lines leave upward through
 * their masks and the incoming ones rise into place (HomeMotion, works
 * module). Landscape screens set the frame beside the text, which keeps
 * below the label on short screens; portrait ones stack them in bands, so
 * type never sits on a picture. The page ground turns to stone under the
 * whole section (ground module).
 *
 * The viewer is for screens from 768px wide (pins). On phones held upright
 * the panels flow instead, each project's text above its picture, and each
 * piece arrives as it comes into view (data-arrive; HomeMotion, arrivals):
 * the label and the note rise, the picture unveils upward, the title's
 * lines rise out of their masks. Without the tracks each panel shows its
 * text beside its picture, still.
 *
 * The frames are portrait and the renderings landscape, so each picture is
 * fetched as wide as it is drawn at the frame's height, with the shots'
 * 14% scale.
 */
const shown: Plate[] = [plates.stone, plates.prairieFront, plates.dusk];

const NOTE = "Renderings from client projects. Case studies will appear here as clients approve them.";
const TAG = "Client project · Rendering";

export function Works() {
  const projects = getProjects();
  const items = shown.flatMap((plate) => {
    const project = projectOf(plate);
    return project ? [{ plate, href: paths.projectRenderings(project.id) }] : [];
  });

  return (
    <section data-works="" aria-labelledby="works-heading" className="relative">
      {/* With the viewer: a screen-high sticky layer over the whole track, so the label stays in the corner and scrolls away with the last project. It sits under the stage, so a picture can never be drawn under its ink. Label and note roll in with the stage. */}
      <div className="relative z-0 pins:pointer-events-none pins:absolute pins:inset-0">
        <div className="pins:sticky pins:top-0 pins:h-svh">
          <Container className="pt-28 lg:pins:pt-32 [&_a]:pointer-events-auto">
            <h2 id="works-heading" data-arrive="rise" className="text-label text-ink">
              <span className="split-line">
                <span data-label-roll="" className="block">
                  Selected projects
                </span>
              </span>
            </h2>
            <p data-arrive="rise" className="works-note mt-3 max-w-[36ch] text-[0.8125rem] leading-relaxed text-ink-muted sm:max-w-xs sm:text-[0.875rem]">
              <span className="split-line">
                <span data-label-roll="" className="block">
                  {NOTE}
                </span>
              </span>
            </p>
            {projects.length > 0 ? (
              <ul className="mt-6 space-y-2 text-[0.9375rem]">
                {projects.map((p) => (
                  <li key={p.slug}>
                    <Link href={paths.project(p.slug)} className="link-draw text-ink">
                      Case study: {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </Container>
        </div>
      </div>

      {/* The pinned stage: one frame holding every project's picture, stacked, and one title block per project in the same place. */}
      <div className="pointer-events-none absolute inset-0 z-10 hidden pins:block">
        <div data-works-stage="" className="sticky top-0 h-svh">
          <div data-works-frame="" className="works-stage__frame notch-clip">
            {items.map((s, i) => (
              <div key={s.href} data-works-shot={i} className="works-shot" style={{ zIndex: i }}>
                <Image
                  src={s.plate.src}
                  alt={s.plate.alt}
                  fill
                  sizes={`(min-width: 768px) and (min-aspect-ratio: 1/1) ${coverWidthByHeight(s.plate, "78vh", 1.14)}, ${coverWidth(s.plate, 4 / 3, "100vw", 1.14)}`}
                  quality={80}
                  className="object-cover"
                  style={{ objectPosition: s.plate.focus }}
                />
              </div>
            ))}
          </div>
          {/* Stacked in one cell and top-aligned, so each line rolls into the row the last project's line of the same rank leaves. */}
          <div className="works-items">
            {items.map((s, i) => (
              <div key={s.href} data-works-item={i} className="works-item">
                <div className="mx-auto max-w-site px-5 sm:px-8 lg:px-12 xl:px-16">
                  <p className="text-label text-ink-muted">
                    <span className="split-line">
                      <span data-works-roll="" className="block">
                        {TAG}
                      </span>
                    </span>
                  </p>
                  <h3 data-works-title="" className="works-item__title mt-4 font-display text-display-xl font-light text-ink" dangerouslySetInnerHTML={{ __html: escapeHtml(s.plate.caption) }} />
                  <div className="mt-8">
                    <span className="split-line works-item__button">
                      <span data-works-roll="" data-works-button="" className="block">
                        <LinkButton href={s.href}>
                          View the project<span className="sr-only">: {s.plate.caption}</span>
                        </LinkButton>
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {items.map((s, i) => (
        <div key={s.href} data-works-panel={i} className="works-panel">
          <div className="works-panel__text pins:hidden">
            <p data-arrive="rise" className="text-label text-ink-muted">
              {TAG}
            </p>
            <h3 data-arrive="lines" className="mt-3 font-display text-display-lg font-light text-ink" dangerouslySetInnerHTML={{ __html: escapeHtml(s.plate.caption) }} />
            <div data-arrive="rise" className="mt-6">
              <LinkButton href={s.href}>
                View the project<span className="sr-only">: {s.plate.caption}</span>
              </LinkButton>
            </div>
          </div>
          <div className="works-panel__frame pins:hidden">
            <div data-arrive="mask" className="works-panel__image">
              <Image
                src={s.plate.src}
                alt={s.plate.alt}
                fill
                sizes={`(min-width: 1024px) ${coverWidth(s.plate, 0.8, "40vw")}, ${coverWidth(s.plate, 0.8, "90vw")}`}
                quality={80}
                className="object-cover"
                style={{ objectPosition: s.plate.focus }}
              />
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
