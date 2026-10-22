"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLink } from "@/components/ui/ButtonLink";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { cn } from "@/components/ui/cn";
import type { ProcessStep } from "@/content/types";
import { paths } from "@/lib/routes";

const ownerLabel: Record<ProcessStep["owner"], string> = {
  You: "You",
  PermitGuys: "PermitGuys",
  Municipality: "Your municipality",
  "Other consultants": "Other consultants",
};

/*
 * The permitting journey as a pinned sequence on large screens: the
 * heading and a step counter stay in place while the steps scroll past,
 * and the step being read comes into full contrast. Built on CSS sticky
 * positioning and an IntersectionObserver; on small screens, without
 * JavaScript or with reduced motion it is a plain numbered list.
 */
export function Process({ steps }: { steps: ProcessStep[] }) {
  const [current, setCurrent] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setCurrent(Number((entry.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="grid gap-16 lg:grid-cols-12 lg:gap-8">
      <div className="lg:col-span-5">
        <div className="lg:sticky lg:top-32">
          <Eyebrow code="04">Process</Eyebrow>
          <h2 id="process-heading" className="mt-10 max-w-lg font-display text-display-xl font-light text-balance text-ink">
            From first sketch to the city&rsquo;s decision.
          </h2>
          <p className="mt-8 max-w-md text-lede text-ink-muted">
            Every step names who carries it. We prepare the drawings and documents; your municipality reviews the application and decides on the permit.
          </p>
          <div aria-hidden="true" className="mt-14 hidden items-end gap-6 lg:flex">
            <span className="relative block h-[clamp(5rem,9vw,8.5rem)] overflow-hidden font-display text-[clamp(5rem,9vw,8.5rem)] leading-none font-light tracking-[-0.06em] text-ink tabular-nums">
              <span className="block transition-transform duration-700 ease-out-expo" style={{ transform: `translateY(-${(current * 100) / steps.length}%)` }}>
                {steps.map((_, i) => (
                  <span key={i} className="block h-[clamp(5rem,9vw,8.5rem)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                ))}
              </span>
            </span>
            <span className="pb-3 text-label text-ink-muted">/ {String(steps.length).padStart(2, "0")}</span>
          </div>
          <div aria-hidden="true" className="mt-6 hidden h-px w-full max-w-sm bg-line lg:block">
            <div className="h-px origin-left bg-ink transition-transform duration-700 ease-out-expo" style={{ transform: `scaleX(${(current + 1) / steps.length})` }} />
          </div>
          <ArrowLink href={paths.howItWorks} className="mt-12">
            How it works, in detail
          </ArrowLink>
        </div>
      </div>

      <ol className="lg:col-span-6 lg:col-start-7">
        {steps.map((step, i) => (
          <li
            key={step.title}
            ref={(el) => {
              refs.current[i] = el;
            }}
            data-index={i}
            className={cn(
              "border-t border-line py-10 transition-opacity duration-700 ease-out-expo lg:flex lg:min-h-[62vh] lg:flex-col lg:justify-center lg:py-16",
              i === steps.length - 1 && "border-b",
              current === i ? "lg:opacity-100" : "motion-safe:lg:opacity-30",
            )}
          >
            <div className="flex items-baseline justify-between gap-6">
              <span className="text-label text-ink tabular-nums">Step {String(i + 1).padStart(2, "0")}</span>
              <span className={cn("flex items-center gap-2 text-label", step.owner === "PermitGuys" ? "text-ink" : "text-ink-muted")}>
                <span aria-hidden="true" className={cn("size-1.5 rounded-full", step.owner === "PermitGuys" ? "bg-brand-400" : step.owner === "Municipality" ? "bg-ink" : "ring-1 ring-ink ring-inset")} />
                <span className="sr-only">Handled by: </span>
                {ownerLabel[step.owner]}
              </span>
            </div>
            <h3 className="mt-8 font-display text-display-md font-light text-ink">{step.title}</h3>
            <p className="mt-5 max-w-lg text-lede text-ink-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
