import Link from "next/link";
import type { Service } from "@/content/types";
import { ArrowLink } from "@/components/ui/ButtonLink";
import { Figure } from "@/components/ui/Figure";
import { IndexList } from "@/components/ui/IndexList";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/components/ui/cn";
import { getService, getServices } from "@/lib/content";
import { otherWork as alsoDrawn } from "@/content/other-work";
import { paths } from "@/lib/routes";

/** High-value work, given a full spread each. */
const featured = [
  {
    slug: "residential-additions",
    kicker: "Residential additions",
    title: "Room to grow, drawn to be reviewed.",
    body: "Rear, side and second-storey additions bring zoning and the Building Code together. We look at both before drawing, so the design starts from what your lot allows.",
  },
  {
    slug: "commercial-permits",
    kicker: "Commercial and landlord projects",
    title: "Commercial spaces with fewer surprises.",
    body: "Fit-outs, tenant improvements and changes of use raise questions about occupancy, exits and fire separations. We define the scope early and coordinate the drawings with the consultants your project needs.",
  },
];

/** Everyday homeowner work, set as a drawing list. */
const everyday = ["legal-basement-permits", "deck-permits", "interior-renovation-permits", "landlord-permits", "custom-home-permits"];

function FeatureSpread({ service, kicker, title, body, reverse }: { service: Service; kicker: string; title: string; body: string; reverse?: boolean }) {
  return (
    <article className="grid gap-10 border-t border-line pt-10 lg:grid-cols-12 lg:gap-12 lg:pt-14">
      <Figure
        visual={service.visual}
        tone={reverse ? "light" : "dark"}
        aspect="aspect-[16/11]"
        sizes="(min-width: 1024px) 58vw, 100vw"
        className={cn("lg:col-span-7", reverse && "lg:col-start-6 lg:row-start-1")}
      />
      <div className={cn("flex flex-col lg:col-span-5", reverse ? "lg:col-start-1 lg:row-start-1" : "lg:pt-6")}>
        <p className="font-mono text-[0.72rem] font-medium uppercase tracking-[0.14em] text-copper-700">{kicker}</p>
        <h3 className="mt-4 font-display text-display-md text-balance text-navy-900">{title}</h3>
        <p className="mt-5 text-lg leading-relaxed text-ink-muted">{body}</p>
        <div className="mt-8">
          <p className="text-sm font-semibold text-navy-900">Applications usually include</p>
          <ul className="mt-3 divide-y divide-line border-y border-line text-[0.95rem] text-ink">
            {service.typicalRequirements.items.slice(0, 3).map((item) => (
              <li key={item} className="flex gap-3 py-3">
                <span aria-hidden="true" className="mt-2.5 h-px w-3 shrink-0 bg-copper-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-8">
          <ArrowLink href={paths.service(service.slug)}>{service.name}</ArrowLink>
        </div>
      </div>
    </article>
  );
}

export function ServiceIntro() {
  const all = getServices();
  const rows = everyday.map((slug) => all.find((s) => s.slug === slug)).filter((s): s is Service => Boolean(s));

  return (
    <Section labelledBy="services-heading">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
        <SectionHeading
          id="services-heading"
          code="01"
          eyebrow="Services"
          title="From a backyard deck to a commercial fit-out."
          intro="We prepare the permit drawings and documentation your application needs, and explain each step in plain language."
          className="lg:col-span-8"
        />
        <ArrowLink href={paths.services} className="self-start justify-self-start lg:col-span-4 lg:justify-self-end lg:self-end">
          All services
        </ArrowLink>
      </div>

      <div className="mt-14 space-y-16 lg:mt-20 lg:space-y-24">
        {featured.map((f, i) => {
          const service = getService(f.slug);
          return service ? <FeatureSpread key={f.slug} service={service} kicker={f.kicker} title={f.title} body={f.body} reverse={i === 1} /> : null;
        })}
      </div>

      <div className="mt-20 grid gap-10 lg:mt-28 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-4">
          <h3 className="font-display text-display-sm text-navy-900">Everyday homeowner projects</h3>
          <p className="mt-4 max-w-sm leading-relaxed text-ink-muted">Most of the permits homeowners need start here. Each page explains what is usually involved and what the city decides.</p>
        </div>
        <div className="lg:col-span-8">
          <IndexList items={rows.map((service) => ({ href: paths.service(service.slug), title: service.navLabel, description: service.summary }))} />

          <div className="mt-10">
            <p className="font-mono text-[0.72rem] font-medium uppercase tracking-[0.14em] text-copper-700">Also on our drawing board</p>
            <ul className="mt-4 flex flex-wrap gap-x-2 gap-y-2 text-[0.95rem] leading-relaxed text-navy-900">
              {alsoDrawn.map((item, i) => (
                <li key={item.label} className="flex items-baseline gap-2">
                  <Link href={item.href} className="underline decoration-line-strong underline-offset-4 hover:text-copper-700 hover:decoration-copper-500">
                    {item.label}
                  </Link>
                  {i < alsoDrawn.length - 1 ? <span aria-hidden="true" className="text-line-strong">/</span> : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
}
