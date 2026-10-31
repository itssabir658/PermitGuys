import Link from "next/link";
import { CtaPanel } from "@/components/ui/CtaPanel";
import { IndexList } from "@/components/ui/IndexList";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ArrowRight } from "@/components/ui/Icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { PlateBand } from "@/components/ui/PlateBand";
import { Section } from "@/components/ui/Section";
import { plates } from "@/content/imagery";
import { otherWork } from "@/content/other-work";
import { getServicesByCategory } from "@/lib/content";
import { paths } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Permit Drawing and Permit Services",
  description:
    "Residential and commercial permit services in the GTA: additions, basements, below-grade entrances, wall removals, garages, decks, custom homes and commercial work.",
  path: paths.services,
});

const groups = [
  {
    id: "residential",
    eyebrow: "Homes",
    title: "Residential",
    intro: "Additions, basements and their entrances, structural openings, garages, decks and new homes, for homeowners across the GTA.",
    category: "residential" as const,
  },
  {
    id: "commercial",
    eyebrow: "Businesses and landlords",
    title: "Commercial and rental",
    intro: "Interior renovations, commercial spaces and rental properties.",
    category: "commercial" as const,
  },
];

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ name: "Services", path: paths.services }]}
        pageType="CollectionPage"
        eyebrow="Services"
        title="Architecture, engineering and permit drawings, from the first idea to the municipal review."
        lead="We design the project, work out its engineering and prepare the drawings and documentation a building permit application needs. Choose a service to see what it involves."
      />
      <PlateBand plate={plates.farmhouse} />
      {groups.map((g, i) => (
        <Section key={g.id} labelledBy={`${g.id}-heading`} bordered={i > 0} first={i === 0}>
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Eyebrow>{g.eyebrow}</Eyebrow>
              <h2 id={`${g.id}-heading`} data-reveal-lines="" className="mt-6 font-display text-display-md text-charcoal-900">
                {g.title}
              </h2>
              <p className="mt-4 max-w-sm leading-relaxed text-ink-muted">{g.intro}</p>
            </div>
            <div className="lg:col-span-8">
              <IndexList
                start={i === 0 ? 1 : getServicesByCategory("residential").length + 1}
                columns={["No.", "Service", "What it covers"]}
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
      <Section labelledBy="other-work-heading" tone="light">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Eyebrow>Also on our drawing board</Eyebrow>
            <h2 id="other-work-heading" data-reveal-lines="" className="mt-6 font-display text-display-sm text-charcoal-900">
              Other work we take on
            </h2>
          </div>
          <ul className="border-t border-line lg:col-span-8">
            {otherWork.map((item) => (
              <li key={item.label} className="row-rule">
                <Link href={item.href} className="group flex items-center justify-between gap-6 py-4 text-lg text-charcoal-900">
                  <span className="link-draw">{item.label}</span>
                  <ArrowRight className="size-4 shrink-0 text-ink transition-transform duration-300 ease-(--e-ui) group-hover:translate-x-1" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Section>
      <CtaPanel title="Not sure which service fits?" body="Tell us what you are planning. We will help you work out which drawings and approvals the project is likely to need." />
    </>
  );
}
