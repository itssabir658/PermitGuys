import { ArticleLayout, ArticleSection, RuledList } from "@/components/ui/Article";
import { CtaPanel } from "@/components/ui/CtaPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { Placeholder } from "@/components/ui/Placeholder";
import { site } from "@/content/site";
import { paths } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About PermitGuys",
  description:
    "PermitGuys prepares permit drawings and helps homeowners and property owners in the Greater Toronto Area understand and navigate the building permit process.",
  path: paths.about,
});

const toc = [
  { id: "what-we-do", label: "What we do" },
  { id: "how-we-work", label: "How we work" },
  { id: "team", label: "Team and credentials" },
  { id: "story", label: "Our story" },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ name: "About", path: paths.about }]}
        pageType="AboutPage"
        eyebrow="About"
        title="Permit drawings, prepared with the review in mind."
        lead="PermitGuys is a building permit consulting and permit drawing service for homeowners and property owners in the Greater Toronto Area."
      />
      <ArticleLayout toc={toc}>
        <ArticleSection id="what-we-do" title="What we do">
          <div className="prose-pg">
            <p>
              We prepare permit drawings and documentation, and help clients understand and work through the building permit process for residential additions, legal basement apartments, decks, custom homes, interior renovations and commercial and landlord projects.
            </p>
            <p>
              We do not issue permits, and we cannot promise an approval or a date. Your municipality reviews each application and decides whether to issue a permit. Our role is to make your application clear and complete, and to help you respond when the municipality has questions.
            </p>
          </div>
        </ArticleSection>
        <ArticleSection id="how-we-work" title="How we work">
          <RuledList
            items={[
              "We start by understanding what you want to build and what your property allows.",
              "We tell you early when a project needs other consultants or approvals.",
              "We explain who is responsible for each step, so nothing is assumed.",
              "We describe requirements as your municipality sets them, not as rules of thumb.",
            ]}
          />
        </ArticleSection>
        <ArticleSection id="team" title="Team and credentials">
          <Placeholder block>
            team members, roles and verified credentials, such as designer qualification and registration (BCIN) details, professional memberships and insurance.
            {site.credentials.length === 0 ? " None are published until they are supplied and verified." : null}
          </Placeholder>
        </ArticleSection>
        <ArticleSection id="story" title="Our story">
          <Placeholder block>a short account of how and why PermitGuys started, written or approved by the business.</Placeholder>
        </ArticleSection>
      </ArticleLayout>
      <CtaPanel />
    </>
  );
}
