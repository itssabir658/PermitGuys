import { ArticleLayout, ArticleSection, RuledList } from "@/components/ui/Article";
import { CtaPanel } from "@/components/ui/CtaPanel";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PageHeader } from "@/components/ui/PageHeader";
import { PlateBand } from "@/components/ui/PlateBand";
import { StepList } from "@/components/ui/StepList";
import { plates } from "@/content/imagery";
import { homeSteps } from "@/content/process";
import { paths } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "How the Permit Drawing Process Works",
  description:
    "How PermitGuys works: from your first project details to drawings, documentation and support through the municipal building permit review.",
  path: paths.howItWorks,
});

const toc = [
  { id: "steps", label: "The five steps" },
  { id: "responsibilities", label: "Who does what" },
  { id: "prepare", label: "What to have ready" },
];

const responsibilities = [
  {
    who: "PermitGuys",
    items: [
      "Assess the project scope and the requirements we can identify.",
      "Prepare the permit drawings and assemble the documentation.",
      "Coordinate with engineers or specialists the project needs.",
      "Help you understand review comments and revise our drawings.",
    ],
  },
  {
    who: "You",
    items: [
      "Describe the project and share property information you have.",
      "Make design decisions and approve the drawings.",
      "Pay municipal permit fees and any other consultants directly, unless agreed otherwise.",
      "Arrange construction and inspections once a permit is issued.",
    ],
  },
  {
    who: "Your municipality",
    items: [
      "Reviews the application against the Building Code and applicable law.",
      "Asks for clarification or revisions where needed.",
      "Decides whether to issue the permit and carries out inspections.",
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ name: "How it works", path: paths.howItWorks }]}
        eyebrow="How it works"
        title="From your first question to the municipal review."
        lead="A building permit involves several parties. Here is how the work is divided, so you know what to expect at each step."
      />
      <PlateBand plate={plates.aerial} />
      <ArticleLayout toc={toc}>
        <ArticleSection id="steps" title="The five steps">
          <StepList steps={homeSteps} />
        </ArticleSection>
        <ArticleSection id="responsibilities" title="Who does what">
          <div className="grid gap-10 xl:grid-cols-3">
            {responsibilities.map((r) => (
              <div key={r.who}>
                <Eyebrow as="h3" className="mb-4">
                  {r.who}
                </Eyebrow>
                <RuledList items={r.items} />
              </div>
            ))}
          </div>
        </ArticleSection>
        <ArticleSection id="prepare" title="What to have ready" intro="None of these are required to start a conversation, but they help us assess your project sooner.">
          <RuledList
            items={[
              "The property address and municipality.",
              "A short description of what you want to build or change.",
              "Any existing drawings, a survey of the property or photos of the existing conditions.",
              "Any correspondence or review comments you have already received from the municipality.",
            ]}
          />
        </ArticleSection>
      </ArticleLayout>
      {/* This page is the panel's usual second action, so it offers the services instead. */}
      <CtaPanel secondary={{ href: paths.services, label: "Explore services" }} />
    </>
  );
}
