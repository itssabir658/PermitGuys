import Link from "next/link";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { CtaPanel } from "@/components/ui/CtaPanel";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Figure } from "@/components/ui/Figure";
import { PageHeader } from "@/components/ui/PageHeader";
import { Placeholder } from "@/components/ui/Placeholder";
import { Plate } from "@/components/ui/Plate";
import { Section } from "@/components/ui/Section";
import { clientProjects } from "@/content/imagery";
import { getProjects } from "@/lib/content";
import { paths } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";

// Indexed once it shows anything real: client renderings or approved case
// studies (the sitemap applies the same rule).
export const metadata = pageMetadata({
  title: "Projects",
  description: "Renderings from PermitGuys client projects, one or two views of each house, and case studies as clients approve them.",
  path: paths.projects,
  noindex: getProjects().length === 0 && clientProjects.length === 0,
});

const pad = (n: number) => String(n).padStart(2, "0");

/** Each project's first figure number: figures are numbered through the page. */
const firstFigure = clientProjects.map((_, i) => clientProjects.slice(0, i).reduce((n, p) => n + p.views.length, 1));

/*
 * The client projects, each with its one or two renderings at their own
 * proportions, uncropped, beside a title column that stays in view while
 * its pictures pass (lg). Hairlines run only between projects: the
 * header's closing rule opens the list and the change of ground closes it.
 * Each project's id is its anchor, linked from the homepage. The lead and
 * each title column say they are renderings, so the captions name only
 * the view.
 */
export default function ProjectsPage() {
  const projects = getProjects();
  return (
    <>
      <PageHeader
        crumbs={[{ name: "Projects", path: paths.projects }]}
        pageType="CollectionPage"
        eyebrow="Projects"
        title="Selected projects."
        lead="Renderings from our client projects, one or two views of each house. They show the designs, not finished buildings."
      />
      <Section labelledBy="renderings-heading" first>
        <h2 id="renderings-heading" className="sr-only">
          Client projects
        </h2>
        <div className="divide-y divide-line">
          {clientProjects.map((p, i) => (
            <article key={p.id} id={p.id} aria-labelledby={`${p.id}-title`} className="grid gap-6 pt-6 pb-14 first:pt-0 last:pb-0 lg:grid-cols-12 lg:gap-8 lg:pt-8 lg:pb-24">
              <div data-row="" className="lg:sticky lg:top-28 lg:col-span-4 lg:self-start">
                <p className="text-label text-ink tabular-nums">{pad(i + 1)}</p>
                <h3 id={`${p.id}-title`} className="mt-4 max-w-[18ch] font-display text-display-md font-light text-balance text-charcoal-900">
                  {p.title}
                </h3>
                <p className="mt-3 text-label text-ink-muted">Client project · {p.views.length === 1 ? "Rendering" : "Two renderings"}</p>
              </div>
              <div className="grid gap-10 lg:col-span-8 lg:gap-14">
                {p.views.map((v, j) => (
                  <Plate key={v.plate.src} plate={v.plate} aspect="natural" fig={pad(firstFigure[i] + j)} label={v.view} note={false} sizes="(min-width: 1600px) 61rem, (min-width: 1024px) 60vw, 100vw" />
                ))}
              </div>
            </article>
          ))}
        </div>
      </Section>
      <Section labelledBy="case-studies-heading" tone="light">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Eyebrow>Case studies</Eyebrow>
            <h2 id="case-studies-heading" data-reveal-lines="" className="mt-6 font-display text-display-md text-charcoal-900">
              Projects, written up
            </h2>
          </div>
          <div className="lg:col-span-8">
            {projects.length > 0 ? (
              <ul className="grid gap-12 md:grid-cols-2">
                {projects.map((p) => (
                  <li key={p.slug}>
                    <Link href={paths.project(p.slug)} className="group block">
                      <Figure visual={p.visual} caption={false} />
                      <h3 className="mt-6 font-display text-2xl text-charcoal-900">
                        <span className="link-draw">{p.title}</span>
                      </h3>
                      <p className="mt-2 text-ink-muted">{p.summary}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <>
                <p className="max-w-2xl text-lg leading-relaxed text-ink-muted">
                  Case studies are being prepared. We publish an account of a project only with our client&apos;s permission. In the meantime, our services and permit guides explain how we approach each type of project.
                </p>
                <div data-row="" className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
                  <ArrowLink href={paths.services}>Explore services</ArrowLink>
                  <ArrowLink href={paths.guides}>Read permit guides</ArrowLink>
                </div>
                <Placeholder block className="mt-10 max-w-2xl">
                  approved case studies. Add each project to src/content/projects.ts with approved: true and it appears here, on related service pages and on the homepage.
                </Placeholder>
              </>
            )}
          </div>
        </div>
      </Section>
      <CtaPanel />
    </>
  );
}
