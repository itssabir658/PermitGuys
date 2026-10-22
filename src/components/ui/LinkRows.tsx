import Link from "next/link";
import type { Route } from "next";
import { ArrowRight } from "./Icons";

export interface LinkRow {
  href: Route;
  title: string;
  description?: string;
  meta?: string;
}

/** Hairline-ruled link rows, used for related services, guides and indexes. */
export function LinkRows({ items, headingLevel = "h3" }: { items: LinkRow[]; headingLevel?: "h2" | "h3" }) {
  const H = headingLevel;
  return (
    <ul className="border-t border-line">
      {items.map((item) => (
        <li key={item.href} className="border-b border-line">
          <Link
            href={item.href}
            className="group flex items-center gap-6 py-7"
          >
            <span className="min-w-0 flex-1">
              {item.meta ? <span className="mb-3 block text-label text-ink-muted">{item.meta}</span> : null}
              <H className="font-display text-display-sm font-light text-ink"><span className="link-draw">{item.title}</span></H>
              {item.description ? <span className="mt-2 block leading-relaxed text-ink-muted">{item.description}</span> : null}
            </span>
            <span aria-hidden="true" className="hidden size-12 shrink-0 items-center justify-center rounded-full text-ink ring-1 ring-ink/15 transition-colors duration-500 ease-out-expo ring-inset group-hover:bg-ink group-hover:text-ivory sm:flex">
              <ArrowRight className="size-4 -rotate-45 transition-transform duration-500 ease-out-expo group-hover:rotate-0" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
