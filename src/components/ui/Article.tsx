import type { ReactNode } from "react";
import { Container } from "./Container";

export interface TocItem {
  id: string;
  label: string;
}

/** Two-column body for templates: an "On this page" index and the content. */
export function ArticleLayout({ toc, children }: { toc: TocItem[]; children: ReactNode }) {
  return (
    <Container className="pb-24 sm:pb-32 lg:pb-40">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
        <aside className="hidden lg:col-span-3 lg:block">
          <nav aria-label="On this page" data-toc="" className="sticky top-32">
            <p className="text-label text-ink-muted">On this page</p>
            <ul className="mt-6 border-l border-line text-[0.9375rem]">
              {toc.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} className="-ml-px block border-l border-transparent py-2 pl-5 text-ink-muted transition-colors duration-500 hover:text-ink aria-[current=location]:border-ink aria-[current=location]:text-ink">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <div className="min-w-0 space-y-24 lg:col-span-8 lg:col-start-5 lg:space-y-32">{children}</div>
      </div>
    </Container>
  );
}

export function ArticleSection({ id, title, children, intro }: { id: string; title: string; children: ReactNode; intro?: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-heading`} id={id} data-reveal="" className="scroll-mt-28">
      <h2 id={`${id}-heading`} className="font-display text-display-md font-light text-balance text-ink">
        {title}
      </h2>
      {intro ? <div className="mt-6 max-w-2xl text-lede text-ink-muted">{intro}</div> : null}
      <div className="mt-10">{children}</div>
    </section>
  );
}

/** Hairline-ruled list, one row per item. */
export function RuledList({ items }: { items: string[] }) {
  return (
    <ul className="max-w-3xl divide-y divide-line border-y border-line">
      {items.map((item) => (
        <li key={item} className="flex gap-5 py-5 leading-relaxed text-ink">
          <span aria-hidden="true" className="mt-[0.7rem] h-px w-4 shrink-0 bg-ink" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="mt-6 max-w-3xl border-l border-brand-500 py-1 pl-5 text-[0.9375rem] leading-relaxed text-ink-muted">{children}</p>;
}
