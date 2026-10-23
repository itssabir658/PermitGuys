import { OntarioOutline } from "@/components/layout/OntarioOutline";
import { CtaPanel } from "@/components/ui/CtaPanel";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ExternalIcon } from "@/components/ui/Icons";
import { LinkRows } from "@/components/ui/LinkRows";
import { PageHeader } from "@/components/ui/PageHeader";
import { Placeholder } from "@/components/ui/Placeholder";
import { PlateBand } from "@/components/ui/PlateBand";
import { Section } from "@/components/ui/Section";
import { plates } from "@/content/imagery";
import { gtaMunicipalities } from "@/content/locations";
import { getLocations } from "@/lib/content";
import { paths } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Service Areas in the Greater Toronto Area",
  description:
    "PermitGuys works with homeowners and property owners in the Greater Toronto Area. Find local permit information and official municipal links.",
  path: paths.serviceAreas,
});

export default function ServiceAreasPage() {
  const confirmed = getLocations();
  return (
    <>
      <PageHeader
        crumbs={[{ name: "Service areas", path: paths.serviceAreas }]}
        pageType="CollectionPage"
        eyebrow="Service areas"
        title="Permit support across the Greater Toronto Area."
        lead="Each GTA municipality runs its own building department, with its own by-laws, forms and submission requirements. We work with homeowners and property owners across the GTA."
      />
      <PlateBand plate={plates.stone} />

      <Section labelledBy="confirmed-heading" first>
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="confirmed-heading" data-reveal-lines="" className="font-display text-display-md text-charcoal-900">
              Municipalities we serve
            </h2>
          </div>
          <div className="lg:col-span-8">
            {confirmed.length > 0 ? (
              <LinkRows items={confirmed.map((l) => ({ href: paths.serviceArea(l.slug), title: l.name, description: l.summary, meta: l.region }))} />
            ) : (
              <Placeholder block>
                list of municipalities PermitGuys has confirmed it serves. Each confirmed municipality gets its own page with local permit information, generated from src/content/locations.ts.
              </Placeholder>
            )}
          </div>
        </div>
      </Section>

      <Section tone="light" labelledBy="official-heading">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="official-heading" data-reveal-lines="" className="font-display text-display-md text-charcoal-900">
              Find your building department
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-muted">
              Your municipality issues your building permit. These are the official websites of municipalities across the GTA, listed for reference.
            </p>
            {/* The province drawn as on the opening screen: a decorative mark, not a map of service boundaries. */}
            <div aria-hidden="true" data-reveal="" data-reveal-type="draw" className="mt-12 hidden w-full max-w-[17rem] text-ink/45 lg:sticky lg:top-32 lg:block">
              <OntarioOutline className="h-auto w-full overflow-visible" />
            </div>
          </div>
          <div className="columns-1 gap-10 sm:columns-2 lg:col-span-8">
            {gtaMunicipalities.map((region) => (
              <div key={region.region} className="mb-10 break-inside-avoid last:mb-0">
                <Eyebrow as="h3">{region.region}</Eyebrow>
                <ul className="mt-4 border-t border-line">
                  {region.municipalities.map((m) => (
                    <li key={m.name} className="row-rule">
                      <a href={m.url} target="_blank" rel="noopener" className="group flex items-center justify-between py-3 text-charcoal-900">
                        <span>
                          <span className="link-draw">{m.name}</span>
                          <span className="sr-only"> official website (opens in a new tab)</span>
                        </span>
                        <ExternalIcon />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Section>
      <CtaPanel title="Tell us where your project is." body="Share the property's municipality and what you are planning, and we will let you know how we can help." />
    </>
  );
}
