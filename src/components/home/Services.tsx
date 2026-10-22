import Image from "next/image";
import Link from "next/link";
import { ArrowLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { plateForService } from "@/content/imagery";
import { otherWork } from "@/content/other-work";
import { escapeHtml } from "@/lib/html";
import { getServices } from "@/lib/content";
import { paths } from "@/lib/routes";

const LEAD = "Permit drawings and guidance for every kind of project.";

/*
 * Services on the night ground, after the reference's Services section
 * (docs/MOTION.md, "Services").
 *
 * Beside the list, one framed picture holds a strip of every service's
 * study. Hovering or focusing a service slides the strip to its picture,
 * smoothed so it settles in about a quarter of a second. As the frame
 * scrolls in it wipes up from the bottom while the picture settles from a
 * slight zoom; the heading's lines rise out of their masks and the rows
 * arrive one after another, each a little further down the scroll.
 *
 * On phones the section becomes a 300vh track with the list pinned, and the
 * picture follows the row that scrolling has reached.
 */
export function Services() {
  // Homes first, then businesses and landlords.
  const services = [...getServices()].sort((a, b) => (a.category === b.category ? 0 : a.category === "residential" ? -1 : 1));
  return (
    <section id="services" data-services="" data-tone="dark" aria-labelledby="services-heading" className="relative bg-charcoal-900 text-ivory">
      <div data-services-track="" className="services-track">
        <div className="services-stage">
          <Container className="services-grid grid gap-12 md:grid-cols-12 md:gap-8">
            <div className="md:col-span-7 lg:col-span-6">
              <p className="text-label text-charcoal-300">Services</p>
              <h2
                id="services-heading"
                data-services-heading=""
                className="services-heading mt-5 max-w-[17ch] font-display text-display-lg font-light"
                dangerouslySetInnerHTML={{ __html: escapeHtml(LEAD) }}
              />
              <ol data-services-body="" className="services-list mt-10 border-t border-ivory/15 lg:mt-14">
                {services.map((s, i) => (
                  <li key={s.slug} data-service-index={i} className="services-item border-b border-ivory/15">
                    <Link href={paths.service(s.slug)} className="group grid min-h-11 grid-cols-[2.25rem_1fr_auto] items-baseline gap-4 py-3.5 lg:py-5">
                      <span className="text-label text-charcoal-300 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                      <span className="services-item__label font-display text-[clamp(1.5rem,1.1rem+1.2vw,2.35rem)] leading-[1.1] font-light tracking-[-0.03em]">{s.navLabel}</span>
                      <span className="text-label text-charcoal-300">{s.category === "residential" ? "Homes" : "Business"}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>

            <div data-services-frame="" aria-hidden="true" className="services-frame-col md:col-span-5 md:col-start-8">
              <div className="services-frame-pin">
                <div className="services-frame notch-clip">
                  <div data-services-reveal="" className="absolute inset-0 overflow-hidden">
                    <div data-services-zoom="" className="absolute inset-0">
                      <div data-services-strip="" className="absolute inset-0">
                        {services.map((s, i) => {
                          const plate = plateForService(s.slug);
                          return (
                            <div key={s.slug} className="absolute inset-x-0 h-full" style={{ top: `${i * 100}%` }}>
                              <Image src={plate.src} alt="" fill sizes="(min-width: 768px) 36vw, 60vw" quality={75} className="object-cover" style={{ objectPosition: plate.focus }} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-label text-charcoal-300">Rendered studies, not client projects.</p>
              </div>
            </div>
          </Container>
        </div>
      </div>

      <Container className="pb-28 lg:pb-40">
        <div className="grid gap-6 border-t border-ivory/15 pt-10 md:grid-cols-12 md:gap-8">
          <p className="text-label text-charcoal-300 md:col-span-4">Also within our scope</p>
          <ul className="flex flex-wrap gap-x-7 gap-y-3 text-[0.9375rem] text-ivory/75 md:col-span-8">
            {otherWork.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="link-draw hover:text-ivory">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <ArrowLink href={paths.services} onDark className="mt-12">
          All services
        </ArrowLink>
      </Container>
    </section>
  );
}
