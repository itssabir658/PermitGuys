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

const linkClass = "text-navy-900 underline underline-offset-4 hover:text-copper-700";

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
      <div className="bg-glow-paper">
      <Container className="py-16 sm:py-20 lg:py-24">
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="glass rounded-[1.75rem] p-5 sm:p-8 lg:col-span-7 lg:p-10">
            <InquiryForm directContact={directContact} />
          </div>
          <div className="space-y-4 lg:col-span-5">
          <aside className="glass rounded-3xl p-6 sm:p-8" aria-labelledby="direct-heading">
            <h2 id="direct-heading" className="text-label text-copper-700">
              Contact directly
            </h2>
            <dl className="mt-4 divide-y divide-navy-900/[0.08]">
              <div className="py-4">
                <dt className="text-sm text-ink-muted">Phone</dt>
                <dd className="mt-1 text-navy-900">
                  {contact.phone ? <PhoneLink location="contact-sidebar" className={linkClass} /> : <Placeholder>phone number</Placeholder>}
                </dd>
              </div>
              <div className="py-4">
                <dt className="text-sm text-ink-muted">Email</dt>
                <dd className="mt-1 text-navy-900">
                  {contact.email ? <EmailLink location="contact-sidebar" className={linkClass} /> : <Placeholder>email address</Placeholder>}
                </dd>
              </div>
              <div className="py-4">
                <dt className="text-sm text-ink-muted">Hours</dt>
                <dd className="mt-1 text-navy-900">{contact.hours ?? <Placeholder>business hours</Placeholder>}</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm leading-relaxed text-ink-muted">
              Please do not send personal information beyond what is needed to describe your project.
            </p>
          </aside>
          {reviews ? <RatingCard summary={reviews} headingLevel="h2" /> : null}
          <MapCard query={map.query} label={map.label} note={map.note} onLight />
          </div>
        </div>
      </Container>
      </div>
    </>
  );
}
