import type { Location } from "@/content/types";
import { ArticleLayout, ArticleSection, Note, RuledList } from "@/components/ui/Article";
import { CtaPanel } from "@/components/ui/CtaPanel";
import { DirectAnswer } from "@/components/ui/DirectAnswer";
import { FaqList } from "@/components/ui/FaqList";
import { ExternalIcon } from "@/components/ui/Icons";
import { JsonLd } from "@/components/ui/JsonLd";
import { PageHeader } from "@/components/ui/PageHeader";
import { QuickOverview } from "@/components/ui/QuickOverview";
import { getProjectsForLocation, pickGuides, pickServices } from "@/lib/content";
import { faqPageSchema, locationServiceSchema } from "@/lib/jsonld";
import { paths } from "@/lib/routes";
import { ProjectEvidence } from "./ProjectEvidence";
import { RelatedContent } from "./RelatedContent";

const longDate = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-CA", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** Rendered only for locations with coverage "confirmed" (see lib/content). */
export function LocationTemplate({ location }: { location: Location }) {
  const path = paths.serviceArea(location.slug);
  const projects = getProjectsForLocation(location.slug);
  const faqs = location.faqs ?? [];
  const toc = [
    ...(location.quickFacts?.length ? [{ id: "quick-overview", label: "Quick permit overview" }] : []),
    { id: "local-permits", label: "Local permit information" },
    ...(faqs.length ? [{ id: "faq", label: "Questions" }] : []),
    { id: "official", label: "Official municipal links" },
    ...(projects.length ? [{ id: "projects", label: "Local projects" }] : []),
    { id: "related", label: "Related services and guides" },
  ];
  return (
    <>
      <PageHeader
        crumbs={[
          { name: "Service areas", path: paths.serviceAreas },
          { name: location.name, path },
        ]}
        eyebrow={location.region}
        title={`Building permits and permit drawings in ${location.name}, ON`}
      >
        <DirectAnswer>{location.summary}</DirectAnswer>
      </PageHeader>
      <ArticleLayout toc={toc}>
        {location.quickFacts?.length ? (
          <ArticleSection id="quick-overview" title="Quick permit overview">
            <QuickOverview facts={location.quickFacts} />
          </ArticleSection>
        ) : null}

        <ArticleSection id="local-permits" title={`Building permits in ${location.name}`}>
          <div className="space-y-10">
            {location.localPermitInfo.map((block) => (
              <div key={block.heading}>
                <h3 className="text-lg font-semibold text-charcoal-900">{block.heading}</h3>
                <div className="mt-6">
                  <RuledList items={block.paragraphs} />
                </div>
                {block.list ? (
                  <div className="mt-6">
                    <RuledList items={block.list} />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <Note>
            {location.checkedOn
              ? `Summarised from the ${location.authority ?? "municipality"}'s own pages, read on ${longDate(location.checkedOn)}. These are not complete lists and rules change: the building department decides for each property, so check the official pages below.`
              : "Rules change and the building department decides for each property, so check the official pages below."}
          </Note>
        </ArticleSection>

        {faqs.length ? (
          <ArticleSection id="faq" title="Common questions">
            <FaqList faqs={faqs} />
          </ArticleSection>
        ) : null}

        <ArticleSection id="official" title="Official municipal links">
          <ul className="space-y-3">
            {location.officialLinks.map((link) => (
              <li key={link.url}>
                <a href={link.url} target="_blank" rel="noopener" className="inline-flex items-center gap-2 font-medium text-charcoal-900 underline decoration-line-strong underline-offset-4 transition-[text-decoration-color] duration-300 ease-(--e-ui) hover:decoration-current">
                  {link.label}
                  <ExternalIcon />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </ArticleSection>

        {projects.length ? (
          <ArticleSection id="projects" title={`Projects in ${location.name}`}>
            <ProjectEvidence projects={projects} context={location.name} />
          </ArticleSection>
        ) : null}

        <ArticleSection id="related" title="Related services and guides">
          <RelatedContent services={pickServices(location.relatedServices)} guides={pickGuides(location.relatedGuides)} />
        </ArticleSection>
      </ArticleLayout>
      <CtaPanel title={`Planning a project in ${location.name}?`} />
      <JsonLd data={[locationServiceSchema(location, path), ...(faqs.length ? [faqPageSchema(faqs, path)] : [])]} />
    </>
  );
}
