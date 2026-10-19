import Link from "next/link";
import type { Service } from "@/content/types";
import { ArrowLink } from "@/components/ui/ButtonLink";
import { Drawing } from "@/components/ui/Drawing";
import { Figure } from "@/components/ui/Figure";
import { ArrowRight } from "@/components/ui/Icons";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/components/ui/cn";
import { getServices } from "@/lib/content";
import { otherWork } from "@/content/other-work";
import { paths } from "@/lib/routes";
import { ServiceFilter, type ServiceFilterId } from "./ServiceFilter";

/*
 * Services as a bento grid of glass cards. Additions and commercial work,
 * the high-value projects, get double-size cards with their drawing and what
 * an application usually includes; everyday homeowner work gets single
 * cards. A filter narrows the grid to homes or businesses and landlords.
 */

const featured: Record<string, { kicker: string; title: string; body: string; className?: string }> = {
  "residential-additions": {
    kicker: "Residential additions",
    title: "Room to grow, drawn to be reviewed.",
    body: "Rear, side and second-storey additions bring zoning and the Building Code together. We look at both before drawing, so the design starts from what your lot allows.",
  },
  "commercial-permits": {
    kicker: "Commercial and landlord projects",
    title: "Commercial spaces with fewer surprises.",
    body: "Fit-outs, tenant improvements and changes of use raise questions about occupancy, exits and fire separations. We define the scope early and coordinate the drawings with the consultants your project needs.",
    // Sits on the right of the grid, so the two large cards alternate.
    className: "lg:col-start-2",
  },
};

/** Card order: each large card followed by the smaller cards beside it. */
const order = ["residential-additions", "legal-basement-permits", "deck-permits", "commercial-permits", "landlord-permits", "interior-renovation-permits", "custom-home-permits"];

const categoryLabel: Record<Service["category"], string> = { residential: "Home", commercial: "Business" };

const cardBase =
  "spotlight group glass relative rounded-3xl transition-transform duration-500 ease-out-soft hover:-translate-y-1 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-4 has-[a:focus-visible]:outline-brand-600";

/** The card's main link stretches over the whole card. */
const stretched = "after:absolute after:inset-0 after:rounded-3xl after:content-[''] focus-visible:outline-none";

function FeaturedCard({ service }: { service: Service }) {
  const copy = featured[service.slug];
  return (
    <article data-category={service.category} className={cn(cardBase, "grid gap-2 p-2 sm:p-3 md:col-span-2 lg:row-span-2 lg:grid-cols-2", copy.className)}>
      <Figure visual={service.visual} tone="dark" caption={false} aspect="aspect-[16/11] lg:aspect-auto lg:h-full" sizes="(min-width: 1024px) 30vw, 100vw" className="lg:h-full" />
      <div className="flex flex-col p-4 sm:p-5 lg:p-6">
        <p className="text-label text-brand-700">{copy.kicker}</p>
        <h3 className="mt-4 font-display text-display-sm text-balance text-charcoal-900">{copy.title}</h3>
        <p className="mt-4 leading-relaxed text-ink-muted">{copy.body}</p>
        <p className="mt-6 text-sm font-semibold text-charcoal-900">Applications usually include</p>
        <ul className="mt-3 space-y-2 text-[0.95rem] text-ink">
          {service.typicalRequirements.items.slice(0, 3).map((item) => (
            <li key={item} className="flex gap-3">
              <span aria-hidden="true" className="mt-[0.55rem] size-1.5 shrink-0 rounded-full bg-brand-500" />
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-8">
          <Link
            href={paths.service(service.slug)}
            className={cn("inline-flex min-h-11 items-center gap-3 rounded-xl bg-charcoal-900 pr-2 pl-5 text-[0.95rem] font-semibold text-paper transition-colors group-hover:bg-charcoal-800", stretched)}
          >
            {service.navLabel}
            <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-lg bg-white/10">
              <ArrowRight className="size-4 transition-transform duration-300 ease-out-soft group-hover:translate-x-0.5" />
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}

function ServiceCard({ service }: { service: Service }) {
  return (
    <article data-category={service.category} className={cn(cardBase, "flex flex-col overflow-hidden p-6 sm:p-7")}>
      <span className="w-fit rounded-full border border-charcoal-900/10 bg-white/60 px-2.5 py-1 text-label text-charcoal-800">{categoryLabel[service.category]}</span>
      <h3 className="mt-5 font-display text-2xl leading-tight text-charcoal-900">
        <Link href={paths.service(service.slug)} className={stretched}>
          {service.navLabel}
        </Link>
      </h3>
      <p className="mt-3 leading-relaxed text-ink-muted">{service.summary}</p>
      <div aria-hidden="true" className="mt-auto flex items-end justify-between gap-4 pt-6">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-charcoal-900/15 text-charcoal-900 transition-all duration-300 ease-out-soft group-hover:border-brand-500 group-hover:bg-brand-500 group-hover:text-white">
          <ArrowRight className="size-4 transition-transform duration-300 ease-out-soft group-hover:translate-x-0.5" />
        </span>
        <Drawing variant={service.visual.drawing} className="-mr-3 -mb-4 h-24 w-auto text-charcoal-900 opacity-55 transition-opacity duration-500 group-hover:opacity-90" />
      </div>
    </article>
  );
}

export function ServiceIntro() {
  const all = getServices();
  const services = order.map((slug) => all.find((s) => s.slug === slug)).filter((s): s is Service => Boolean(s));
  const counts: Record<ServiceFilterId, number> = {
    all: services.length,
    residential: services.filter((s) => s.category === "residential").length,
    commercial: services.filter((s) => s.category === "commercial").length,
  };

  return (
    <Section labelledBy="services-heading" className="bg-glow-paper">
      <ServiceFilter
        counts={counts}
        className="mt-12 lg:mt-16"
        heading={
          <SectionHeading
            id="services-heading"
            code="01"
            eyebrow="Services"
            title="From a backyard deck to a commercial fit-out."
            intro="We prepare the permit drawings and documentation your application needs, and explain each step in plain language."
          />
        }
      >
        {services.map((service) =>
          featured[service.slug] ? <FeaturedCard key={service.slug} service={service} /> : <ServiceCard key={service.slug} service={service} />,
        )}
        <div data-category="all" className="glass flex flex-col rounded-3xl p-6 sm:p-7 lg:col-span-2">
          <h3 className="font-display text-2xl text-charcoal-900">Also on our drawing board</h3>
          <p className="mt-3 max-w-xl leading-relaxed text-ink-muted">Other work we take on. If your project is not listed, ask us about it.</p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {otherWork.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-10 items-center rounded-full border border-charcoal-900/10 bg-white/70 px-4 text-sm font-medium text-charcoal-900 transition-colors hover:border-brand-500 hover:bg-white hover:text-brand-800"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-8">
            <ArrowLink href={paths.services}>All services</ArrowLink>
          </div>
        </div>
      </ServiceFilter>
    </Section>
  );
}
