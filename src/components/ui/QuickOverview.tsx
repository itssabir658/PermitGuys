import type { QuickFact } from "@/content/types";
import { ExternalIcon } from "./Icons";

/**
 * "Quick permit overview": the answer-first facts near the top of service
 * and service-area pages, as a semantic definition list on the same
 * hairline rules as the page's other lists, so search and answer engines
 * can lift each term and its answer with the source beside it.
 */
export function QuickOverview({ facts }: { facts: QuickFact[] }) {
  return (
    <dl className="max-w-(--measure-article) border-t border-line">
      {facts.map((fact) => (
        <div key={fact.term} className="row-rule grid gap-2 py-5 sm:grid-cols-[11rem_1fr] sm:gap-8">
          <dt className="text-label text-ink-muted sm:pt-1">{fact.term}</dt>
          <dd className="leading-relaxed text-ink">
            {fact.detail}
            {fact.source ? (
              <span className="mt-2 block text-sm text-ink-muted">
                Source:{" "}
                <a href={fact.source.url} target="_blank" rel="noopener" className="underline decoration-line-strong underline-offset-4 transition-[text-decoration-color] duration-300 ease-(--e-ui) hover:decoration-current">
                  {fact.source.label}
                  <ExternalIcon className="ml-1.5 inline size-3.5 align-[-0.125em]" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </span>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
