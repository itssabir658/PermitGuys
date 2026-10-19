import Link from "next/link";
import { ArrowLink } from "@/components/ui/ButtonLink";
import { Figure } from "@/components/ui/Figure";
import { Placeholder } from "@/components/ui/Placeholder";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getProjects } from "@/lib/content";
import { paths } from "@/lib/routes";

/**
 * Case studies from src/content/projects.ts. With no approved projects the
 * section shows a clearly marked empty state rather than sample work.
 */
export function ProjectProof() {
  const projects = getProjects().slice(0, 3);
  return (
    <Section tone="light" labelledBy="projects-heading" bordered>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          id="projects-heading"
          eyebrow="Projects"
          title="Work we have helped bring to permit."
          intro="Case studies describe real projects, published with our clients' permission."
        />
        <ArrowLink href={paths.projects} className="shrink-0 self-start lg:self-end">
          View projects
        </ArrowLink>
      </div>

      {projects.length > 0 ? (
        <ul className="mt-14 grid gap-10 md:grid-cols-3">
          {projects.map((p) => (
            <li key={p.slug}>
              <Link href={paths.project(p.slug)} className="group block">
                <Figure visual={p.visual} caption={false} />
                <h3 className="mt-6 font-display text-xl text-navy-900 group-hover:text-copper-700">{p.title}</h3>
                <p className="mt-2 text-ink-muted">{p.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-14 grid gap-px border border-dashed border-line-strong bg-line-strong/40 md:grid-cols-3">
          {["Residential addition", "Commercial interior", "Legal basement apartment"].map((label) => (
            <div key={label} className="flex flex-col bg-paper-100 p-7 sm:p-8">
              <div className="bg-drafting-grid aspect-[4/3] border border-dashed border-line-strong" aria-hidden="true" />
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">Case study slot</p>
              <h3 className="mt-2 font-display text-xl text-navy-900">{label}</h3>
              <Placeholder className="mt-4 self-start">approved project details and photos</Placeholder>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
