import type { CaseStudy } from "@/content/types";
import { ArticleLayout, ArticleSection, RuledList } from "@/components/ui/Article";
import { CtaPanel } from "@/components/ui/CtaPanel";
import { Figure } from "@/components/ui/Figure";
import { PageHeader } from "@/components/ui/PageHeader";
import { getLocation, pickServices } from "@/lib/content";
import { paths } from "@/lib/routes";
import { RelatedContent } from "./RelatedContent";

const toc = [
  { id: "brief", label: "The brief" },
  { id: "scope", label: "Our scope" },
  { id: "outcome", label: "Outcome" },
  { id: "related", label: "Related services" },
];

/** Rendered only for approved case studies (see lib/content). */
export function CaseStudyTemplate({ project }: { project: CaseStudy }) {
  const path = paths.project(project.slug);
  const location = project.location ? getLocation(project.location) : undefined;
  return (
    <>
      <PageHeader
        crumbs={[
          { name: "Projects", path: paths.projects },
          { name: project.title, path },
        ]}
        eyebrow={location ? `Case study · ${location.name}` : "Case study"}
        title={project.title}
        lead={project.summary}
        aside={<Figure visual={project.visual} tone="dark" captionOnDark framed priority />}
      />
      <ArticleLayout toc={toc}>
        <ArticleSection id="brief" title="The brief">
          <div className="prose-pg">
            {project.brief.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </ArticleSection>
        <ArticleSection id="scope" title="Our scope">
          <RuledList items={project.scope} />
        </ArticleSection>
        <ArticleSection id="outcome" title="Outcome">
          {project.outcome.length ? (
            <div className="prose-pg">
              {project.outcome.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          ) : (
            <p className="text-ink-muted">The outcome will be added when the project is complete.</p>
          )}
        </ArticleSection>
        <ArticleSection id="related" title="Related services">
          <RelatedContent services={pickServices(project.services)} guides={[]} />
        </ArticleSection>
      </ArticleLayout>
      <CtaPanel />
    </>
  );
}
