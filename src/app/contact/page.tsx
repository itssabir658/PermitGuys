import { EmailLink, PhoneLink } from "@/components/ui/ContactLinks";
import { Container } from "@/components/ui/Container";
import { MapCard } from "@/components/ui/MapCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Placeholder } from "@/components/ui/Placeholder";
import { RatingCard } from "@/components/ui/Reviews";
import { site } from "@/content/site";
import { getGoogleReviews } from "@/lib/reviews";
import { paths } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { InquiryForm } from "./InquiryForm";

export const metadata = pageMetadata({
  title: "Discuss Your Project",
  description:
    "Send PermitGuys a project inquiry for permit drawings or permit guidance in the Greater Toronto Area. Tell us what you are planning and where.",
  path: paths.contact,
});

// Google reviews refresh once a day (REVIEWS_REVALIDATE_SECONDS in src/lib/reviews.ts).
export const revalidate = 86400;

const linkClass = "link-rule text-ink";

export default async function ContactPage() {
  const { contact, map } = site;
  const reviews = await getGoogleReviews();
  const directContact =
    contact.email || contact.phone ? (
      <>
        You can also reach us{" "}
        {contact.email ? (
          <>
            by email at <EmailLink location="contact-form-notice" className={linkClass} />
          </>
        ) : null}
        {contact.email && contact.phone ? " or " : null}
        {contact.phone ? (
          <>
            by phone at <PhoneLink location="contact-form-notice" className={linkClass} />
          </>
        ) : null}
        .
      </>
    ) : (
      <Placeholder>direct phone and email for visitors when the form cannot send</Placeholder>
    );
  return (
    <>
      <PageHeader
        crumbs={[{ name: "Contact", path: paths.contact }]}
        pageType="ContactPage"
        eyebrow="Get started"
        title="Tell us about your project."
        lead="Share a few details about what you are planning and where. We will review them and reply to explain how we can help with drawings and the permit process."
      />
      <Container className="pt-10 pb-24 sm:pb-32 lg:pt-14 lg:pb-40">
        <div className="grid gap-20 lg:grid-cols-12 lg:gap-8">
          {/* data-inquiry: this page closes on its own form, so the footer's call to action stands down (globals.css). */}
          <div data-reveal="" data-inquiry="" className="lg:col-span-7">
            <InquiryForm directContact={directContact} />
          </div>
          <div data-reveal="" className="space-y-16 lg:col-span-4 lg:col-start-9">
            <aside className="border-t border-ink/25 pt-8" aria-labelledby="direct-heading">
              <h2 id="direct-heading" className="text-label text-ink-muted">
                Contact directly
              </h2>
              <dl className="mt-4 divide-y divide-line">
                <div className="py-4">
                  <dt className="text-label text-ink-muted">Phone</dt>
                  <dd className="mt-2 text-lg text-ink">
                    {contact.phone ? <PhoneLink location="contact-sidebar" className={`${linkClass} tap`} /> : <Placeholder>phone number</Placeholder>}
                  </dd>
                </div>
                <div className="py-4">
                  <dt className="text-label text-ink-muted">Email</dt>
                  <dd className="mt-2 text-lg text-ink">
                    {contact.email ? <EmailLink location="contact-sidebar" className={`${linkClass} tap`} /> : <Placeholder>email address</Placeholder>}
                  </dd>
                </div>
                <div className="py-4">
                  <dt className="text-label text-ink-muted">Hours</dt>
                  <dd className="mt-2 text-lg text-ink">{contact.hours ?? <Placeholder>business hours</Placeholder>}</dd>
                </div>
              </dl>
              <p className="mt-4 text-sm leading-relaxed text-ink-muted">Please do not send personal information beyond what is needed to describe your project.</p>
            </aside>
            {reviews ? <RatingCard summary={reviews} headingLevel="h2" /> : null}
            <MapCard query={map.query} label={map.label} note={map.note} onLight />
          </div>
        </div>
      </Container>
    </>
  );
}
