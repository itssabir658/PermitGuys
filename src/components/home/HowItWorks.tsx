import { ArrowLink } from "@/components/ui/ButtonLink";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { homeSteps } from "@/content/process";
import { paths } from "@/lib/routes";
import { ProcessStepper } from "./ProcessStepper";

export function HowItWorks() {
  return (
    <Section tone="light" labelledBy="process-heading" className="bg-glow-paper">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
        <SectionHeading
          id="process-heading"
          code="02"
          eyebrow="How it works"
          title="Who does what, from first call to permit."
          intro="We prepare the drawings and documentation and support you through the application. Your municipality reviews it and decides whether to issue the permit."
          className="lg:col-span-8"
        />
        <ArrowLink href={paths.howItWorks} className="justify-self-start lg:col-span-4 lg:justify-self-end">
          See the full process
        </ArrowLink>
      </div>
      <div className="mt-12 lg:mt-16">
        <ProcessStepper steps={homeSteps} />
      </div>
    </Section>
  );
}
