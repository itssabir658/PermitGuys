import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Placeholder } from "@/components/ui/Placeholder";
import { site } from "@/content/site";
import { paths } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description: "How PermitGuys collects, uses and protects personal information shared through this website.",
  path: paths.privacy,
});

export default function PrivacyPage() {
  return (
    <>
      <PageHeader crumbs={[{ name: "Privacy policy", path: paths.privacy }]} eyebrow="Legal" title="Privacy policy" />
      <Container className="py-16 sm:py-20">
        <Placeholder block className="max-w-3xl">
          draft privacy policy. It must be reviewed and approved by the business, ideally with legal advice, before launch. Confirm the effective date, the contact for privacy questions, every service that receives form data and any analytics tools used.
        </Placeholder>
        <div className="prose-pg mt-12">
          <p>
            <strong>Effective date:</strong> <Placeholder>date</Placeholder>
          </p>
          <h2>Who we are</h2>
          <p>
            This policy explains how {site.legalName ?? site.name} (&ldquo;we&rdquo;) handles personal information collected through this website.
          </p>
          <h2>What we collect</h2>
          <p>When you send an inquiry, we collect the details you choose to provide, such as:</p>
          <ul>
            <li>your name, email address and, if you provide it, phone number;</li>
            <li>your preferred contact method, the municipality or location of the property and a description of your project.</li>
          </ul>
          <p>
            With an inquiry we also record how you found the website, where available: campaign tags in the link you followed, the name of the website that referred you and the first page you visited. We do not record the full address of the referring page.
          </p>
          <p>
            We may also collect basic technical information, such as pages visited, to understand how the website is used. <Placeholder>name any analytics tool, or state that none is used</Placeholder>
          </p>
          <h2>How we use it</h2>
          <p>We use inquiry information to respond to you, assess your project and provide the services you ask for. We do not sell personal information.</p>
          <h2>Who we share it with</h2>
          <p>
            We share information only with service providers who help us operate the website and respond to inquiries, and where the law requires it. <Placeholder>list the form, email and hosting providers used</Placeholder>
          </p>
          <h2>How long we keep it</h2>
          <p>
            <Placeholder>retention period for inquiries that do and do not become projects</Placeholder>
          </p>
          <h2>Your choices</h2>
          <p>
            You can ask to see, correct or delete the personal information we hold about you, or withdraw consent to being contacted, by writing to us at{" "}
            {site.contact.email ?? <Placeholder>privacy contact email</Placeholder>}.
          </p>
          <h2>Changes to this policy</h2>
          <p>We may update this policy. The effective date above shows when it last changed.</p>
        </div>
      </Container>
    </>
  );
}
