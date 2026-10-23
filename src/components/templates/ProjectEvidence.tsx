import Link from "next/link";
import type { CaseStudy } from "@/content/types";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Placeholder } from "@/components/ui/Placeholder";
import { paths } from "@/lib/routes";

/**
 * Approved case studies for a service or location, or a marked empty state.
 * With `renderings`, the empty state also points to the client renderings
 * on the projects page (not for a location: the renderings name no place).
 */
export function ProjectEvidence({ projects, context, renderings }: { projects: CaseStudy[]; context: string; renderings?: boolean }) {
  if (projects.length === 0) {
    return (
      <>
        {renderings ? (
          <>
            <p className="prose-pg">Written-up projects appear here as clients approve them. Renderings from our client projects are on the projects page.</p>
            <div data-row="" className="mt-6">
              <ArrowLink href={paths.projects}>See client renderings</ArrowLink>
            </div>
          </>
        ) : null}
        <Placeholder block className={renderings ? "mt-10 max-w-(--measure-article)" : "max-w-(--measure-article)"}>
          approved {context} case studies. This block lists real projects automatically once they are added to src/content/projects.ts with approved: true.
        </Placeholder>
      </>
    );
  }
  return (
    <ul className="border-t border-line">
      {projects.map((p) => (
        <li key={p.slug} className="row-rule">
          <Link href={paths.project(p.slug)} className="group block py-6">
            <span className="link-draw font-display text-xl text-charcoal-900">{p.title}</span>
            <span className="mt-1 block text-ink-muted">{p.summary}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
