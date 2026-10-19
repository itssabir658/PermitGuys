import Link from "next/link";
import { ArrowLink } from "@/components/ui/ButtonLink";
import { Drawing } from "@/components/ui/Drawing";
import { ArrowRight } from "@/components/ui/Icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Section } from "@/components/ui/Section";
import { cn } from "@/components/ui/cn";
import { getServices } from "@/lib/content";
import { paths } from "@/lib/routes";

const order = [
  "residential-additions",
  "commercial-permits",
  "landlord-permits",
  "interior-renovation-permits",
  "legal-basement-permits",
  "deck-permits",
  "custom-home-permits",
];

export function ServiceIntro() {
  const services = getServices()
    .slice()
    .sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));

  return (
    <Section labelledBy="services-heading">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          id="services-heading"
          eyebrow="Services"
          title="Permit drawings for residential and commercial projects."
          intro="From a deck to a commercial fit-out, we prepare the drawings and documentation your application needs and help you understand each step."
        />
        <ArrowLink href={paths.services} className="shrink-0 self-start lg:self-end">
          All services
        </ArrowLink>
      </div>

      <ul className="mt-14 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {services.map((service, i) => {
          const lead = i === 0;
          return (
            <li key={service.slug} className={cn("bg-paper", lead && "sm:col-span-2")}>
              <Link href={paths.service(service.slug)} className="group flex h-full flex-col p-7 transition-colors hover:bg-paper-100 sm:p-8">
                <div className={cn("bg-drafting-grid -mx-2 mb-8 flex items-center justify-center text-navy-900", lead ? "aspect-[2.2/1]" : "aspect-[1.6/1]")}>
                  <Drawing variant={service.visual.drawing} className="h-full w-full max-w-[22rem] p-3 transition-transform duration-500 ease-out-soft group-hover:scale-[1.02]" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-copper-700">
                  {service.category === "residential" ? "Residential" : "Commercial"}
                </p>
                <h3 className={cn("mt-3 font-display text-navy-900", lead ? "text-display-sm" : "text-xl")}>{service.navLabel}</h3>
                <p className="mt-3 leading-relaxed text-ink-muted">{service.summary}</p>
                <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-medium text-navy-900">
                  Learn more
                  <span className="sr-only"> about {service.name.toLowerCase()}</span>
                  <ArrowRight className="size-4 text-copper-600 transition-transform duration-300 ease-out-soft group-hover:translate-x-1" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
