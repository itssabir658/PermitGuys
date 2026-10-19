import { ArrowLink } from "@/components/ui/ButtonLink";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StepList } from "@/components/ui/StepList";
import { homeSteps } from "@/content/process";
import { paths } from "@/lib/routes";

export function HowItWorks() {
  return (
    <Section tone="light" labelledBy="process-heading" bordered>
      <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
        <SectionHeading
          id="process-heading"
          eyebrow="How it works"
          title="A clear sequence, with clear responsibilities."
          className="lg:col-span-8"
          intro="We prepare the drawings and documentation and support you through the application. Your municipality reviews it and decides whether to issue the permit."
        />
        <div className="lg:col-span-4 lg:justify-self-end">
          <ArrowLink href={paths.howItWorks}>See the full process</ArrowLink>
        </div>
      </div>
      <div className="mt-14">
        <StepList steps={homeSteps} />
      </div>
    </Section>
  );
}
