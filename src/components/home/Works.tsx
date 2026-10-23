import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/LinkButton";
import { plates, type Plate } from "@/content/imagery";
import { getProjects, getService } from "@/lib/content";
import { escapeHtml } from "@/lib/html";
import { paths } from "@/lib/routes";

/*
 * Three studies, shown as a pinned viewer. There are no approved client
 * projects yet, so these are the rendered studies, labelled as such, each
 * leading to the service it illustrates. Approved case studies are listed
 * at the top as soon as any exist.
 *
 * Tracks: three 140vh panels only set the section's length (420vh); one
 * 100vh stage stays pinned over them, holding a single notched frame and
 * the three title blocks. Exactly one study is composed at a time. At each
 * handover the next picture wipes up from the bottom over the last, which
 * dims as it is covered, while the outgoing lines leave upward through
 * their masks and the incoming ones rise into place (HomeMotion, works
 * module). Landscape screens set the frame beside the text, which keeps
 * below the label on short screens; portrait ones stack them in bands, so
 * type never sits on a picture. The page ground turns to stone under the
 * whole section (ground module).
 *
 * Without the tracks each panel shows its text beside its picture.
 */
const studies: { plate: Plate; service: string; tag: string }[] = [
  { plate: plates.addition, service: "residential-additions", tag: "Residential" },
  { plate: plates.basement, service: "legal-basement-permits", tag: "Residential" },
  { plate: plates.commercial, service: "commercial-permits", tag: "Commercial" },
];

const NOTE = "Rendered studies of the kinds of project we draw. None of them is a client project; case studies will appear here as clients approve them.";

export function Works() {
  const projects = getProjects();
  const items = studies.flatMap((s) => {
    const service = getService(s.service);
    return service ? [{ ...s, href: paths.service(s.service), serviceLabel: service.navLabel }] : [];
  });

  return (
    <section data-works="" aria-labelledby="works-heading" className="relative">
      {/* On the tracks: a screen-high sticky layer over the whole track, so the label stays in the corner and scrolls away with the last study. It sits under the stage, so a picture can never be drawn under its ink. Label and note roll in with the stage. */}
      <div className="relative z-0 tracks:pointer-events-none tracks:absolute tracks:inset-0">
        <div className="tracks:sticky tracks:top-0 tracks:h-svh">
          <Container className="pt-28 lg:tracks:pt-32 [&_a]:pointer-events-auto">
            <h2 id="works-heading" className="text-label text-ink">
              <span className="split-line">
                <span data-label-roll="" className="block">
                  Selected studies
                </span>
              </span>
            </h2>
            <p className="works-note mt-3 max-w-[36ch] text-[0.8125rem] leading-relaxed text-ink-muted sm:max-w-xs sm:text-[0.875rem]">
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

      {/* The pinned stage: one frame holding every study's picture, stacked, and one title block per study in the same place. */}
      <div className="pointer-events-none absolute inset-0 z-10 hidden tracks:block">
        <div data-works-stage="" className="sticky top-0 h-svh">
          <div data-works-frame="" className="works-stage__frame notch-clip">
            {items.map((s, i) => (
              <div key={s.href} data-works-shot={i} className="works-shot" style={{ zIndex: i }}>
                <Image
                  src={s.plate.src}
                  alt={s.plate.alt}
                  fill
                  sizes="(min-width: 768px) and (min-aspect-ratio: 1/1) 40vw, 92vw"
                  quality={80}
                  className="object-cover"
                  style={{ objectPosition: s.plate.focus }}
                />
              </div>
            ))}
          </div>
          {/* Stacked in one cell and top-aligned, so each line rolls into the row the last study's line of the same rank leaves. */}
          <div className="works-items">
            {items.map((s, i) => (
              <div key={s.href} data-works-item={i} className="works-item">
                <div className="mx-auto max-w-site px-5 sm:px-8 lg:px-12 xl:px-16">
                  <p className="text-label text-ink-muted">
                    <span className="split-line">
                      <span data-works-roll="" className="block">
                        {s.tag} · Rendered study
                      </span>
                    </span>
                  </p>
                  <h3 data-works-title="" className="works-item__title mt-4 font-display text-display-xl font-light text-ink" dangerouslySetInnerHTML={{ __html: escapeHtml(s.plate.caption) }} />
                  <div className="mt-8">
                    <span className="split-line works-item__button">
                      <span data-works-roll="" data-works-button="" className="block">
                        <LinkButton href={s.href}>{s.serviceLabel}</LinkButton>
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
          <div className="works-panel__text tracks:hidden">
            <p className="text-label text-ink-muted">
              {s.tag} · Rendered study
            </p>
            <h3 className="mt-3 font-display text-display-lg font-light text-ink">{s.plate.caption}</h3>
            <div className="mt-6">
              <LinkButton href={s.href}>{s.serviceLabel}</LinkButton>
            </div>
          </div>
          <div className="works-panel__frame tracks:hidden">
            <div className="works-panel__image">
              <Image src={s.plate.src} alt={s.plate.alt} fill sizes="(min-width: 1024px) 40vw, 90vw" quality={80} className="object-cover" style={{ objectPosition: s.plate.focus }} />
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
