import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Placeholder } from "@/components/ui/Placeholder";
import { site } from "@/content/site";
import { paths } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { InquiryForm } from "./InquiryForm";

export const metadata = pageMetadata({
  title: "Discuss Your Project",
  description: "Tell PermitGuys about your project in the Greater Toronto Area. Share what you are planning and we will explain how we can help.",
  path: paths.contact,
});

export default function ContactPage() {
  const { contact } = site;
  return (
    <>
      <PageHeader
        crumbs={[{ name: "Contact", path: paths.contact }]}
        eyebrow="Get started"
        title="Tell us about your project."
        lead="Share a few details about what you are planning and where. We will review them and reply to explain how we can help with drawings and the permit process."
      />
      <Container className="py-16 sm:py-20 lg:py-24">
        <div className="grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <InquiryForm />
          </div>
          <aside className="lg:col-span-4 lg:col-start-9" aria-labelledby="direct-heading">
            <h2 id="direct-heading" className="text-xs font-semibold uppercase tracking-[0.18em] text-copper-700">
              Contact directly
            </h2>
            <dl className="mt-6 divide-y divide-line border-y border-line">
              {[
                ["Phone", contact.phone, "phone number"],
                ["Email", contact.email, "email address"],
                ["Hours", contact.hours, "business hours"],
              ].map(([label, value, missing]) => (
                <div key={label} className="py-4">
                  <dt className="text-sm text-ink-muted">{label}</dt>
                  <dd className="mt-1 text-navy-900">{value ?? <Placeholder>{missing}</Placeholder>}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 text-sm leading-relaxed text-ink-muted">
              Please do not send personal information beyond what is needed to describe your project.
            </p>
          </aside>
        </div>
      </Container>
    </>
  );
}
