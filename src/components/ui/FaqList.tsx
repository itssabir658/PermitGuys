import type { Faq } from "@/content/types";
import { PlusIcon } from "./Icons";
import { cn } from "./cn";

/**
 * Native disclosure widgets on hairline rules: keyboard and screen-reader
 * accessible without JavaScript, and the answers stay in the HTML for search
 * and AI crawlers. They open smoothly where the browser supports it.
 */
export function FaqList({ faqs, className }: { faqs: Faq[]; className?: string }) {
  return (
    <div className={cn("border-t border-line", className)}>
      {faqs.map((faq) => (
        <details key={faq.question} className="smooth group border-b border-line">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-8 py-7 text-left [&::-webkit-details-marker]:hidden">
            <h3 className="font-display text-display-sm text-ink">{faq.question}</h3>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full text-ink ring-1 ring-ink/15 transition-[transform,background-color,color] duration-500 ease-out-expo ring-inset group-open:rotate-45 group-open:bg-ink group-open:text-ivory">
              <PlusIcon className="size-4" />
            </span>
          </summary>
          <div className="max-w-2xl pr-14 pb-8 text-[1.0625rem] leading-relaxed text-ink-muted">
            {faq.answer.map((p) => (
              <p key={p} className="mt-3 first:mt-0">
                {p}
              </p>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
