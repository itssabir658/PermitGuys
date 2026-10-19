import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Figure } from "@/components/ui/Figure";
import { ArrowLink } from "@/components/ui/ButtonLink";
import { getService } from "@/lib/content";
import { paths } from "@/lib/routes";

/** Editorial section for the two highest-value project types. */
export function FeaturedProjects() {
  const additions = getService("residential-additions");
  const commercial = getService("commercial-permits");
  if (!additions || !commercial) return null;

  const items = [
    {
      service: additions,
      kicker: "Residential additions",
      title: "Room to grow, designed to be reviewed.",
      body: "Rear, side and second-storey additions bring zoning and the Building Code together. We look at both early, so the drawings start from what your lot allows.",
    },
    {
      service: commercial,
      kicker: "Commercial and landlord projects",
      title: "Commercial spaces with fewer surprises.",
      body: "Fit-outs, tenant improvements and changes of use raise questions about occupancy, exits and fire separations. We define the scope and coordinate the drawings with the consultants your project needs.",
    },
  ];

  return (
    <section aria-labelledby="featured-heading" className="bg-navy-900 text-paper">
      <Container className="py-20 sm:py-28 lg:py-32">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Eyebrow onDark>Larger projects</Eyebrow>
            <h2 id="featured-heading" className="mt-5 font-display text-display-lg text-balance">
              Additions and commercial projects deserve a careful start.
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-navy-100/80 lg:col-span-5">
            The decisions made before drawings begin shape the whole application. We help you make them with the requirements in view.
          </p>
        </div>

        <div className="mt-16 grid gap-16 lg:grid-cols-2 lg:gap-12">
          {items.map(({ service, kicker, title, body }, i) => (
            <article key={service.slug} className={i === 1 ? "lg:mt-24" : undefined}>
              <Figure visual={service.visual} tone="dark" aspect="aspect-[4/3]" />
              <p className="mt-10 text-xs font-semibold uppercase tracking-[0.18em] text-copper-300">{kicker}</p>
              <h3 className="mt-4 font-display text-display-md text-balance">{title}</h3>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-navy-100/80">{body}</p>
              <div className="mt-8">
                <ArrowLink href={paths.service(service.slug)} onDark>
                  {service.name}
                </ArrowLink>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-20 flex flex-col items-start gap-6 border-t border-paper/15 pt-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-lg text-navy-100/85">Planning an addition or a commercial project? Start with a conversation.</p>
          <ButtonLink href={paths.contact} variant="copper">
            Discuss Your Project
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
