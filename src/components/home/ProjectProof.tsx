import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLink } from "@/components/ui/ButtonLink";
import { Figure } from "@/components/ui/Figure";
import { ExternalIcon } from "@/components/ui/Icons";
import { Placeholder } from "@/components/ui/Placeholder";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { site } from "@/content/site";
import { getProjects } from "@/lib/content";
import { paths } from "@/lib/routes";

/*
 * Trust, stated as things a visitor can check. Every row shows a verified
 * fact or a visible placeholder; nothing here is filled in by default.
 * Approved case studies appear underneath automatically once they exist.
 */

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2 border-b border-line py-6 sm:grid-cols-12 sm:gap-6">
      <dt className="font-mono text-[0.72rem] font-medium uppercase tracking-[0.14em] text-copper-700 sm:col-span-4 sm:pt-1.5">{label}</dt>
      <dd className="text-lg leading-relaxed text-navy-900 sm:col-span-8">{children}</dd>
    </div>
  );
}

export function ProjectProof() {
  const projects = getProjects().slice(0, 3);
  const { reviews, credentials } = site;

  return (
    <Section labelledBy="proof-heading">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <SectionHeading
            id="proof-heading"
            code="03"
            eyebrow="Before you commit"
            size="md"
            title="Straight answers, and the record to back them."
            intro={
              <>
                <p>We tell you what your project is likely to need, who else may need to be involved, and what is outside our control.</p>
                <p className="mt-4">We never promise a permit approval. That decision belongs to your municipality.</p>
              </>
            }
          />
        </div>

        <dl className="border-t border-navy-900 lg:col-span-7">
          <Row label="Google reviews">
            {reviews ? (
              <a href={reviews.url} className="inline-flex items-center gap-2 underline decoration-copper-500/60 underline-offset-4 hover:text-copper-700">
                Rated {reviews.rating} out of 5 from {reviews.count} reviews on Google
                <ExternalIcon />
              </a>
            ) : (
              <Placeholder>Google rating and a link to the Business Profile, once confirmed</Placeholder>
            )}
          </Row>
          <Row label="Qualifications">
            {credentials.length > 0 ? credentials.join(". ") : <Placeholder>designer registration (BCIN) details for the drawings, once confirmed</Placeholder>}
          </Row>
          <Row label="Projects">
            {projects.length > 0 ? (
              <Link href={paths.projects} className="underline decoration-copper-500/60 underline-offset-4 hover:text-copper-700">
                Read our case studies
              </Link>
            ) : (
              <Placeholder>approved project photos and case studies</Placeholder>
            )}
          </Row>
          <Row label="Pricing">Quoted for each project once we understand the scope. We do not publish set prices, because they depend on the work.</Row>
          <Row label="Where we work">
            Homeowners and property owners across the Greater Toronto Area.{" "}
            <Link href={paths.serviceAreas} className="whitespace-nowrap underline decoration-copper-500/60 underline-offset-4 hover:text-copper-700">
              Service areas
            </Link>
          </Row>
        </dl>
      </div>

      {projects.length > 0 ? (
        <div className="mt-20">
          <div className="flex items-end justify-between gap-6 border-b border-line pb-4">
            <h3 className="font-display text-display-sm text-navy-900">Recent projects</h3>
            <ArrowLink href={paths.projects}>All projects</ArrowLink>
          </div>
          <ul className="mt-10 grid gap-10 md:grid-cols-12">
            {projects.map((p, i) => (
              <li key={p.slug} className={i === 0 ? "md:col-span-6" : "md:col-span-3"}>
                <Link href={paths.project(p.slug)} className="group block">
                  <Figure visual={p.visual} caption={false} aspect={i === 0 ? "aspect-[4/3]" : "aspect-[3/4]"} />
                  <h4 className="mt-5 font-display text-xl text-navy-900 group-hover:text-copper-700">{p.title}</h4>
                  <p className="mt-2 text-ink-muted">{p.summary}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Section>
  );
}
