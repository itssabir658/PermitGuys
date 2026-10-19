import Link from "next/link";
import type { Route } from "next";
import { ArrowRight } from "./Icons";

export interface LinkRow {
  href: Route;
  title: string;
  description?: string;
  meta?: string;
}

/** Stacked glass link cards, used for related services, guides and indexes. */
export function LinkRows({ items, headingLevel = "h3" }: { items: LinkRow[]; headingLevel?: "h2" | "h3" }) {
  const H = headingLevel;
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="spotlight group glass flex items-center gap-6 rounded-2xl px-5 py-5 transition-all duration-300 ease-out-soft hover:-translate-y-0.5 hover:bg-white/80 sm:px-6"
          >
            <span className="min-w-0 flex-1">
              {item.meta ? <span className="mb-2 block text-label text-brand-700">{item.meta}</span> : null}
              <H className="font-display text-xl leading-snug text-charcoal-900 sm:text-[1.4rem]">{item.title}</H>
              {item.description ? <span className="mt-2 block leading-relaxed text-ink-muted">{item.description}</span> : null}
            </span>
            <span aria-hidden="true" className="hidden size-11 shrink-0 items-center justify-center rounded-full border border-charcoal-900/15 text-charcoal-900 transition-all duration-300 ease-out-soft group-hover:border-brand-500 group-hover:bg-brand-500 group-hover:text-white sm:flex">
              <ArrowRight className="size-4 transition-transform duration-300 ease-out-soft group-hover:translate-x-0.5" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
