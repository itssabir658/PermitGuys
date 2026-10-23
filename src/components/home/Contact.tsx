import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { EmailLink, PhoneLink } from "@/components/ui/ContactLinks";
import { ExternalIcon } from "@/components/ui/Icons";
import { LinkButton } from "@/components/ui/LinkButton";
import { plates } from "@/content/imagery";
import { site } from "@/content/site";
import { paths } from "@/lib/routes";
import type { ReviewSummary } from "@/lib/reviews";

const dateFormat = new Intl.DateTimeFormat("en-CA", { dateStyle: "long", timeZone: "UTC" });

/**
 * Closing section, after the reference's Contact (docs/MOTION.md,
 * "Contact"): the word set large, then two cards with pictures in the
 * notched sheet outline. Each piece rises 28px and fades in over its own
 * stretch of scroll (from 0.08 to 0.42 of a screen after it enters), and
 * sinks back on the way up. The section brings its own ivory: on the tracks
 * the page ground stays night beneath it.
 */
export function Contact({ reviews }: { reviews: ReviewSummary | null }) {
  const { contact } = site;
  return (
    <section data-contact="" aria-labelledby="contact-heading" className="relative bg-ivory pt-28 pb-24 lg:pt-40 lg:pb-32">
      <Container>
        <h2 id="contact-heading" data-contact-reveal="" className="font-wordmark text-[clamp(4rem,1rem+14vw,15rem)] leading-[0.85] tracking-[-0.01em] text-ink uppercase">
          Contact
        </h2>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:mt-20 lg:gap-8">
          <article data-contact-reveal="" className="grid content-start gap-8 bg-stone-100 p-5 sm:p-6 lg:p-8">
            <div className="notch-clip relative aspect-[16/10] overflow-hidden bg-stone-300">
              <Image src={plates.infill.src} alt="" fill sizes="(min-width: 768px) 45vw, 90vw" quality={75} className="object-cover object-[64%_62%]" />
            </div>
            <div>
              <h3 className="font-display text-display-md font-light text-ink">Start a project</h3>
              <p className="mt-4 max-w-md leading-relaxed text-ink-muted">
                Tell us what you are planning and where. We will review the details and explain how we can help with drawings and the permit process.
              </p>
              <div className="mt-8">
                <LinkButton href={paths.contact}>Get in touch</LinkButton>
              </div>
            </div>
          </article>

          <article data-contact-reveal="" className="grid content-start gap-8 bg-stone-100 p-5 sm:p-6 lg:p-8">
            <div className="notch-clip relative aspect-[16/10] overflow-hidden bg-stone-300">
              <Image src={plates.deck.src} alt="" fill sizes="(min-width: 768px) 45vw, 90vw" quality={75} className="object-cover" style={{ objectPosition: plates.deck.focus }} />
            </div>
            <div>
              <h3 className="font-display text-display-md font-light text-ink">Call or visit</h3>
              <address className="mt-4 grid gap-1.5 leading-relaxed text-ink-muted not-italic">
                {contact.address ? <span>{contact.address}</span> : null}
                {contact.hours ? <span>{contact.hours}</span> : null}
                {contact.phone ? <PhoneLink location="home-contact" className="link-rule w-fit text-ink" /> : null}
                {contact.email ? <EmailLink location="home-contact" className="link-rule w-fit text-ink" /> : null}
              </address>
              <dl className="mt-8 grid gap-6 border-t border-line pt-6 sm:grid-cols-2">
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
            </div>
          </article>
        </div>
        <p className="mt-8 text-label text-ink-muted">Images are rendered studies for illustration, not client projects.</p>
      </Container>
    </section>
  );
}
