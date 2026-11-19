import { HomeMotion } from "@/components/home/HomeMotion";
import { Values } from "@/components/home/Values";
import { ProjectShowcase } from "@/components/about/ProjectShowcase";
import { ArticleLayout, ArticleSection, RuledList } from "@/components/ui/Article";
import { CtaPanel } from "@/components/ui/CtaPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { Placeholder } from "@/components/ui/Placeholder";
import { PlateBand } from "@/components/ui/PlateBand";
import { about } from "@/content/about";
import { plates } from "@/content/imagery";
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
  { id: "story", label: "Our story" },
  { id: "team", label: "Our team" },
  { id: "credentials", label: "Credentials" },
  { id: "where-we-work", label: "Where we work" },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ name: "About", path: paths.about }]}
        pageType="AboutPage"
        eyebrow="About"
        title="Architecture and engineering, with the permit in mind."
        lead={withWordmark("PermitGuys is a team of architects, engineers and designers in Oakville, working with homeowners and businesses across the Greater Toronto Area.")}
      />
      <PlateBand plate={plates.side} />
      <ArticleLayout toc={toc}>
        <ArticleSection id="what-we-do" title="What we do">
          <div className="prose-pg">
            <p>
              We design residential additions, legal basement apartments, decks, custom homes, interior renovations and commercial projects, work out the engineering they need, and prepare the permit drawings and documentation. Then we submit the permit application for our clients, as their agent, and see it through the municipality&rsquo;s review.
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
        <ArticleSection id="story" title="Our story">
          <div className="prose-pg">
            {about.story.map((p, i) => (
              <p key={i}>{i === 0 ? withWordmark(p) : p}</p>
            ))}
          </div>
          <Placeholder block className="mt-8 max-w-(--measure-article)">
            {withWordmark(about.storyMissing)}
          </Placeholder>
        </ArticleSection>
        <ArticleSection id="team" title="Our team">
          {about.team.length ? (
            <ul className="grid max-w-(--measure-article) border-t border-line sm:grid-cols-2 sm:gap-x-10">
              {about.team.map((m) => (
                <li key={m.name} className="row-rule py-6">
                  <p className="font-display text-display-sm font-light text-ink">{m.name}</p>
                  <p className="mt-2 text-label text-ink-muted">
                    {m.role}
                    {m.designation ? `, ${m.designation}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <Placeholder block className="max-w-(--measure-article)">
              the team members and each person&rsquo;s role, in the business&rsquo;s own words (for example: name, Principal).
            </Placeholder>
          )}
        </ArticleSection>
        <ArticleSection id="credentials" title="Credentials">
          <dl className="max-w-(--measure-article) border-t border-line">
            {about.facts.map((f) => (
              <div key={f.label} className="row-rule grid gap-2 py-5 sm:grid-cols-[11rem_1fr] sm:gap-8">
                <dt className="pt-[0.2rem] text-label text-ink-muted">{f.label}</dt>
                <dd className="leading-relaxed text-ink">{f.value ?? <Placeholder>{f.missing}</Placeholder>}</dd>
              </div>
            ))}
          </dl>
        </ArticleSection>
        <ArticleSection
          id="where-we-work"
          title="Where we work"
          intro="Homes and businesses across the Greater Toronto Area, in these municipalities."
        >
          <ul className="flex max-w-(--measure-article) flex-wrap gap-x-8 gap-y-3 border-t border-line pt-8 font-display text-display-sm font-light text-ink">
            {about.cities.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </ArticleSection>
      </ArticleLayout>
      {/* The values, moved here from the homepage with the same scroll motion (HomeMotion finds them by their data attributes), then Selected projects as a showcase on graphite, and the invitation coming up from under it as the footer does. */}
      <Values />
      <ProjectShowcase />
      <CtaPanel rise />
      <HomeMotion />
    </>
  );
}
