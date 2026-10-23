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
        <li key={item.href} className="row-rule">
          <Link href={item.href} data-cube-host="" className="group flex items-center gap-6 py-7">
            <span className="min-w-0 flex-1">
              {item.meta ? <span className="mb-3 block text-label text-ink-muted">{item.meta}</span> : null}
              <H className="font-display text-display-sm font-light text-ink"><span className="link-draw">{item.title}</span></H>
              {item.description ? <span className="mt-2 block leading-relaxed text-ink-muted">{item.description}</span> : null}
            </span>
            {/* The link button's icon cell: a square that turns a quarter on its cube to the ink face. */}
            <span aria-hidden="true" className="link-cube hidden shrink-0 text-ink sm:block">
              <span className="link-button__cube">
                <span className="link-button__face">
                  <ArrowRight className="size-4 -rotate-45" />
                </span>
                <span className="link-button__face link-button__face--side">
                  <ArrowRight className="size-4" />
                </span>
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
