import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FaqList } from "@/components/ui/FaqList";
import { ArrowRight } from "@/components/ui/Icons";
import { cn } from "@/components/ui/cn";
import { homeFaqs } from "@/content/faqs";
import type { Guide } from "@/content/types";
import { getGuides } from "@/lib/content";
import { paths } from "@/lib/routes";

function readingMinutes(guide: Guide) {
  const text = [guide.directAnswer, ...guide.sections.flatMap((s) => [...s.paragraphs, ...(s.list ?? [])])].join(" ");
  return Math.max(2, Math.round(text.split(/\s+/).length / 220));
}

/** Editorial index of the permit guides, with short answers to the questions we hear most. */
export function Insights() {
  const guides = getGuides();
  return (
    <section aria-labelledby="insights-heading" className="bg-ivory py-24 sm:py-32 lg:py-44">
      <Container>
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-8">
          <div className="lg:col-span-7">
            <Eyebrow code="08">Insights</Eyebrow>
            <h2 id="insights-heading" data-reveal="" className="mt-10 font-display text-display-xl font-light text-balance text-ink">
              Permits, zoning and approvals, written plainly.
            </h2>
          </div>
          <div data-reveal="" className="lg:col-span-4 lg:col-start-9 lg:pb-3">
            <ArrowLink href={paths.guides}>All permit guides</ArrowLink>
          </div>
        </div>

        <ol className="mt-16 grid border-t border-line sm:grid-cols-2 lg:mt-24">
          {guides.map((guide, i) => (
            <li key={guide.slug} data-reveal="" style={{ "--d": (i % 2) * 120 } as CSSProperties} className={cn("border-b border-line", i % 2 === 0 ? "sm:border-r sm:pr-8 lg:pr-16" : "sm:pl-8 lg:pl-16")}>
              <Link href={paths.guide(guide.slug)} className="group flex h-full flex-col py-10 lg:py-14">
                <span className="flex items-center justify-between text-label text-ink-muted">
                  <span className="tabular-nums">Guide {String(i + 1).padStart(2, "0")}</span>
                  <span>{readingMinutes(guide)} min read</span>
                </span>
                <h3 className="mt-10 max-w-md font-display text-display-md font-light text-balance text-ink lg:mt-16">
                  <span className="link-draw">{guide.title}</span>
                </h3>
                <p className="mt-5 max-w-md leading-relaxed text-ink-muted">{guide.summary}</p>
                <span className="mt-auto flex items-center gap-3 pt-10 text-[0.9375rem] font-medium text-ink">
                  Read the guide
                  <ArrowRight className="size-4 transition-transform duration-500 ease-out-expo group-hover:translate-x-1" />
                </span>
              </Link>
            </li>
          ))}
        </ol>

        <div className="mt-24 grid gap-12 lg:mt-36 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <p className="text-label text-ink-muted">Quick answers</p>
            <h3 data-reveal="" className="mt-6 font-display text-display-md font-light text-ink">
              Questions we hear first.
            </h3>
          </div>
          <div data-reveal="" className="lg:col-span-7 lg:col-start-6">
            <FaqList faqs={homeFaqs} />
          </div>
        </div>
      </Container>
    </section>
  );
}
