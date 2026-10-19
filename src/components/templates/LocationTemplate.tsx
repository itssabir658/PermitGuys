import type { Location } from "@/content/types";
import { ArticleLayout, ArticleSection, RuledList } from "@/components/ui/Article";
import { CtaPanel } from "@/components/ui/CtaPanel";
import { ExternalIcon } from "@/components/ui/Icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { getProjectsForLocation, pickGuides, pickServices } from "@/lib/content";
import { paths } from "@/lib/routes";
import { ProjectEvidence } from "./ProjectEvidence";
import { RelatedContent } from "./RelatedContent";

const toc = [
  { id: "coverage", label: "Coverage" },
  { id: "local-permits", label: "Local permit information" },
  { id: "official", label: "Official municipal links" },
  { id: "projects", label: "Local projects" },
  { id: "related", label: "Related services and guides" },
];

/** Rendered only for locations with coverage "confirmed" (see lib/content). */
export function LocationTemplate({ location }: { location: Location }) {
  const path = paths.serviceArea(location.slug);
  return (
    <>
      <PageHeader
        crumbs={[
          { name: "Service areas", path: paths.serviceAreas },
          { name: location.name, path },
        ]}
        eyebrow={location.region}
        title={`Permit drawings and permit guidance in ${location.name}`}
        lead={location.summary}
      />
      <ArticleLayout toc={toc}>
        <ArticleSection id="coverage" title="Coverage">
          <p className="prose-pg">PermitGuys has confirmed it works with homeowners and property owners in {location.name}.</p>
        </ArticleSection>

        <ArticleSection id="local-permits" title={`Building permits in ${location.name}`}>
          <div className="space-y-10">
            {location.localPermitInfo.map((block) => (
              <div key={block.heading}>
                <h3 className="text-lg font-semibold text-navy-900">{block.heading}</h3>
                <div className="prose-pg mt-3">
                  {block.paragraphs.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
                {block.list ? (
                  <div className="mt-6">
                    <RuledList items={block.list} />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </ArticleSection>

        <ArticleSection id="official" title="Official municipal links">
          <ul className="space-y-3">
            {location.officialLinks.map((link) => (
              <li key={link.url}>
                <a href={link.url} target="_blank" rel="noopener" className="inline-flex items-center gap-2 font-medium text-navy-900 underline decoration-line-strong underline-offset-4 hover:text-copper-700">
                  {link.label}
                  <ExternalIcon />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </ArticleSection>

        <ArticleSection id="projects" title={`Projects in ${location.name}`}>
          <ProjectEvidence projects={getProjectsForLocation(location.slug)} context={location.name} />
        </ArticleSection>

        <ArticleSection id="related" title="Related services and guides">
          <RelatedContent services={pickServices(location.relatedServices)} guides={pickGuides(location.relatedGuides)} />
        </ArticleSection>
      </ArticleLayout>
      <CtaPanel title={`Planning a project in ${location.name}?`} />
    </>
  );
}
