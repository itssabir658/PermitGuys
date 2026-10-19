import { ArrowLink } from "@/components/ui/ButtonLink";
import { FaqList } from "@/components/ui/FaqList";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { homeFaqs } from "@/content/faqs";
import { paths } from "@/lib/routes";

export function HomeFaq() {
  return (
    <Section tone="light" labelledBy="faq-heading" id="questions" className="bg-glow-paper">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
          <SectionHeading id="faq-heading" code="05" size="md" eyebrow="Questions" title="Common questions." intro="General answers. Your municipality has the final word on requirements for your property." />
          <div className="mt-8">
            <ArrowLink href={paths.guides}>Read the permit guides</ArrowLink>
          </div>
          </div>
        </div>
        <div className="lg:col-span-8">
          <FaqList faqs={homeFaqs} />
        </div>
      </div>
    </Section>
  );
}
