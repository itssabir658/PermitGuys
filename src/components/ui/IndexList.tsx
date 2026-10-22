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
      <div aria-hidden="true" className="hidden grid-cols-12 gap-6 border-b border-ink/30 pb-4 text-label text-ink-muted sm:grid">
        <span className="col-span-1">{columns[0]}</span>
        <span className="col-span-4">{columns[1]}</span>
        <span className="col-span-7">{columns[2]}</span>
      </div>
      <ol>
        {items.map((item, i) => (
          <li key={item.href} className="border-b border-line">
            <Link href={item.href} className="group grid grid-cols-12 items-baseline gap-x-6 gap-y-2 py-8 lg:py-10">
              <span className="col-span-2 text-label tabular-nums text-ink-muted sm:col-span-1">{String(start + i).padStart(2, "0")}</span>
              <H className="col-span-10 font-display text-display-sm font-light text-ink transition-transform duration-700 ease-out-expo group-hover:translate-x-2 sm:col-span-4"><span className="link-draw">{item.title}</span></H>
              <span className="col-span-10 col-start-3 leading-relaxed text-ink-muted sm:col-span-6 sm:col-start-auto">{item.description}</span>
              <span className="col-span-1 hidden justify-self-end text-ink sm:block">
                <ArrowRight className="size-5 transition-transform duration-500 ease-out-expo group-hover:translate-x-1" />
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
