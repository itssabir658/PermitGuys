import type { CSSProperties } from "react";
import { ArrowLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { gtaMunicipalities } from "@/content/locations";
import { paths } from "@/lib/routes";

/*
 * Geography without overclaiming. The GTA's regions and their
 * municipalities are listed as the places that each run their own permit
 * review, which is the point a homeowner needs; coverage of any single
 * municipality is confirmed per project (see locations.ts).
 */
export function Regions() {
  return (
    <section aria-labelledby="regions-heading" className="bg-ivory py-24 sm:py-32 lg:py-44">
      <Container>
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Eyebrow code="06">Where we work</Eyebrow>
            <h2 id="regions-heading" data-reveal="" className="mt-10 font-display text-display-lg font-light text-balance text-ink">
              One region. Many rulebooks.
            </h2>
            <p data-reveal="" className="mt-8 max-w-sm text-lede text-ink-muted">
              Each municipality in the Greater Toronto Area sets its own zoning by-law and runs its own building permit review. Tell us where your property is and we will confirm whether we can help.
            </p>
            <ArrowLink href={paths.serviceAreas} className="mt-10">
              Service areas
            </ArrowLink>
          </div>
          <ul className="border-b border-line lg:col-span-7 lg:col-start-6">
            {gtaMunicipalities.map((region, i) => (
              <li key={region.region} data-reveal="" style={{ "--d": i * 80 } as CSSProperties} className="grid gap-3 border-t border-line py-7 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:items-baseline sm:gap-8 lg:py-9">
                <h3 className="font-display text-[clamp(1.75rem,1.1rem+2.2vw,3.25rem)] leading-none font-light tracking-[-0.04em] text-ink">
                  {region.region.replace("City of ", "")}
                </h3>
                <p className="text-label leading-6 text-ink-muted">{region.municipalities.length > 1 ? region.municipalities.map((m) => m.name).join("  ·  ") : "One city, one building department"}</p>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
