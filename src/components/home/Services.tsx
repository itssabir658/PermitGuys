import Image from "next/image";
import Link from "next/link";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Container } from "@/components/ui/Container";
import { PROJECT_NOTE, STUDY_NOTE, coverWidth, coverWidthByHeight, plateForService } from "@/content/imagery";
import { otherWork } from "@/content/other-work";
import { escapeHtml } from "@/lib/html";
import { getServices } from "@/lib/content";
import { paths } from "@/lib/routes";

const LEAD = "Design, engineering and permits for every kind of project.";

/*
 * Services on the night ground: the list of services beside one framed
 * picture.
 *
 * Tracks: the section is a 300vh track with the whole composition pinned
 * for two screens, on phones from 620px tall and on wider screens from
 * 720px. The stage rides a little ahead of its track as it comes up, so
 * the picture follows close under the last Values picture: through the
 * dusk the picture's sheet wipes up from the bottom and settles, then the
 * heading's lines and the rows rise out of their masks, each row's rule
 * drawing across, so the composition is whole as the stage pins. While it holds, scrolling walks the rows: the picture
 * follows the row reached, or the one hovered or focused, each new picture
 * wiping up over the last as it darkens (HomeMotion, services modules).
 * The pictures are stacked layers, so a swap never passes through the ones
 * in between. On wide screens too short to hold it, the section flows,
 * starting close under Values, and the picture follows the row crossing
 * the middle of the screen.
 *
 * Contact then rises over the section as an ivory sheet while it sinks and
 * dims (data-services-inner, the handover module).
 *
 * Without the tracks the list and picture simply sit side by side, the
 * picture following the hovered or focused row.
 *
 * Custom homes show a client rendering, the other services rendered studies
 * (no client rendering shows those kinds of project), so the caption under
 * the frame names the kind of the picture shown (data-kind, set with the
 * picture).
 *
 * The frame is portrait beside the list (at most 70% of the screen's height
 * and 44rem) and a wide band on phones, so each picture is fetched as wide
 * as it is drawn at that height, or across the phone.
 */
export function Services() {
  // Homes first, then businesses and landlords.
  const services = [...getServices()].sort((a, b) => (a.category === b.category ? 0 : a.category === "residential" ? -1 : 1));
  return (
    <section id="services" data-services="" data-tone="dark" aria-labelledby="services-heading" className="relative bg-charcoal-900 text-ivory">
      <div data-services-inner="">
        <div data-services-track="" className="services-track">
          <div data-services-stage="" className="services-stage">
            <Container className="services-grid grid gap-12 md:grid-cols-12 md:gap-8">
              <div className="services-copy md:col-span-7 lg:col-span-6">
                <p className="services-eyebrow split-line text-label text-charcoal-300">
                  <span data-services-roll="" className="block">
                    Services
                  </span>
                </p>
                <h2
                  id="services-heading"
                  data-services-heading=""
                  className="services-heading mt-5 max-w-[17ch] font-display text-display-lg font-light"
                  dangerouslySetInnerHTML={{ __html: escapeHtml(LEAD) }}
                />
                <ol data-services-body="" className="services-list mt-10 lg:mt-14">
                  {services.map((s, i) => (
                    <li key={s.slug} data-service-index={i} className="services-item">
                      {/* The list's top rule, drawn with the first row. */}
                      {i === 0 ? <span aria-hidden="true" data-services-rule="" className="services-item__rule services-item__rule--top" /> : null}
                      <Link href={paths.service(s.slug)} className="group grid min-h-11 grid-cols-[2.25rem_1fr_auto] items-baseline gap-4 py-3.5 lg:py-5">
                        <span data-services-meta="" className="services-item__num text-label text-charcoal-300 tabular-nums">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="services-item__label split-line font-display text-[clamp(1.5rem,1.1rem+1.2vw,2.35rem)] leading-[1.1] font-light tracking-[-0.03em]">
                          <span className="split-line__inner">{s.navLabel}</span>
                        </span>
                        <span data-services-meta="" className="text-label text-charcoal-300">
                          {s.category === "residential" ? "Homes" : "Business"}
                        </span>
                      </Link>
                      {/* The row's rule, drawn across as the row arrives. */}
                      <span aria-hidden="true" data-services-rule="" className="services-item__rule" />
                    </li>
                  ))}
                </ol>
                <div data-services-all="" className="services-all mt-6 flex justify-end lg:mt-8">
                  <ArrowLink href={paths.services} onDark>
                    All services
                  </ArrowLink>
                </div>
              </div>

              <div data-services-frame="" aria-hidden="true" className="services-frame-col md:col-span-5 md:col-start-8">
                <div className="services-frame-pin">
                  <div data-services-box="" className="services-frame notch-clip">
                    <div data-services-reveal="" className="absolute inset-0 overflow-hidden">
                      <div data-services-zoom="" className="absolute inset-0">
                        {services.map((s, i) => {
                          const plate = plateForService(s.slug);
                          return (
                            <div key={s.slug} data-services-pic={i} data-kind={plate.kind} className="absolute inset-0" style={i ? { visibility: "hidden" } : undefined}>
                              <Image
                                src={plate.src}
                                alt=""
                                fill
                                sizes={`(max-width: 767px) ${coverWidth(plate, 1.6, "100vw")}, (min-height: 1006px) ${coverWidthByHeight(plate, "44rem")}, ${coverWidthByHeight(plate, "70vh")}`}
                                quality={75}
                                loading={i ? "eager" : undefined}
                                fetchPriority={i ? "low" : undefined}
                                className="object-cover"
                                style={{ objectPosition: plate.focus }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <p data-services-caption="" data-kind={plateForService(services[0].slug).kind} className="services-caption mt-4 text-label text-charcoal-300">
                    <span data-note="study">{STUDY_NOTE}</span>
                    <span data-note="project">{PROJECT_NOTE}</span>
                  </p>
                </div>
              </div>
            </Container>
          </div>
        </div>

        <Container className="pb-16 lg:pb-24">
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
        </Container>
      </div>
    </section>
  );
}
