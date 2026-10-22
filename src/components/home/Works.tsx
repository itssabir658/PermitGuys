import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/LinkButton";
import { plates, type Plate } from "@/content/imagery";
import { getProjects, getService } from "@/lib/content";
import { paths } from "@/lib/routes";

/*
 * Three studies, after the reference's Works section (docs/MOTION.md,
 * "Works"). There are no approved client projects yet, so these are the
 * rendered studies, labelled as such, each leading to the service it
 * illustrates. Approved case studies are listed at the top as soon as any
 * exist.
 *
 * Tracks: each study has a 150vh panel holding its picture, and a 100vh
 * stage stays pinned over all three. A study's title, type and button sit
 * in the stage and resolve as its panel reaches the middle of the screen:
 * arriving ones travel down into place, leaving ones carry on up, each
 * element in a tighter window than the last. Pictures grow from half size
 * to full size at their moment. The page ground takes a faint wash of each
 * study's colour (`tint`) as it passes.
 *
 * Without the tracks each panel shows its text beside its picture.
 */
const studies: { plate: Plate; service: string; tag: string; tint: string }[] = [
  { plate: plates.addition, service: "residential-additions", tag: "Residential", tint: "#e9e4d8" },
  { plate: plates.basement, service: "legal-basement-permits", tag: "Residential", tint: "#e5e2d9" },
  { plate: plates.commercial, service: "commercial-permits", tag: "Commercial", tint: "#e8ddd5" },
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
      {/* On the tracks: a screen-high sticky layer over the whole track, so the label stays in the corner and scrolls away with the last study. */}
      <div className="relative z-20 tracks:pointer-events-none tracks:absolute tracks:inset-0">
        <div className="tracks:sticky tracks:top-0 tracks:h-svh">
          <Container className="pt-28 lg:tracks:pt-32 [&_a]:pointer-events-auto">
            <h2 id="works-heading" className="text-label text-ink">
              Selected studies
            </h2>
            <p className="mt-3 max-w-xs text-[0.875rem] leading-relaxed text-ink-muted">{NOTE}</p>
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

      {/* The pinned stage: one title block per study, stacked in the same place. */}
      <div className="pointer-events-none absolute inset-0 z-10 hidden tracks:block">
        <div className="sticky top-0 h-svh">
          {items.map((s, i) => (
            <div key={s.href} data-works-item={i} className="works-item">
              <p data-works-type="" className="text-label text-ink-muted">
                {s.tag} · Rendered study
              </p>
              <h3 data-works-title="" className="mt-4 font-display text-display-xl font-light text-ink">
                {s.plate.caption}
              </h3>
              <div data-works-button="" className="mt-8">
                <LinkButton href={s.href}>{s.serviceLabel}</LinkButton>
              </div>
            </div>
          ))}
        </div>
      </div>

      {items.map((s, i) => (
        <div key={s.href} data-works-panel={i} data-tint={s.tint} className="works-panel">
          <div className="works-panel__text tracks:hidden">
            <p className="text-label text-ink-muted">
              {s.tag} · Rendered study
            </p>
            <h3 className="mt-3 font-display text-display-lg font-light text-ink">{s.plate.caption}</h3>
            <div className="mt-6">
              <LinkButton href={s.href}>{s.serviceLabel}</LinkButton>
            </div>
          </div>
          <div className="works-panel__frame">
            <div data-works-image="" className="works-panel__image">
              <Image src={s.plate.src} alt={s.plate.alt} fill sizes="(min-width: 1024px) 40vw, 90vw" quality={80} className="object-cover" style={{ objectPosition: s.plate.focus }} />
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
