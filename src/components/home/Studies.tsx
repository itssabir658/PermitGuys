import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ArrowRight } from "@/components/ui/Icons";
import { Plate } from "@/components/ui/Plate";
import { cn } from "@/components/ui/cn";
import { plates, type PlateKey } from "@/content/imagery";
import { getProjects, getService } from "@/lib/content";
import { paths } from "@/lib/routes";

/*
 * Selected work. PermitGuys has no client-approved case studies published
 * yet, so this section shows rendered studies of the project types we
 * prepare drawings for, labelled as studies, and links each to its service.
 * Approved case studies (src/content/projects.ts) are listed above them
 * automatically once they exist.
 */

const studies: { plate: PlateKey; service: string; title: string; layout: string; aspect: string; sizes: string }[] = [
  { plate: "commercial", service: "commercial-permits", title: "Main-street commercial units", layout: "lg:col-span-7", aspect: "aspect-[3/2]", sizes: "(min-width: 1024px) 58vw, 100vw" },
  { plate: "addition", service: "residential-additions", title: "Two-storey rear addition", layout: "lg:col-span-4 lg:col-start-9 lg:mt-48", aspect: "aspect-[4/5]", sizes: "(min-width: 1024px) 33vw, 100vw" },
  { plate: "deck", service: "deck-permits", title: "Rear deck and garden steps", layout: "lg:col-span-4 lg:col-start-2 lg:-mt-24", aspect: "aspect-[4/5]", sizes: "(min-width: 1024px) 33vw, 100vw" },
  { plate: "basement", service: "legal-basement-permits", title: "Legal basement second unit", layout: "lg:col-span-6 lg:col-start-7 lg:mt-24", aspect: "aspect-[3/2]", sizes: "(min-width: 1024px) 50vw, 100vw" },
];

export function Studies() {
  const projects = getProjects();
  return (
    <section aria-labelledby="studies-heading" className="bg-stone-100 py-24 sm:py-32 lg:py-44">
      <Container>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-6">
            <Eyebrow code="03">Selected studies</Eyebrow>
            <h2 id="studies-heading" data-reveal="" className="mt-10 font-display text-display-xl font-light text-balance text-ink">
              The work, drawn before it is built.
            </h2>
          </div>
          <p data-reveal="" className="text-lede text-ink-muted lg:col-span-4 lg:col-start-9 lg:self-end">
            Case studies will appear here as clients approve them for publication. Until then, these rendered studies show the kinds of project we prepare drawings for. None of them is a client project.
          </p>
        </div>

        {projects.length > 0 ? (
          <ul data-reveal="" className="mt-16 divide-y divide-line border-y border-line">
            {projects.map((p) => (
              <li key={p.slug}>
                <Link href={paths.project(p.slug)} className="group flex items-baseline justify-between gap-6 py-6">
                  <span className="link-draw font-display text-display-sm text-ink">{p.title}</span>
                  <span className="text-label text-ink-muted">Case study</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        <ol className="mt-20 grid gap-x-8 gap-y-20 lg:mt-28 lg:grid-cols-12 lg:gap-y-0">
          {studies.map((study, i) => {
            const service = getService(study.service);
            if (!service) return null;
            const plate = plates[study.plate];
            return (
              <li key={study.title} className={cn(study.layout)}>
                <Link href={paths.service(service.slug)} className="group block">
                  <div className="overflow-hidden">
                    <div className="transition-transform duration-[1400ms] ease-out-expo group-hover:scale-[1.03]">
                      <Plate plate={plate} aspect={study.aspect} sizes={study.sizes} caption={false} drift={i % 2 === 0 ? "slow" : undefined} delay={i % 2 ? 150 : 0} />
                    </div>
                  </div>
                  <div className="mt-6 grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-x-6" data-reveal="" style={{ "--d": 100 } as CSSProperties}>
                    <span className="text-label text-ink-muted tabular-nums">Study {String(i + 1).padStart(2, "0")}</span>
                    <h3 className="font-display text-display-sm text-ink">
                      <span className="link-draw">{study.title}</span>
                    </h3>
                    <ArrowRight className="size-4 text-ink transition-transform duration-500 ease-out-expo group-hover:translate-x-1" />
                    <dl className="col-span-3 mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-line pt-4 text-[0.875rem] sm:grid-cols-3">
                      <div>
                        <dt className="text-label text-ink-muted">Service</dt>
                        <dd className="mt-1 text-ink">{service.navLabel}</dd>
                      </div>
                      <div>
                        <dt className="text-label text-ink-muted">For</dt>
                        <dd className="mt-1 text-ink">{service.category === "residential" ? "Homeowners" : "Owners and tenants"}</dd>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <dt className="text-label text-ink-muted">Image</dt>
                        <dd className="mt-1 text-ink">Rendered study</dd>
                      </div>
                    </dl>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>

        <div data-reveal="" className="mt-20 flex justify-center lg:mt-28">
          <ArrowLink href={paths.services}>Explore every service</ArrowLink>
        </div>
      </Container>
    </section>
  );
}
