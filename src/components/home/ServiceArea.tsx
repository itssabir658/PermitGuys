import Link from "next/link";
import { ArrowLink } from "@/components/ui/ButtonLink";
import { Placeholder } from "@/components/ui/Placeholder";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { gtaMunicipalities } from "@/content/locations";
import { getLocations } from "@/lib/content";
import { paths } from "@/lib/routes";

export function ServiceArea() {
  const confirmed = getLocations();
  return (
    <Section labelledBy="area-heading" bordered>
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <SectionHeading
            id="area-heading"
            code="05"
            size="md"
            eyebrow="Service area"
            title="Across the Greater Toronto Area."
            intro="Every municipality runs its own building department, by-laws and submission requirements, so we confirm them for each property."
          />
          <div className="mt-8">
            <ArrowLink href={paths.serviceAreas}>View service areas</ArrowLink>
          </div>
        </div>
        <div className="lg:col-span-8">
          {confirmed.length > 0 ? (
            <ul className="grid border-t border-navy-900 sm:grid-cols-2">
              {confirmed.map((l) => (
                <li key={l.slug} className="border-b border-line">
                  <Link href={paths.serviceArea(l.slug)} className="group block py-5 sm:pr-6">
                    <span className="font-display text-2xl text-navy-900 group-hover:text-copper-700">{l.name}</span>
                    <span className="mt-1 block text-sm text-ink-muted">{l.region}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <>
              <p className="border-b border-navy-900 pb-3 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-ink-muted">The regions of the GTA, for reference</p>
              <dl className="grid gap-x-10 sm:grid-cols-2">
                {gtaMunicipalities.map((r) => (
                  <div key={r.region} className="border-b border-line py-5">
                    <dt className="font-display text-2xl text-navy-900">{r.region}</dt>
                    <dd className="mt-1 text-ink-muted">{r.municipalities.map((m) => m.name).join(", ")}</dd>
                  </div>
                ))}
              </dl>
              <Placeholder block className="mt-8">
                confirm which municipalities PermitGuys serves. Until then, this lists the GTA&apos;s regions for reference only and does not claim coverage.
              </Placeholder>
            </>
          )}
        </div>
      </div>
    </Section>
  );
}
