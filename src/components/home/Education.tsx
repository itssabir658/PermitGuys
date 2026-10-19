import { ArrowLink } from "@/components/ui/ButtonLink";
import { LinkRows } from "@/components/ui/LinkRows";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getGuides } from "@/lib/content";
import { paths } from "@/lib/routes";

export function Education() {
  const guides = getGuides();
  return (
    <Section labelledBy="guides-heading">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHeading
            id="guides-heading"
            eyebrow="Permit guides"
            title="Understand the process before you start."
            intro="Plain-language guides to the questions homeowners ask most, with links to the official sources."
          />
          <div className="mt-8">
            <ArrowLink href={paths.guides}>All permit guides</ArrowLink>
          </div>
        </div>
        <div className="lg:col-span-8 lg:pt-4">
          <LinkRows
            items={guides.map((g, i) => ({
              href: paths.guide(g.slug),
              title: g.title,
              description: g.summary,
              meta: `Guide ${String(i + 1).padStart(2, "0")}`,
            }))}
          />
        </div>
      </div>
    </Section>
  );
}
