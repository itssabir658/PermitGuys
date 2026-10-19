import type { ReactNode } from "react";
import { Container } from "./Container";

export interface TocItem {
  id: string;
  label: string;
}

/** Two-column body for templates: an "On this page" index and the content. */
export function ArticleLayout({ toc, children }: { toc: TocItem[]; children: ReactNode }) {
  return (
    <Container className="py-16 sm:py-20 lg:py-24">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <aside className="hidden lg:col-span-3 lg:block">
          <nav aria-label="On this page" className="sticky top-28">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">On this page</p>
            <ul className="mt-5 space-y-3 border-l border-line text-sm">
              {toc.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} className="-ml-px block border-l border-transparent pl-4 text-ink-muted hover:border-copper-500 hover:text-navy-900">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <div className="min-w-0 space-y-20 lg:col-span-9">{children}</div>
      </div>
    </Container>
  );
}

export function ArticleSection({ id, title, children, intro }: { id: string; title: string; children: ReactNode; intro?: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-heading`} id={id} className="scroll-mt-28">
      <h2 id={`${id}-heading`} className="font-display text-display-md text-balance text-navy-900">
        {title}
      </h2>
      {intro ? <div className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted">{intro}</div> : null}
      <div className="mt-8">{children}</div>
    </section>
  );
}

/** Ruled bullet list with copper dashes, matching .prose-pg lists. */
export function RuledList({ items }: { items: string[] }) {
  return (
    <ul className="max-w-3xl divide-y divide-line border-y border-line">
      {items.map((item) => (
        <li key={item} className="flex gap-4 py-4 leading-relaxed text-ink">
          <span aria-hidden="true" className="mt-3 h-px w-4 shrink-0 bg-copper-500" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="mt-6 max-w-3xl border-l-2 border-navy-300 pl-5 text-[0.95rem] leading-relaxed text-ink-muted">{children}</p>;
}
