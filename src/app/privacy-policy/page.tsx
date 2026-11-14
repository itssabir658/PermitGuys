import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Placeholder } from "@/components/ui/Placeholder";
import { site } from "@/content/site";
import { paths } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { Wordmark } from "@/components/ui/Wordmark";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description: "How PermitGuys collects, uses and protects personal information shared through this website.",
  path: paths.privacy,
});

export default function PrivacyPage() {
  return (
    <>
      <PageHeader crumbs={[{ name: "Privacy policy", path: paths.privacy }]} eyebrow="Legal" title="Privacy policy" />
      <Container className="pt-10 pb-16 sm:pb-20 lg:pt-14">
        <Placeholder block className="max-w-3xl">
          draft privacy policy. It must be reviewed and approved by the business, ideally with legal advice, before launch. Confirm the effective date, the contact for privacy questions, every service that receives form data and any analytics tools used.
        </Placeholder>
        <div className="prose-pg mt-12">
          <p>
            <strong>Effective date:</strong> <Placeholder>date</Placeholder>
          </p>
          <h2>Who we are</h2>
          <p>
            This policy explains how {site.legalName ?? <Wordmark />} (&ldquo;we&rdquo;) handles personal information collected through this website.
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
            If you use the website assistant, the messages you type are sent to Anthropic, the provider of the AI model that writes its replies, so it can answer you. We do not save the conversation on our servers: it stays in your browser tab until you close it or start a new chat. Please do not share personal details in the chat itself.
          </p>
          <p>
            So the assistant can answer without asking what you have already seen, our own code keeps a short summary of your visit in your browser tab: the pages and sections of this website you viewed, the buttons and links you clicked on it, project choices you made in our forms (project type, municipality and project stage, never your name, contact details or description), how long you have been on the site, the name of the website that referred you and any campaign tags in the link you followed. It uses no cookies and no third-party trackers. The summary leaves your browser only with a message you send to the assistant, or with a request you send us.
          </p>
          <p>
            If you send us a request from the assistant, the details you enter (your name, phone number, email address and, if you give it, the property address) come to us with your project details, the conversation and the visit summary, so our team can follow up without asking again. Your contact details are not sent to Anthropic.
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
