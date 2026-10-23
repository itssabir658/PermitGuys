import { CtaPanel } from "@/components/ui/CtaPanel";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LinkRows } from "@/components/ui/LinkRows";
import { PageHeader } from "@/components/ui/PageHeader";
import { PlateBand } from "@/components/ui/PlateBand";
import { Section } from "@/components/ui/Section";
import { plates } from "@/content/imagery";
import { getGuides } from "@/lib/content";
import { paths } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Building Permit Guides for GTA Homeowners",
  description:
    "Plain-language guides to building permits in Ontario: when you need one, additions, basement apartments, and permit costs and timelines.",
  path: paths.guides,
});

export default function GuidesPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ name: "Permit guides", path: paths.guides }]}
        pageType="CollectionPage"
        eyebrow="Resources"
        title="Permit guides for homeowners."
        lead="Clear answers to common building permit questions, with links to the official sources. Your municipality has the final word on your project."
      />
      <PlateBand plate={plates.basement} />
      <Section labelledBy="guides-list-heading" first>
        <div className="grid gap-10 lg:grid-cols-12">
          <div data-row="" className="lg:col-span-4">
            <Eyebrow as="h2" id="guides-list-heading">
              All guides
            </Eyebrow>
          </div>
          <div className="lg:col-span-8">
            <LinkRows
              headingLevel="h3"
              items={getGuides().map((g, i) => ({
                href: paths.guide(g.slug),
                title: g.title,
                description: g.summary,
                meta: `Guide ${String(i + 1).padStart(2, "0")}`,
              }))}
            />
          </div>
        </div>
      </Section>
      <CtaPanel />
    </>
  );
}
