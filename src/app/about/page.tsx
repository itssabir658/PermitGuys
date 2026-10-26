import { ArticleLayout, ArticleSection, RuledList } from "@/components/ui/Article";
import { CtaPanel } from "@/components/ui/CtaPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { Placeholder } from "@/components/ui/Placeholder";
import { PlateBand } from "@/components/ui/PlateBand";
import { plates } from "@/content/imagery";
import { site } from "@/content/site";
import { paths } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { withWordmark } from "@/components/ui/Wordmark";

export const metadata = pageMetadata({
  title: "About PermitGuys",
  description:
    "PermitGuys is an architecture and engineering firm in Oakville, taking GTA projects from the first idea to drawings ready for the building permit.",
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
        title="Architecture and engineering, with the permit in mind."
        lead={withWordmark("PermitGuys is a team of architects and designers in Oakville, working with homeowners, landlords and businesses across the Greater Toronto Area.")}
      />
      <PlateBand plate={plates.terrace} />
      <ArticleLayout toc={toc}>
        <ArticleSection id="what-we-do" title="What we do">
          <div className="prose-pg">
            <p>
              We design residential additions, legal basement apartments, decks, custom homes, interior renovations and commercial and landlord projects, work out the engineering they need, and prepare the permit drawings and documentation. Then we help our clients through the building permit process.
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
          {site.credentials.length ? <RuledList items={site.credentials.map((c) => `${c}.`)} /> : null}
          <Placeholder block className="max-w-(--measure-article)">
            team members and their roles, the names behind the credentials above, professional memberships and insurance.
          </Placeholder>
        </ArticleSection>
        <ArticleSection id="story" title="Our story">
          <Placeholder block className="max-w-(--measure-article)">{withWordmark("a short account of how and why PermitGuys started, written or approved by the business.")}</Placeholder>
        </ArticleSection>
      </ArticleLayout>
      <CtaPanel />
    </>
  );
}
