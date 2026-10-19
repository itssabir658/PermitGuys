import { CtaPanel } from "@/components/ui/CtaPanel";
import { LinkRows } from "@/components/ui/LinkRows";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { getServicesByCategory } from "@/lib/content";
import { paths } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Permit Drawing and Permit Services",
  description:
    "Residential and commercial permit services in the GTA: additions, basement apartments, decks, custom homes, interior renovations, commercial and landlord permits.",
  path: paths.services,
});

const groups = [
  { id: "residential", title: "Residential", category: "residential" as const },
  { id: "commercial", title: "Commercial and rental", category: "commercial" as const },
];

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ name: "Services", path: paths.services }]}
        eyebrow="Services"
        title="Permit drawings and permit guidance, from first question to municipal review."
        lead="We prepare the drawings and documentation a building permit application needs, and help you understand each step. Choose a service to see what it involves."
      />
      {groups.map((g, i) => (
        <Section key={g.id} labelledBy={`${g.id}-heading`} tone={i % 2 ? "light" : "paper"} bordered={i > 0}>
          <div className="grid gap-10 lg:grid-cols-12">
            <h2 id={`${g.id}-heading`} className="font-display text-display-md text-navy-900 lg:col-span-4">
              {g.title}
            </h2>
            <div className="lg:col-span-8">
              <LinkRows
                items={getServicesByCategory(g.category).map((s) => ({
                  href: paths.service(s.slug),
                  title: s.name,
                  description: s.summary,
                }))}
              />
            </div>
          </div>
        </Section>
      ))}
      <CtaPanel title="Not sure which service fits?" body="Tell us what you are planning. We will help you work out which drawings and approvals the project is likely to need." />
    </>
  );
}
