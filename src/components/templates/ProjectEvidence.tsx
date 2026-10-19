import Link from "next/link";
import type { CaseStudy } from "@/content/types";
import { Placeholder } from "@/components/ui/Placeholder";
import { paths } from "@/lib/routes";

/** Approved case studies for a service or location, or a marked empty state. */
export function ProjectEvidence({ projects, context }: { projects: CaseStudy[]; context: string }) {
  if (projects.length === 0) {
    return (
      <Placeholder block>
        approved {context} case studies. This block lists real projects automatically once they are added to src/content/projects.ts with approved: true.
      </Placeholder>
    );
  }
  return (
    <ul className="divide-y divide-line border-y border-line">
      {projects.map((p) => (
        <li key={p.slug}>
          <Link href={paths.project(p.slug)} className="block py-6 hover:text-brand-700">
            <span className="font-display text-xl text-charcoal-900">{p.title}</span>
            <span className="mt-1 block text-ink-muted">{p.summary}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
