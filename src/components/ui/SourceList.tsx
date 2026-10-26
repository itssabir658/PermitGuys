import type { SourceRef } from "@/content/types";
import { ExternalIcon } from "./Icons";
import { Wordmark } from "./Wordmark";

const fmt = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

export function formatDate(iso: string) {
  return fmt.format(new Date(`${iso}T00:00:00Z`));
}

export function SourceList({ sources }: { sources: SourceRef[] }) {
  return (
    <ol className="space-y-4">
      {sources.map((s) => (
        <li key={s.url} className="border-l border-ink/25 pl-4">
          <a href={s.url} rel="noopener" target="_blank" className="group inline-flex items-start gap-2 font-medium text-charcoal-900">
            <span className="underline decoration-line-strong underline-offset-4 transition-[text-decoration-color] duration-300 ease-(--e-ui) group-hover:decoration-current">{s.title}</span>
            <ExternalIcon className="mt-1 size-3.5 shrink-0" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
          <p className="mt-1 text-sm text-ink-muted">
            {s.publisher}
            {" · "}
            {s.checked ? <>Checked {formatDate(s.checked)}</> : <span data-placeholder="">
              Link not yet verified by <Wordmark />
            </span>}
          </p>
        </li>
      ))}
    </ol>
  );
}
