"use client";

import { useState } from "react";
import { cn } from "@/components/ui/cn";
import { HeroDrawing, type ElevationView } from "./HeroDrawing";

const views: { id: ElevationView; label: string }[] = [
  { id: "existing", label: "Existing" },
  { id: "proposed", label: "Proposed" },
];

const descriptions: Record<ElevationView, string> = {
  existing: "Front elevation drawing of a single-storey bungalow as it stands today.",
  proposed: "Front elevation drawing of a bungalow with a proposed second-storey addition shown in copper.",
};

/**
 * The hero elevation in a glass frame, with an Existing / Proposed switch so
 * visitors can see what a permit drawing shows changing.
 */
export function HeroVisual() {
  const [view, setView] = useState<ElevationView>("proposed");
  const [drawKey, setDrawKey] = useState(0);

  const show = (next: ElevationView) => {
    if (next === view) return;
    if (next === "proposed") setDrawKey((k) => k + 1);
    setView(next);
  };

  return (
    <div className="glass-dark rounded-[1.75rem] p-2 sm:p-3">
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 pt-2 pb-3 sm:px-4">
        <p className="text-label text-navy-100/75">
          Front elevation <span className="text-navy-100/45">/ Illustration</span>
        </p>
        <div role="group" aria-label="Show the elevation" className="inline-flex rounded-xl border border-white/10 bg-navy-950/50 p-1">
          {views.map((v) => (
            <button
              key={v.id}
              type="button"
              aria-pressed={view === v.id}
              onClick={() => show(v.id)}
              className={cn(
                "min-h-10 rounded-lg px-4 text-sm font-semibold transition-colors duration-300",
                view === v.id ? "bg-paper text-navy-950 shadow-sm" : "text-navy-100/80 hover:text-paper",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
      <div role="img" aria-label={descriptions[view]} className="bg-drafting-grid-dark overflow-hidden rounded-[1.25rem] bg-navy-950/45 text-paper/85">
        {/* On phones the drawing is enlarged and cropped so the house, not the margins, fills the width. */}
        <HeroDrawing view={view} drawKey={drawKey} className="-ml-[15%] h-auto w-[115%] max-w-none sm:ml-0 sm:w-full" />
      </div>
    </div>
  );
}
