import Link from "next/link";
import type { Route } from "next";
import { ArrowRight } from "./Icons";

export interface LinkRow {
  href: Route;
  title: string;
  description?: string;
  meta?: string;
}

/** Ruled list of links, used for related services, guides and indexes. */
export function LinkRows({ items, headingLevel = "h3" }: { items: LinkRow[]; headingLevel?: "h2" | "h3" }) {
  const H = headingLevel;
  return (
    <ul className="divide-y divide-line border-y border-line">
      {items.map((item) => (
        <li key={item.href}>
          <Link href={item.href} className="group grid gap-2 py-6 sm:grid-cols-12 sm:items-baseline sm:gap-8">
            {item.meta ? <span className="font-mono text-[0.72rem] font-medium uppercase tracking-[0.14em] text-copper-700 sm:col-span-3">{item.meta}</span> : null}
            <span className={item.meta ? "sm:col-span-8" : "sm:col-span-11"}>
              <H className="font-display text-xl text-navy-900 transition-colors group-hover:text-copper-700 sm:text-2xl">{item.title}</H>
              {item.description ? <span className="mt-2 block text-ink-muted">{item.description}</span> : null}
            </span>
            <span className="hidden justify-self-end text-copper-600 sm:col-span-1 sm:block">
              <ArrowRight className="size-5 transition-transform duration-300 ease-out-soft group-hover:translate-x-1" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
