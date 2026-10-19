import Link from "next/link";
import { projectTypes } from "@/lib/validation/inquiry";
import { paths } from "@/lib/routes";
import { ArrowRight } from "./Icons";
import { cn } from "./cn";

/** Order shown to visitors: the most common homeowner projects first. */
const order = [
  "legal-basement-permits",
  "residential-additions",
  "deck-permits",
  "interior-renovation-permits",
  "landlord-permits",
  "commercial-permits",
  "custom-home-permits",
];

const shortLabel: Record<string, string> = {
  "legal-basement-permits": "Basement apartment",
  "residential-additions": "Addition",
  "deck-permits": "Deck",
  "interior-renovation-permits": "Interior renovation",
  "landlord-permits": "Rental property",
  "commercial-permits": "Commercial space",
  "custom-home-permits": "Custom home",
};

/**
 * "What are you planning?" shortcut into the inquiry form, as a row of glass
 * tiles. Each tile opens the form with the matching project type selected.
 */
export function ProjectPicker({ onDark, className, id = "picker-label", title = "What are you planning?" }: { onDark?: boolean; className?: string; id?: string; title?: string }) {
  const items = order
    .map((slug) => projectTypes.find((t) => t.service === slug))
    .filter((t): t is (typeof projectTypes)[number] => Boolean(t))
    .map((t) => ({ href: paths.contactFor(t.service!), label: shortLabel[t.service!] ?? t.label }));
  const tile = cn(
    "group flex h-full min-h-[4.5rem] items-end justify-between gap-3 rounded-2xl border p-4 text-[0.95rem] font-semibold leading-snug transition-all duration-300 ease-out-soft hover:-translate-y-0.5 lg:min-h-[6.5rem]",
    onDark ? "border-white/10 bg-white/[0.05] text-paper hover:border-copper-300/50 hover:bg-white/[0.1]" : "border-white/80 bg-white/60 text-navy-900 hover:border-copper-500/40 hover:bg-white",
  );
  return (
    <div className={cn("rounded-[1.75rem] p-4 sm:p-5", onDark ? "glass-dark" : "glass", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-1 pb-4">
        <p id={id} className={cn("font-display text-xl", onDark ? "text-paper" : "text-navy-900")}>
          {title}
        </p>
        <p className={cn("text-sm", onDark ? "text-navy-100/70" : "text-ink-muted")}>Pick one to start an inquiry with it filled in.</p>
      </div>
      <ul aria-labelledby={id} className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {[...items, { href: paths.contact, label: "Something else" }].map((item) => (
          <li key={item.label}>
            <Link href={item.href} className={tile}>
              <span>
                <span className="sr-only">Start an inquiry: </span>
                {item.label}
              </span>
              <ArrowRight
                className={cn(
                  "mb-0.5 size-4 shrink-0 -rotate-45 transition-transform duration-300 ease-out-soft group-hover:rotate-0",
                  onDark ? "text-copper-300" : "text-copper-600",
                )}
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
