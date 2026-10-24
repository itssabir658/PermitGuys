import Image from "next/image";
import Link from "next/link";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Container } from "@/components/ui/Container";
import { ArrowRight } from "@/components/ui/Icons";
import { coverWidth, coverWidthByHeight, plateForService, plateNote } from "@/content/imagery";
import { otherWork } from "@/content/other-work";
import { escapeHtml } from "@/lib/html";
import { getServices } from "@/lib/content";
import { paths } from "@/lib/routes";

const LEAD = "Design, engineering and permits for every kind of project.";

/*
 * Services on the night ground: the services in two groups, for homes and
 * for businesses, each a name with a few words on what it covers.
 *
 * Phones: the section flows. Each group opens on the picture of its first
 * service, captioned, and its rows follow, every row a name, its scope and
 * an arrow, a full-width link. On the tracks the heading's lines, the group
 * labels and the rows rise out of their masks as they come up, each row's
 * rule drawing across, and each picture's sheet wipes up as it enters.
 *
 * From 768px: the list beside one framed picture, which shows the service
 * hovered, focused or reached, with its scope and the kind of picture under
 * it. On screens tall enough to hold it (720px) the section is a 300vh
 * track with the whole composition pinned for two screens. The stage rides
 * a little ahead of its track as it comes up, so the picture follows close
 * under the last Values picture: through the dusk the picture's sheet wipes
 * up from the bottom and settles, then the heading's lines, the group labels
 * and the rows rise out of their masks, each row's rule drawing across, so
 * the composition is whole as the stage pins. While it holds, scrolling
 * walks the rows: the picture follows the row reached, or the one hovered
 * or focused, each new picture wiping up over the last as it darkens
 * (HomeMotion, services modules). The pictures are stacked layers, so a swap
 * never passes through the ones in between. Wide screens too short to hold
 * it flow, starting close under Values, and the picture follows the row
 * crossing the middle of the screen.
 *
 * Contact then rises over the section as an ivory sheet while it sinks and
 * dims (data-services-inner, the handover module).
 *
 * Without the tracks the list and picture simply sit side by side, the
 * picture following the hovered or focused row.
 *
 * Custom homes show a client rendering, the other services rendered studies
 * (no client rendering shows those kinds of project), so the caption under
 * each picture names its kind (under the frame, with what the service
 * covers, the block for the picture shown: data-on, set with the picture).
 *
 * The frame is portrait beside the list (at most 70% of the screen's height
 * and 44rem), so each picture is fetched as wide as it is drawn at that
 * height; the frame's pictures and the groups' pictures load only where
 * they show.
 */
export function Services() {
  // Homes first, then businesses and landlords.
  const services = [...getServices()].sort((a, b) => (a.category === b.category ? 0 : a.category === "residential" ? -1 : 1));
  const groups = [
    { key: "homes", label: "For homes", items: services.filter((s) => s.category === "residential") },
    { key: "businesses", label: "For businesses", items: services.filter((s) => s.category !== "residential") },
  ].filter((g) => g.items.length);
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
                <div data-services-body="" className="services-list">
                  {groups.map((g) => {
                    const plate = plateForService(g.items[0].slug);
                    return (
                      <div key={g.key} className="services-group">
                        <h3 id={`services-${g.key}`} className="services-group__label split-line text-label text-charcoal-300">
                          <span data-services-group-roll="" className="block">
                            {g.label}
                          </span>
                        </h3>
                        {/* Phones: the group opens on its first service's picture. */}
                        <figure data-services-plate="" className="services-plate">
                          <div className="services-plate__frame notch-clip">
                            <div data-services-plate-reveal="" className="absolute inset-0 overflow-hidden">
                              <div data-services-plate-zoom="" className="absolute inset-0">
                                <Image
                                  src={plate.src}
                                  alt={plate.alt}
                                  fill
                                  sizes={coverWidth(plate, 1.5, "100vw")}
                                  quality={75}
                                  loading="lazy"
                                  className="object-cover"
                                  style={{ objectPosition: plate.focus }}
                                />
                              </div>
                            </div>
                          </div>
                          <figcaption data-services-plate-caption="" className="mt-3 text-label text-charcoal-300">
                            {plateNote(plate)}
                          </figcaption>
                        </figure>
                        <ul aria-labelledby={`services-${g.key}`} className="services-rows">
                          {g.items.map((s, j) => (
                            <li key={s.slug} data-service-index={services.indexOf(s)} className="services-item">
                              {/* The group's top rule, drawn with its first row. */}
                              {j === 0 ? <span aria-hidden="true" data-services-rule="" className="services-item__rule services-item__rule--top" /> : null}
                              <Link href={paths.service(s.slug)} className="services-item__link group">
                                <span aria-hidden="true" className="services-item__dot" />
                                <span className="services-item__label split-line font-display text-[clamp(1.5rem,1.1rem+1.2vw,2.35rem)] leading-[1.1] font-light tracking-[-0.03em]">
                                  <span className="split-line__inner">{s.navLabel}</span>
                                </span>{" "}
                                <span data-services-meta="" className="services-item__scope">
                                  {s.scope}
                                </span>
                                <span aria-hidden="true" data-services-meta="" className="services-item__arrow">
                                  <ArrowRight className="size-[1.125rem]" />
                                </span>
                              </Link>
                              {/* The row's rule, drawn across as the row arrives. */}
                              <span aria-hidden="true" data-services-rule="" className="services-item__rule" />
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
                <div data-services-all="" className="services-all">
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
                            <div key={s.slug} data-services-pic={i} className="absolute inset-0" style={i ? { visibility: "hidden" } : undefined}>
                              <Image
                                src={plate.src}
                                alt=""
                                fill
                                sizes={`(min-height: 1006px) ${coverWidthByHeight(plate, "44rem")}, ${coverWidthByHeight(plate, "70vh")}`}
                                quality={75}
                                loading="lazy"
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
                  {/* For the service shown, what it covers and what its picture is: one block for each, all in one cell, so the caption keeps the height of the tallest. */}
                  <div data-services-caption="" className="services-caption mt-4">
                    {services.map((s, i) => (
                      <p key={s.slug} data-caption={i} data-on={i ? undefined : ""}>
                        <span className="block text-[0.9375rem] leading-snug text-ivory/80">{s.scope}</span>
                        <span data-note="" className="mt-2 block text-label text-charcoal-300">
                          {plateNote(plateForService(s.slug))}
                        </span>
                      </p>
                    ))}
                  </div>
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
