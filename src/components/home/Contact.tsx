import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { EmailLink, PhoneLink } from "@/components/ui/ContactLinks";
import { ExternalIcon } from "@/components/ui/Icons";
import { LinkButton } from "@/components/ui/LinkButton";
import { coverWidth, plates, type Plate } from "@/content/imagery";
import { site } from "@/content/site";
import { paths } from "@/lib/routes";
import type { ReviewSummary } from "@/lib/reviews";

const dateFormat = new Intl.DateTimeFormat("en-CA", { dateStyle: "long", timeZone: "UTC" });

/* The cards' pictures: a whole house beside the first card's invitation, an entrance beside the address. */
const start = plates.greenBatten;
const visit = plates.narrow;
const cardSizes = (plate: Plate) => `(min-width: 768px) ${coverWidth(plate, 1.6, "45vw")}, ${coverWidth(plate, 1.6, "90vw")}`;

/**
 * The close: the word set large, then two cards with pictures in the
 * notched sheet outline.
 *
 * The section is an ivory sheet that rises over Services as it recedes
 * into the night (the handover module), the page's second sheet after the
 * intro's: the page opens and closes with one gesture. On the tracks the
 * word is cut in letter by letter, each rising from its own mask; then the
 * cards rise and their blocks fade in, the right one a beat behind on wide
 * screens, as each picture's sheet wipes up and settles (HomeMotion,
 * contact module). The section brings its own ivory: the page ground stays
 * night beneath it.
 *
 * The letters are decoration; the heading's text is the visually hidden
 * word. Splitting a word into boxes loses the face's kerning between them,
 * so the stylesheet sets it back (measured against the word as one run),
 * and HomeMotion re-measures and refines it.
 *
 * From md the two cards share three rows through subgrid (picture, text,
 * foot), so 'Get in touch' sits on the same rule as the rating and
 * credentials whatever the text above them.
 */
export function Contact({ reviews }: { reviews: ReviewSummary | null }) {
  const { contact } = site;
  return (
    <section data-contact="" aria-labelledby="contact-heading" className="relative z-[1] bg-ivory pt-28 pb-16 lg:pt-40 lg:pb-20">
      <Container>
        <h2 id="contact-heading" data-contact-heading="" className="contact-heading font-wordmark leading-[0.85] tracking-[-0.01em] text-ink uppercase">
          <span className="sr-only">Contact</span>
          <span aria-hidden="true" className="contact-heading__word">
            {"Contact".split("").map((c, i) => (
              <span key={i} className="contact-letter">
                <span data-contact-letter="">{c}</span>
              </span>
            ))}
          </span>
        </h2>

        <div className="mt-14 grid gap-6 md:grid-cols-2 md:grid-rows-[auto_1fr_auto] lg:mt-20 lg:gap-8">
          <article data-contact-card="" className="grid gap-8 bg-stone-100 p-5 sm:p-6 md:row-span-3 md:grid-rows-subgrid lg:p-8">
            <div className="contact-pic notch-clip relative aspect-[16/10] overflow-hidden bg-stone-300">
              <div data-contact-wipe="" className="absolute inset-0">
                <Image src={start.src} alt="" fill sizes={cardSizes(start)} quality={75} className="object-cover" style={{ objectPosition: start.focus }} />
              </div>
            </div>
            <div>
              <h3 className="font-display text-display-md font-light text-ink">Start a project</h3>
              <p className="mt-4 max-w-md leading-relaxed text-ink-muted">
                Tell us what you are planning and where. We will review the details and explain how we can help with drawings and the permit process.
              </p>
            </div>
            <div className="border-t border-line pt-6">
              <LinkButton href={paths.contact}>Get in touch</LinkButton>
            </div>
          </article>

          <article data-contact-card="" className="grid gap-8 bg-stone-100 p-5 sm:p-6 md:row-span-3 md:grid-rows-subgrid lg:p-8">
            <div className="contact-pic notch-clip relative aspect-[16/10] overflow-hidden bg-stone-300">
              <div data-contact-wipe="" className="absolute inset-0">
                <Image src={visit.src} alt="" fill sizes={cardSizes(visit)} quality={75} className="object-cover" style={{ objectPosition: visit.focus }} />
              </div>
            </div>
            <div>
              <h3 className="font-display text-display-md font-light text-ink">Call or visit</h3>
              <address className="mt-4 grid gap-1.5 leading-relaxed text-ink-muted not-italic">
                {contact.address ? <span>{contact.address}</span> : null}
                {contact.hours ? <span>{contact.hours}</span> : null}
                {contact.phone ? <PhoneLink location="home-contact" className="link-rule w-fit text-ink" /> : null}
                {contact.email ? <EmailLink location="home-contact" className="link-rule w-fit text-ink" /> : null}
              </address>
            </div>
            <dl className="grid gap-6 border-t border-line pt-6 sm:grid-cols-2">
              {reviews ? (
                <div>
                  <dt className="text-label text-ink-muted">Google rating</dt>
                  <dd className="mt-2">
                    <a href={reviews.url} className="group inline-flex items-center gap-1.5 text-ink">
                      <span className="link-rule">
                        {reviews.rating.toFixed(1)} out of 5 from {reviews.count} reviews
                      </span>
                      <ExternalIcon className="size-3" />
                    </a>
                  </dd>
                  {reviews.source === "profile" && reviews.asOf ? (
                    <dd className="mt-1 text-[0.8125rem] text-ink-muted">From our Google Business Profile on {dateFormat.format(new Date(reviews.asOf))}.</dd>
                  ) : null}
                </div>
              ) : null}
              {site.credentials.length ? (
                <div>
                  <dt className="text-label text-ink-muted">Credentials</dt>
                  {site.credentials.map((c) => (
                    <dd key={c} className="mt-2 text-ink">
                      {c}
                    </dd>
                  ))}
                </div>
              ) : null}
            </dl>
          </article>
        </div>
        <p className="mt-6 text-label text-ink-muted">Images are renderings of client projects, except those captioned as rendered studies.</p>
      </Container>
    </section>
  );
}
