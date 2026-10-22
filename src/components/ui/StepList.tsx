import type { CSSProperties } from "react";
import type { ProcessStep } from "@/content/types";
import { cn } from "./cn";

const partyOrder: ProcessStep["owner"][] = ["You", "PermitGuys", "Other consultants", "Municipality"];

/**
 * Process as a responsibility chart: one row per step and one column per
 * party, with a mark where the step's owner sits. It makes the point the
 * copy keeps making (the municipality decides, not us) visible at a glance.
 * On small screens the owner is printed under each step instead.
 */
export function StepList({ steps, onDark, showOwner = true }: { steps: ProcessStep[]; onDark?: boolean; showOwner?: boolean }) {
  const parties = partyOrder.filter((p) => steps.some((s) => s.owner === p));
  // Applied from the md breakpoint only, through a custom property.
  const cols = { "--chart-cols": `3.25rem minmax(0,1fr) repeat(${parties.length}, minmax(5.5rem, 7rem))` } as CSSProperties;
  const rule = onDark ? "border-ivory/15" : "border-line";
  const muted = onDark ? "text-charcoal-300" : "text-ink-muted";

  return (
    <div className={cn("border-t", onDark ? "border-ivory/30" : "border-ink/30")}>
      {showOwner ? (
        <div aria-hidden="true" style={cols} className={cn("hidden border-b py-4 text-label md:grid md:[grid-template-columns:var(--chart-cols)]", rule, muted)}>
          <span>Step</span>
          <span />
          {parties.map((p) => (
            <span key={p} className="text-center">
              {p === "Municipality" ? "The city" : p}
            </span>
          ))}
        </div>
      ) : null}
      <ol>
        {steps.map((step, i) => (
          <li key={step.title} style={showOwner ? cols : undefined} className={cn("grid grid-cols-[3.25rem_minmax(0,1fr)] border-b last:border-b-0", rule, showOwner && "md:[grid-template-columns:var(--chart-cols)]")}>
            <span className={cn("pt-8 text-label tabular-nums", onDark ? "text-ivory" : "text-ink")}>{String(i + 1).padStart(2, "0")}</span>
            <div className="py-7 pr-6">
              <h3 className={cn("font-display text-display-sm", onDark ? "text-ivory" : "text-ink")}>{step.title}</h3>
              <p className={cn("mt-2 max-w-xl leading-relaxed", muted)}>{step.body}</p>
              {showOwner ? (
                <p className={cn("mt-4 text-label md:sr-only", onDark ? "text-ivory" : "text-ink")}>
                  <span className="sr-only">Handled by: </span>
                  {step.owner}
                </p>
              ) : null}
            </div>
            {showOwner
              ? parties.map((p) => (
                  <span
                    key={p}
                    aria-hidden="true"
                    className={cn(
                      "relative hidden items-start justify-center pt-9 before:absolute before:inset-y-0 before:left-1/2 before:w-px md:flex",
                      onDark ? "before:bg-ivory/15" : "before:bg-line",
                    )}
                  >
                    {step.owner === p ? <span className={cn("relative size-2.5 rounded-full", p === "PermitGuys" ? "bg-brand-400" : onDark ? "bg-ivory" : "bg-ink")} /> : null}
                  </span>
                ))
              : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
