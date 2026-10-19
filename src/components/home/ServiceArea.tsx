import { ButtonLink } from "@/components/ui/ButtonLink";
import { Placeholder } from "@/components/ui/Placeholder";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { gtaMunicipalities } from "@/content/locations";
import { getLocations } from "@/lib/content";
import { paths } from "@/lib/routes";
import Link from "next/link";

export function ServiceArea() {
  const confirmed = getLocations();
  return (
    <Section labelledBy="area-heading">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <SectionHeading
            id="area-heading"
            eyebrow="Service area"
            title="Focused on the Greater Toronto Area."
            intro="Every municipality runs its own building department, by-laws and submission requirements. We work with homeowners and property owners across the GTA."
          />
          <div className="mt-10">
            <ButtonLink href={paths.serviceAreas} variant="secondary">
              View service areas
            </ButtonLink>
          </div>
        </div>
        <div className="lg:col-span-7">
          {confirmed.length > 0 ? (
            <ul className="grid gap-px border border-line bg-line sm:grid-cols-2">
              {confirmed.map((l) => (
                <li key={l.slug} className="bg-paper">
                  <Link href={paths.serviceArea(l.slug)} className="block p-6 hover:bg-paper-100">
                    <span className="font-display text-xl text-navy-900">{l.name}</span>
                    <span className="mt-1 block text-sm text-ink-muted">{l.region}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="border border-line">
              <p className="border-b border-line px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">
                The regions of the GTA
              </p>
              <ul className="grid sm:grid-cols-2">
                {gtaMunicipalities.map((r) => (
                  <li key={r.region} className="border-b border-line px-6 py-5 sm:odd:border-r">
                    <span className="font-display text-xl text-navy-900">{r.region}</span>
                    <span className="mt-1 block text-sm text-ink-muted">{r.municipalities.map((m) => m.name).join(", ")}</span>
                  </li>
                ))}
              </ul>
              <div className="p-6">
                <Placeholder block>
                  confirm which municipalities PermitGuys serves. Until then, this lists the GTA&apos;s regions for reference only and does not claim coverage.
                </Placeholder>
              </div>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
