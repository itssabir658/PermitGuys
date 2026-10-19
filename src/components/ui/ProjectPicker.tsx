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
 * "What are you planning?" shortcut into the inquiry form. Each link opens
 * the form with the matching project type already selected.
 */
export function ProjectPicker({ onDark, className, id = "picker-label", title = "What are you planning?" }: { onDark?: boolean; className?: string; id?: string; title?: string }) {
  const items = order
    .map((slug) => projectTypes.find((t) => t.service === slug))
    .filter((t): t is (typeof projectTypes)[number] => Boolean(t));
  return (
    <div className={className}>
      <p id={id} className={cn("font-mono text-[0.72rem] font-medium uppercase tracking-[0.14em]", onDark ? "text-copper-300" : "text-copper-700")}>
        {title}
      </p>
      <ul aria-labelledby={id} className={cn("mt-4 grid border-t sm:grid-cols-2", onDark ? "border-paper/15" : "border-line")}>
        {items.map((t) => (
          <li key={t.label} className={cn("border-b sm:odd:border-r sm:odd:pr-5 sm:even:pl-5", onDark ? "border-paper/15" : "border-line")}>
            <Link
              href={paths.contactFor(t.service!)}
              className={cn(
                "group flex min-h-12 items-center justify-between gap-3 py-3 text-[0.95rem] transition-colors",
                onDark ? "text-paper hover:text-copper-300" : "text-navy-900 hover:text-copper-700",
              )}
            >
              <span>
                <span className="sr-only">Start an inquiry: </span>
                {shortLabel[t.service!] ?? t.label}
              </span>
              <ArrowRight className={cn("size-4 shrink-0 transition-transform duration-300 ease-out-soft group-hover:translate-x-0.5", onDark ? "text-copper-300" : "text-copper-600")} />
            </Link>
          </li>
        ))}
        <li className={cn("border-b sm:pl-5", onDark ? "border-paper/15" : "border-line")}>
          <Link
            href={paths.contact}
            className={cn("group flex min-h-12 items-center justify-between gap-3 py-3 text-[0.95rem] transition-colors", onDark ? "text-navy-100/80 hover:text-copper-300" : "text-ink-muted hover:text-copper-700")}
          >
            <span>
              <span className="sr-only">Start an inquiry: </span>
              Something else
            </span>
            <ArrowRight className={cn("size-4 shrink-0", onDark ? "text-copper-300" : "text-copper-600")} />
          </Link>
        </li>
      </ul>
    </div>
  );
}
