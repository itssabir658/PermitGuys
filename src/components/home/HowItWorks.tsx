import { ArrowLink } from "@/components/ui/ButtonLink";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StepList } from "@/components/ui/StepList";
import { homeSteps } from "@/content/process";
import { paths } from "@/lib/routes";

export function HowItWorks() {
  return (
    <Section tone="light" labelledBy="process-heading" bordered>
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <SectionHeading
              id="process-heading"
              size="md"
              code="02"
              eyebrow="How it works"
              title="Who does what, from first call to permit."
              intro="We prepare the drawings and documentation and support you through the application. Your municipality reviews it and decides whether to issue the permit."
            />
            <div className="mt-8">
              <ArrowLink href={paths.howItWorks}>See the full process</ArrowLink>
            </div>
          </div>
        </div>
        <div className="lg:col-span-8 lg:pt-2">
          <StepList steps={homeSteps} />
        </div>
      </div>
    </Section>
  );
}
