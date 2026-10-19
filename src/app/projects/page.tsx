import Link from "next/link";
import { CtaPanel } from "@/components/ui/CtaPanel";
import { Figure } from "@/components/ui/Figure";
import { PageHeader } from "@/components/ui/PageHeader";
import { Placeholder } from "@/components/ui/Placeholder";
import { Section } from "@/components/ui/Section";
import { getProjects } from "@/lib/content";
import { paths } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Projects and Case Studies",
  description: "Case studies of permit drawing and permit process work by PermitGuys in the Greater Toronto Area.",
  path: paths.projects,
});

export default function ProjectsPage() {
  const projects = getProjects();
  return (
    <>
      <PageHeader
        crumbs={[{ name: "Projects", path: paths.projects }]}
        eyebrow="Projects"
        title="Projects and case studies."
        lead="Real projects, described accurately and published with our clients' permission."
      />
      <Section labelledBy="projects-list-heading">
        <h2 id="projects-list-heading" className="sr-only">
          Case studies
        </h2>
        {projects.length > 0 ? (
          <ul className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <li key={p.slug}>
                <Link href={paths.project(p.slug)} className="group block">
                  <Figure visual={p.visual} caption={false} />
                  <h3 className="mt-6 font-display text-2xl text-navy-900 group-hover:text-copper-700">{p.title}</h3>
                  <p className="mt-2 text-ink-muted">{p.summary}</p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="font-display text-display-sm text-navy-900">Case studies are being prepared.</p>
              <p className="mt-5 text-lg leading-relaxed text-ink-muted">
                We only publish projects with our clients&apos; permission. In the meantime, our services and permit guides explain how we approach each type of project.
              </p>
              <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
                <Link href={paths.services} className="border-b border-copper-500/60 pb-1 font-medium text-navy-900 hover:border-copper-600">
                  Explore services
                </Link>
                <Link href={paths.guides} className="border-b border-copper-500/60 pb-1 font-medium text-navy-900 hover:border-copper-600">
                  Read permit guides
                </Link>
              </div>
            </div>
            <div className="lg:col-span-7">
              <Placeholder block>
                approved case studies. Add each project to src/content/projects.ts with approved: true and it appears here, on related service pages and on the homepage.
              </Placeholder>
            </div>
          </div>
        )}
      </Section>
      <CtaPanel />
    </>
  );
}
