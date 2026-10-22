import Link from "next/link";
import { ArrowLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { plateForService } from "@/content/imagery";
import { otherWork } from "@/content/other-work";
import { getServices } from "@/lib/content";
import { paths } from "@/lib/routes";
import { ServiceIndex } from "./ServiceIndex";

export function Services() {
  // Homes first, then businesses and landlords, as the index reads.
  const services = [...getServices()].sort((a, b) => (a.category === b.category ? 0 : a.category === "residential" ? -1 : 1));
  return (
    <section id="services" aria-labelledby="services-heading" className="scroll-mt-24 bg-ivory pb-24 sm:pb-32 lg:pb-44">
      <Container>
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-8">
          <div className="lg:col-span-7">
            <Eyebrow code="02">Services</Eyebrow>
            <h2 id="services-heading" data-reveal="" className="mt-10 font-display text-display-xl font-light text-balance text-ink">
              Seven kinds of project, one standard of drawing.
            </h2>
          </div>
          <div data-reveal="" className="lg:col-span-4 lg:col-start-9 lg:pb-3">
            <p className="text-lede text-ink-muted">From a deck in the backyard to a tenant fit-out on a main street, every set is prepared for the review it will face.</p>
            <ArrowLink href={paths.services} className="mt-7">
              All services
            </ArrowLink>
          </div>
        </div>

        <div className="mt-16 lg:mt-24">
          <ServiceIndex
            items={services.map((s) => ({
              href: paths.service(s.slug),
              title: s.navLabel,
              summary: s.summary,
              category: s.category === "residential" ? "Homes" : "Business",
              plate: plateForService(s.slug),
            }))}
          />
        </div>

        <div data-reveal="" className="mt-12 grid gap-4 lg:grid-cols-12 lg:gap-8">
          <p className="text-label text-ink-muted lg:col-span-3">Also within our scope</p>
          <ul className="flex flex-wrap gap-x-7 gap-y-3 text-[0.9375rem] text-ink-muted lg:col-span-9">
            {otherWork.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="link-draw hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
