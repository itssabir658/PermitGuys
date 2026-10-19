import type { ProcessStep } from "@/content/types";
import { cn } from "./cn";

/** Numbered process with the owner of each step called out. */
export function StepList({ steps, onDark, showOwner = true }: { steps: ProcessStep[]; onDark?: boolean; showOwner?: boolean }) {
  return (
    <ol className={cn("grid border-t border-l sm:grid-cols-2", steps.length > 4 ? "lg:grid-cols-3" : "lg:grid-cols-4", onDark ? "border-paper/15" : "border-line")}>
      {steps.map((step, i) => (
        <li key={step.title} className={cn("flex flex-col border-r border-b p-7 sm:p-8", onDark ? "border-paper/15 bg-navy-900" : "border-line bg-paper")}>
          <span className={cn("font-display text-4xl", onDark ? "text-copper-300" : "text-copper-600")}>{String(i + 1).padStart(2, "0")}</span>
          <h3 className={cn("mt-6 text-lg font-semibold", onDark ? "text-paper" : "text-navy-900")}>{step.title}</h3>
          <p className={cn("mt-3 leading-relaxed", onDark ? "text-navy-100/80" : "text-ink-muted")}>{step.body}</p>
          {showOwner ? (
            <p className={cn("mt-auto pt-6 text-xs font-semibold uppercase tracking-[0.16em]", onDark ? "text-navy-100/60" : "text-ink-muted")}>
              <span className="sr-only">Handled by: </span>
              {step.owner}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
