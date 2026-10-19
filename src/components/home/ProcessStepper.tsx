"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import type { ProcessStep } from "@/content/types";
import { ArrowRight } from "@/components/ui/Icons";
import { cn } from "@/components/ui/cn";

const parties: { id: ProcessStep["owner"]; label: string }[] = [
  { id: "You", label: "You" },
  { id: "PermitGuys", label: "PermitGuys" },
  { id: "Other consultants", label: "Other consultants" },
  { id: "Municipality", label: "The city" },
];

/**
 * The process as tabs: pick a step to see what happens and who carries it.
 * Every panel is rendered, so all of the copy is in the HTML; arrow keys,
 * Home and End move between steps, following the ARIA tabs pattern.
 */
export function ProcessStepper({ steps }: { steps: ProcessStep[] }) {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const id = useId();
  const shown = parties.filter((p) => steps.some((s) => s.owner === p.id));

  const select = (i: number, focus = false) => {
    const next = (i + steps.length) % steps.length;
    setActive(next);
    if (focus) tabs.current[next]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const keys: Record<string, number> = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: steps.length - 1 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    select(keys[e.key], true);
  };

  const goTo = (i: number) => {
    select(i);
    // On small screens the panel sits under the list; bring it into view.
    requestAnimationFrame(() => panels.current[i]?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
  };

  return (
    <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
      <div role="tablist" aria-orientation="vertical" aria-label="Permit process steps" className="flex flex-col gap-2 lg:col-span-5">
        {steps.map((step, i) => {
          const selected = i === active;
          return (
            <button
              key={step.title}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${id}-tab-${i}`}
              aria-selected={selected}
              aria-controls={`${id}-panel-${i}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => goTo(i)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "group relative flex min-h-16 items-center gap-4 rounded-2xl border px-4 py-3 text-left transition-all duration-300 ease-out-soft",
                selected ? "border-navy-900 bg-navy-900 text-paper shadow-[0_18px_40px_-20px_rgb(20_38_61/0.6)]" : "border-white/80 bg-white/55 text-navy-900 backdrop-blur-md hover:bg-white/85",
              )}
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl font-display text-sm font-medium tabular-nums transition-colors",
                  selected ? "bg-copper-500 text-navy-950" : "bg-navy-900/[0.06] text-copper-700",
                )}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex-1">
                <span className="block font-semibold leading-snug">{step.title}</span>
                <span className={cn("mt-0.5 block text-sm", selected ? "text-navy-100/75" : "text-ink-muted")}>{parties.find((p) => p.id === step.owner)?.label}</span>
              </span>
              <ArrowRight className={cn("size-4 shrink-0 transition-all duration-300", selected ? "text-copper-300" : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-60")} />
            </button>
          );
        })}
      </div>

      {steps.map((step, i) => (
        <div
          key={step.title}
          ref={(el) => {
            panels.current[i] = el;
          }}
          role="tabpanel"
          id={`${id}-panel-${i}`}
          aria-labelledby={`${id}-tab-${i}`}
          hidden={i !== active}
          tabIndex={0}
          className="glass scroll-mt-28 rounded-3xl p-6 sm:p-8 lg:col-span-7 lg:col-start-6 lg:row-start-1 lg:p-10"
        >
          <div className="motion-rise flex h-full flex-col">
            <p className="text-label text-copper-700">
              Step {String(i + 1).padStart(2, "0")} of {String(steps.length).padStart(2, "0")}
            </p>
            <h3 className="mt-4 font-display text-display-md text-balance text-navy-900">{step.title}</h3>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-muted">{step.body}</p>

            <div className="mt-10 lg:mt-auto lg:pt-10">
              <p className="text-sm font-semibold text-navy-900">Who carries this step</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {shown.map((p) => {
                  const owner = p.id === step.owner;
                  return (
                    <li
                      key={p.id}
                      className={cn(
                        "inline-flex min-h-9 items-center gap-2 rounded-full border px-3.5 text-sm",
                        owner ? "border-copper-500 bg-copper-500 font-semibold text-navy-950" : "border-navy-900/10 bg-white/50 text-ink-muted",
                      )}
                    >
                      {owner ? <span aria-hidden="true" className="size-1.5 rounded-full bg-navy-950" /> : null}
                      {p.label}
                      {owner ? <span className="sr-only"> (carries this step)</span> : null}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="mt-8 flex items-center justify-between gap-4 border-t border-navy-900/10 pt-6">
              <button
                type="button"
                onClick={() => goTo(i - 1)}
                disabled={i === 0}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-navy-900 transition-colors hover:bg-white/70 disabled:pointer-events-none disabled:opacity-35"
              >
                <ArrowRight className="size-4 rotate-180" />
                Previous<span className="sr-only"> step</span>
              </button>
              <button
                type="button"
                onClick={() => goTo(i + 1)}
                disabled={i === steps.length - 1}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-navy-900 px-4 text-sm font-semibold text-paper transition-colors hover:bg-navy-800 disabled:pointer-events-none disabled:opacity-35"
              >
                Next<span className="sr-only"> step</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
