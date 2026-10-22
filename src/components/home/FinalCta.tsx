import Image from "next/image";
import type { CSSProperties } from "react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { STUDY_NOTE, plates } from "@/content/imagery";
import { paths } from "@/lib/routes";

const lines = ["Let’s talk about", "your project."];

/** Closing composition: the opening house returns, darker, under one large invitation. */
export function FinalCta() {
  const plate = plates.infill;
  return (
    <section aria-labelledby="final-cta-heading" className="relative isolate overflow-hidden bg-charcoal-950 text-ivory">
      <div aria-hidden="true" className="grain absolute inset-0 -z-10">
        <div data-parallax="" className="absolute inset-0">
          <Image src={plate.src} alt="" fill sizes="100vw" quality={78} className="object-cover object-[70%_70%] opacity-55" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(17_17_16/0.85),rgb(17_17_16/0.35))]" />
      </div>
      <Container className="flex min-h-[max(36rem,90svh)] flex-col justify-between py-24 lg:py-32">
        <p className="text-label text-ivory/70">Start a project</p>
        <div>
          <h2 id="final-cta-heading" data-reveal="" data-reveal-type="lines" className="font-display text-display-2xl font-light">
            {lines.map((line, i) => (
              <span key={line} className="line" style={{ "--i": i } as CSSProperties}>
                <span>{line}</span>
              </span>
            ))}
          </h2>
          <div data-reveal="" className="mt-12 grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-8">
            <p className="max-w-md text-lede text-ivory/80 lg:col-span-5">
              Tell us what you are planning and where. We will review the details and explain how we can help with drawings and the permit process.
            </p>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-5 lg:col-span-6 lg:col-start-7 lg:justify-end">
              <ButtonLink href={paths.contact} variant="light">
                Discuss your project
              </ButtonLink>
              <ButtonLink href={paths.howItWorks} variant="ghost-light">
                How it works
              </ButtonLink>
            </div>
          </div>
        </div>
        <p className="text-label text-ivory/55">Background: {plate.caption}. {STUDY_NOTE}</p>
      </Container>
    </section>
  );
}
