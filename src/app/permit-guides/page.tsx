import { CtaPanel } from "@/components/ui/CtaPanel";
import { LinkRows } from "@/components/ui/LinkRows";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
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
        eyebrow="Resources"
        title="Permit guides for homeowners."
        lead="Clear answers to common building permit questions, with links to the official sources. Your municipality has the final word on your project."
      />
      <Section labelledBy="guides-list-heading">
        <h2 id="guides-list-heading" className="sr-only">
          All guides
        </h2>
        <LinkRows
          headingLevel="h3"
          items={getGuides().map((g, i) => ({
            href: paths.guide(g.slug),
            title: g.title,
            description: g.summary,
            meta: `Guide ${String(i + 1).padStart(2, "0")}`,
          }))}
        />
      </Section>
      <CtaPanel />
    </>
  );
}
