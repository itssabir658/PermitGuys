import Link from "next/link";
import type { Route } from "next";
import { ArrowRight } from "./Icons";

export interface IndexItem {
  href: Route;
  title: string;
  description: string;
}

/**
 * Numbered index set like the drawing list on a permit set's cover sheet:
 * number, title, description. Used for services, where the order matters.
 */
export function IndexList({ items, columns = ["No.", "Project", "What the page covers"], headingLevel = "h3", start = 1 }: { items: IndexItem[]; columns?: [string, string, string]; headingLevel?: "h2" | "h3"; start?: number }) {
  const H = headingLevel;
  return (
    <div>
      <div aria-hidden="true" className="hidden grid-cols-12 gap-6 border-b border-navy-900 pb-3 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-ink-muted sm:grid">
        <span className="col-span-1">{columns[0]}</span>
        <span className="col-span-4">{columns[1]}</span>
        <span className="col-span-7">{columns[2]}</span>
      </div>
      <ol className="border-t border-navy-900 sm:border-t-0">
        {items.map((item, i) => (
          <li key={item.href} className="border-b border-line">
            <Link href={item.href} className="group grid grid-cols-12 items-baseline gap-x-6 gap-y-2 py-6 transition-colors hover:bg-paper-100/70">
              <span className="col-span-2 font-mono text-sm text-copper-700 sm:col-span-1">{String(start + i).padStart(2, "0")}</span>
              <H className="col-span-10 font-display text-2xl leading-tight text-navy-900 group-hover:text-copper-700 sm:col-span-4">{item.title}</H>
              <span className="col-span-10 col-start-3 leading-relaxed text-ink-muted sm:col-span-6 sm:col-start-auto">{item.description}</span>
              <span className="col-span-1 hidden justify-self-end text-copper-600 sm:block">
                <ArrowRight className="size-5 transition-transform duration-300 ease-out-soft group-hover:translate-x-1" />
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
