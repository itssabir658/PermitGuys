import type { Guide } from "@/content/types";
import { ArticleLayout, ArticleSection, RuledList } from "@/components/ui/Article";
import { CtaPanel } from "@/components/ui/CtaPanel";
import { DataTableView } from "@/components/ui/DataTable";
import { DirectAnswer } from "@/components/ui/DirectAnswer";
import { FaqList } from "@/components/ui/FaqList";
import { JsonLd } from "@/components/ui/JsonLd";
import { PageHeader } from "@/components/ui/PageHeader";
import { Placeholder } from "@/components/ui/Placeholder";
import { SourceList, formatDate } from "@/components/ui/SourceList";
import { pickGuides, pickServices } from "@/lib/content";
import { guidePageFacts, guideSchema } from "@/lib/jsonld";
import { paths } from "@/lib/routes";
import { RelatedContent } from "./RelatedContent";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export function GuideTemplate({ guide }: { guide: Guide }) {
  const path = paths.guide(guide.slug);
  const sections = guide.sections.map((s) => ({ ...s, id: slugify(s.heading) }));
  const toc = [
    ...sections.map((s) => ({ id: s.id, label: s.heading })),
    ...(guide.keyTerms?.length ? [{ id: "key-terms", label: "Key terms" }] : []),
    ...(guide.faqs.length ? [{ id: "faq", label: "Questions" }] : []),
    { id: "sources", label: "Sources and review" },
    { id: "related", label: "Related" },
  ];

  return (
    <>
      <PageHeader
        crumbs={[
          { name: "Permit guides", path: paths.guides },
          { name: guide.title, path },
        ]}
        eyebrow="Permit guide"
        title={guide.title}
        lead={guide.summary}
        schemaExtra={guidePageFacts(guide)}
      >
        <DirectAnswer>{guide.directAnswer}</DirectAnswer>
        <p className="mt-6 text-sm text-ink-muted">
          {guide.lastReviewed ? (
            <>Last reviewed {formatDate(guide.lastReviewed)}</>
          ) : (
            <Placeholder>review date, set once a qualified reviewer has checked this guide</Placeholder>
          )}
        </p>
      </PageHeader>

      <ArticleLayout toc={toc}>
        {sections.map((section) => (
          <ArticleSection key={section.id} id={section.id} title={section.heading}>
            <div className="prose-pg">
              {section.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            {section.list ? (
              <div className="mt-8">
                <RuledList items={section.list} />
              </div>
            ) : null}
            {section.table ? <DataTableView table={section.table} /> : null}
          </ArticleSection>
        ))}

        {guide.keyTerms?.length ? (
          <ArticleSection id="key-terms" title="Key terms">
            <dl className="max-w-3xl divide-y divide-line border-y border-line">
              {guide.keyTerms.map((t) => (
                <div key={t.term} className="grid gap-2 py-5 sm:grid-cols-[12rem_1fr] sm:gap-8">
                  <dt className="font-semibold text-charcoal-900">{t.term}</dt>
                  <dd className="leading-relaxed text-ink">{t.definition}</dd>
                </div>
              ))}
            </dl>
          </ArticleSection>
        ) : null}

        {guide.faqs.length ? (
          <ArticleSection id="faq" title="Questions">
            <FaqList faqs={guide.faqs} />
          </ArticleSection>
        ) : null}

        <ArticleSection
          id="sources"
          title="Sources and review"
          intro="This guide is general information, not legal or code advice. Requirements change, and your municipality decides what applies to your property."
        >
          <SourceList sources={guide.sources} />
          <div className="mt-10 border-t border-line pt-8 text-[0.95rem] text-ink-muted">
            <h3 className="font-semibold text-charcoal-900">Reviewed by</h3>
            <p className="mt-2">
              {guide.reviewer ? (
                <>
                  {guide.reviewer.name}, {guide.reviewer.credentials}
                </>
              ) : (
                <Placeholder>name and verified credentials of the person who reviews this guide</Placeholder>
              )}
            </p>
          </div>
        </ArticleSection>

        <ArticleSection id="related" title="Related guides and services">
          <RelatedContent services={pickServices(guide.relatedServices)} guides={pickGuides(guide.relatedGuides)} />
        </ArticleSection>
      </ArticleLayout>

      <CtaPanel title="Have a question about your own project?" primaryLabel="Ask About Your Project" />
      <JsonLd data={guideSchema(guide, path)} />
    </>
  );
}
