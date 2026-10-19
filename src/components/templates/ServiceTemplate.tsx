import type { Service } from "@/content/types";
import { ArticleLayout, ArticleSection, Note, RuledList } from "@/components/ui/Article";
import { CtaPanel } from "@/components/ui/CtaPanel";
import { DirectAnswer } from "@/components/ui/DirectAnswer";
import { FaqList } from "@/components/ui/FaqList";
import { Figure } from "@/components/ui/Figure";
import { JsonLd } from "@/components/ui/JsonLd";
import { PageHeader } from "@/components/ui/PageHeader";
import { StepList } from "@/components/ui/StepList";
import { getProjectsForService, pickGuides, pickServices } from "@/lib/content";
import { serviceSchema } from "@/lib/jsonld";
import { paths } from "@/lib/routes";
import { ProjectEvidence } from "./ProjectEvidence";
import { RelatedContent } from "./RelatedContent";

const toc = [
  { id: "overview", label: "Overview" },
  { id: "who", label: "Who it is for" },
  { id: "requirements", label: "Typical requirements" },
  { id: "process", label: "Process and responsibilities" },
  { id: "cost-timeline", label: "Cost and timeline factors" },
  { id: "projects", label: "Projects" },
  { id: "faq", label: "Questions" },
  { id: "related", label: "Related guides and services" },
];

export function ServiceTemplate({ service }: { service: Service }) {
  const path = paths.service(service.slug);
  const projects = getProjectsForService(service.slug);
  return (
    <>
      <PageHeader
        crumbs={[
          { name: "Services", path: paths.services },
          { name: service.name, path },
        ]}
        eyebrow={service.category === "residential" ? "Residential service" : "Commercial service"}
        title={service.name}
        aside={<Figure visual={service.visual} tone="dark" captionOnDark framed priority sizes="(min-width: 1024px) 40vw, 100vw" />}
      >
        <DirectAnswer onDark>{service.directAnswer}</DirectAnswer>
      </PageHeader>

      <ArticleLayout toc={toc}>
        <ArticleSection id="overview" title="What does this service include?">
          <div className="prose-pg">
            {service.overview.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </ArticleSection>

        <ArticleSection id="who" title="Who is this service for?">
          <RuledList items={service.whoItsFor} />
        </ArticleSection>

        <ArticleSection id="requirements" title="What does a permit application usually need?" intro={service.typicalRequirements.intro}>
          <RuledList items={service.typicalRequirements.items} />
          <Note>{service.typicalRequirements.qualifier}</Note>
        </ArticleSection>

        <ArticleSection
          id="process"
          title="Who does what, step by step?"
          intro="Each step shows who carries it. We prepare drawings and documentation; the municipality reviews the application and decides on the permit."
        >
          <StepList steps={service.process} />
        </ArticleSection>

        <ArticleSection
          id="cost-timeline"
          title="What affects cost and timing?"
          intro="We do not publish set prices or timelines because both depend on the project. These are the factors that shape them."
        >
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h3 className="mb-4 text-lg font-semibold text-navy-900">Cost factors</h3>
              <RuledList items={service.costFactors} />
            </div>
            <div>
              <h3 className="mb-4 text-lg font-semibold text-navy-900">Timeline factors</h3>
              <RuledList items={service.timelineFactors} />
            </div>
          </div>
        </ArticleSection>

        <ArticleSection id="projects" title="Examples of our work">
          <ProjectEvidence projects={projects} context={service.navLabel.toLowerCase()} />
        </ArticleSection>

        <ArticleSection id="faq" title="Common questions">
          <FaqList faqs={service.faqs} />
        </ArticleSection>

        <ArticleSection id="related" title="Related guides and services">
          <RelatedContent services={pickServices(service.relatedServices)} guides={pickGuides(service.relatedGuides)} />
        </ArticleSection>
      </ArticleLayout>

      <CtaPanel
        title={`Discuss your ${service.navLabel.toLowerCase().replace(/ permits$/, "")} project.`}
        href={paths.contactFor(service.slug)}
      />
      <JsonLd data={serviceSchema(service, path)} />
    </>
  );
}
