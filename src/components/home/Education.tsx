import Link from "next/link";
import { ArrowLink } from "@/components/ui/ButtonLink";
import { ArrowRight } from "@/components/ui/Icons";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getGuides } from "@/lib/content";
import { paths } from "@/lib/routes";

export function Education() {
  const guides = getGuides();
  return (
    <Section labelledBy="guides-heading">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <SectionHeading
              id="guides-heading"
              code="04"
              eyebrow="Permit guides"
              size="md"
              title="Understand the process before you start."
              intro="Plain-language guides to the questions homeowners ask most, with links to the official sources."
            />
            <div className="mt-8">
              <ArrowLink href={paths.guides}>All permit guides</ArrowLink>
            </div>
          </div>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
          {guides.map((g, i) => (
            <li
              key={g.slug}
              className="spotlight group glass relative flex flex-col rounded-3xl p-6 transition-transform duration-500 ease-out-soft hover:-translate-y-1 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-4 has-[a:focus-visible]:outline-copper-600 sm:p-7"
            >
              <p className="text-label text-copper-700">Guide {String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-4 font-display text-[1.45rem] leading-snug text-balance text-navy-900">
                <Link href={paths.guide(g.slug)} className="after:absolute after:inset-0 after:rounded-3xl after:content-[''] focus-visible:outline-none">
                  {g.title}
                </Link>
              </h3>
              <p className="mt-3 leading-relaxed text-ink-muted">{g.summary}</p>
              <span aria-hidden="true" className="mt-auto flex items-center gap-2 pt-6 text-sm font-semibold text-navy-900">
                Read the guide
                <ArrowRight className="size-4 text-copper-600 transition-transform duration-300 ease-out-soft group-hover:translate-x-1" />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
