import type { Faq } from "@/content/types";
import { PlusIcon } from "./Icons";
import { cn } from "./cn";

/**
 * Native disclosure widgets: keyboard and screen-reader accessible without
 * JavaScript, and the answers stay in the HTML for search and AI crawlers.
 */
export function FaqList({ faqs, className }: { faqs: Faq[]; className?: string }) {
  return (
    <div className={cn("divide-y divide-line border-y border-line", className)}>
      {faqs.map((faq) => (
        <details key={faq.question} className="group">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 text-left [&::-webkit-details-marker]:hidden">
            <h3 className="font-display text-xl leading-snug text-navy-900 sm:text-[1.4rem]">{faq.question}</h3>
            <span className="mt-1.5 shrink-0 text-copper-600 transition-transform duration-300 group-open:rotate-45">
              <PlusIcon className="size-5" />
            </span>
          </summary>
          <div className="max-w-2xl pb-7 text-[1.0625rem] leading-relaxed text-ink-muted">
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
