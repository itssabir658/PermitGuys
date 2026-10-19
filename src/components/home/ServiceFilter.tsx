"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/components/ui/cn";

export type ServiceFilterId = "all" | "residential" | "commercial";

const filters: { id: ServiceFilterId; label: string; more?: string }[] = [
  { id: "all", label: "All" },
  { id: "residential", label: "Homes" },
  { id: "commercial", label: "Businesses", more: " and landlords" },
];

/**
 * Filter buttons over the services grid. The cards stay server-rendered and
 * all of them are in the HTML; the filter only sets data-filter on the grid,
 * and CSS hides cards whose data-category does not match (see globals.css).
 */
export function ServiceFilter({ heading, counts, children, className }: { heading: ReactNode; counts: Record<ServiceFilterId, number>; children: ReactNode; className?: string }) {
  const [filter, setFilter] = useState<ServiceFilterId>("all");
  const [touched, setTouched] = useState(false);
  const current = filters.find((f) => f.id === filter);
  const label = `${current?.label ?? ""}${current?.more ?? ""}`;

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">{heading}</div>
        <div className="lg:col-span-5 lg:justify-self-end">
          <div role="group" aria-label="Show services for" className="glass inline-flex max-w-full flex-wrap gap-1 rounded-2xl p-1.5">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={filter === f.id}
                onClick={() => {
                  setFilter(f.id);
                  setTouched(true);
                }}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold sm:px-4 transition-colors duration-300",
                  filter === f.id ? "bg-charcoal-900 text-paper shadow-[0_8px_20px_-10px_rgb(28_28_28/0.7)]" : "text-charcoal-800 hover:bg-white/80",
                )}
              >
                <span>
                  {f.label}
                  {f.more ? <span className="hidden sm:inline">{f.more}</span> : null}
                </span>
                <span className={cn("rounded-full px-1.5 text-xs tabular-nums", filter === f.id ? "bg-white/15" : "bg-charcoal-900/[0.07]")}>{counts[f.id]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {touched ? `Showing ${counts[filter]} ${filter === "all" ? "services" : `services for ${label.toLowerCase()}`}.` : ""}
      </p>
      <div data-filter={filter} data-filtered={touched ? "" : undefined} className={cn("grid gap-4 md:grid-cols-2 lg:grid-flow-dense lg:grid-cols-3", className)}>
        {children}
      </div>
    </>
  );
}
