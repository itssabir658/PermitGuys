import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { EmailLink, PhoneLink } from "@/components/ui/ContactLinks";
import { ExternalIcon } from "@/components/ui/Icons";
import { LinkButton } from "@/components/ui/LinkButton";
import { coverWidth, plateNote, plates } from "@/content/imagery";
import { site } from "@/content/site";
import { escapeHtml } from "@/lib/html";
import { paths } from "@/lib/routes";
import type { ReviewSummary } from "@/lib/reviews";
import { Wordmark } from "@/components/ui/Wordmark";

const dateFormat = new Intl.DateTimeFormat("en-CA", { dateStyle: "long", timeZone: "UTC" });

/* The close's one picture: a whole house in daylight, on the ivory sheet. */
const plate = plates.greenBatten;
const HEADING = "Let’s talk about your project.";
/** A value set as lines: the address at its first comma (street, then town), the hours by sentence. */
const lines = (text: string, at: RegExp) => text.split(at).filter(Boolean);
const BODY = "Tell us what you are planning and where. We will review the details and explain how we can take it from the first idea to drawings ready for the building permit.";

/**
 * The close: an invitation beside one picture, then the firm's details set
 * as the title block of a drawing sheet, as the story's sheet is issued
 * with one (Story.tsx): the firm, its office, hours, phone and email, its
 * Google rating and credentials, each in a ruled cell.
 *
 * The section is an ivory sheet that rises over Services as it recedes
 * into the night (the handover module), the page's second sheet after the
 * intro's: the page opens and closes with one gesture. On the tracks the
 * label, the heading and the paragraph rise line by line from their masks
 * and the actions follow; the picture's sheet wipes up and settles; the
 * title block is drawn in from the left, and its cells come in after it,
 * left to right (HomeMotion, contact module). The section brings its own
 * ivory: the page ground stays night beneath it.
 */
export function Contact({ reviews }: { reviews: ReviewSummary | null }) {
  const { contact } = site;
  return (
    <section data-contact="" aria-labelledby="contact-heading" className="contact relative z-[1] bg-ivory">
      <Container className="contact-grid">
        <div className="contact-intro">
          <p className="split-line text-label text-ink-muted">
            <span data-contact-roll="" className="block">
              Contact
            </span>
          </p>
          <h2
            id="contact-heading"
            data-contact-heading=""
            className="contact-heading mt-5 max-w-[14ch] font-display text-display-lg font-light text-ink"
            dangerouslySetInnerHTML={{ __html: escapeHtml(HEADING) }}
          />
          <p data-contact-body="" className="contact-body mt-6 max-w-[34rem] leading-relaxed text-ink-muted" dangerouslySetInnerHTML={{ __html: escapeHtml(BODY) }} />
          <div data-contact-actions="" className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
            <LinkButton href={paths.contact}>Start a project</LinkButton>
            {contact.phone ? (
              <p className="text-ink-muted">
                or call <PhoneLink location="home-contact" className="link-rule text-ink" />
              </p>
            ) : null}
          </div>
        </div>

        <figure className="contact-figure">
          <div data-contact-pic="" className="contact-pic notch-clip">
            <div data-contact-wipe="" className="absolute inset-0">
              <Image
                src={plate.src}
                alt={plate.alt}
                fill
                sizes={`(min-width: 1024px) ${coverWidth(plate, 1.5, "min(36vw, 36rem)")}, (min-width: 768px) ${coverWidth(plate, 1.5, "40vw")}, ${coverWidth(plate, 1.5, "92vw")}`}
                quality={80}
                className="object-cover"
                style={{ objectPosition: plate.focus }}
              />
            </div>
          </div>
          <figcaption data-contact-caption="" className="mt-3 text-label text-ink-muted">
            {plateNote(plate)}
          </figcaption>
        </figure>

        <div data-contact-block="" className="contact-block">
          <div data-contact-cell="" aria-hidden="true" className="contact-block__cell contact-block__mark">
            <p className="text-[1.4rem] leading-none">
              <Wordmark />
            </p>
            <p className="contact-block__label mt-2">Architects</p>
          </div>
          {contact.address ? (
            <dl data-contact-cell="" className="contact-block__cell">
              <dt className="contact-block__label">Office</dt>
              <dd className="contact-block__value">
                {lines(contact.address, /(?<=^[^,]*),\s+/).map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
              </dd>
            </dl>
          ) : null}
          {contact.hours ? (
            <dl data-contact-cell="" className="contact-block__cell">
              <dt className="contact-block__label">Hours</dt>
              <dd className="contact-block__value">
                {lines(contact.hours, /(?<=\.)\s+/).map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
              </dd>
            </dl>
          ) : null}
          {contact.phone || contact.email ? (
            <dl data-contact-cell="" className="contact-block__cell">
              <dt className="contact-block__label">Phone and email</dt>
              <dd className="contact-block__value grid justify-items-start gap-0.5">
                <PhoneLink location="home-contact-block" className="link-rule" />
                <EmailLink location="home-contact-block" className="link-rule" />
              </dd>
            </dl>
          ) : null}
          {reviews ? (
            <dl data-contact-cell="" className="contact-block__cell">
              <dt className="contact-block__label">Google rating</dt>
              <dd className="contact-block__value">
                {/* Inline, so a rating that wraps is underlined line by line, the icon after its last word. */}
                <a href={reviews.url} className="group">
                  <span className="link-rule">
                    {reviews.rating.toFixed(1)} out of 5 from {reviews.count} reviews
                  </span>
                  <ExternalIcon className="ml-1.5 inline-block size-3 align-[-0.05em]" />
                </a>
              </dd>
              {reviews.source === "profile" && reviews.asOf ? (
                <dd className="contact-block__note">From our Google Business Profile on {dateFormat.format(new Date(reviews.asOf))}.</dd>
              ) : null}
            </dl>
          ) : null}
          {site.credentials.length ? (
            <dl data-contact-cell="" className="contact-block__cell">
              <dt className="contact-block__label">Credentials</dt>
              {site.credentials.map((c) => (
                <dd key={c} className="contact-block__value">
                  {c}
                </dd>
              ))}
            </dl>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
