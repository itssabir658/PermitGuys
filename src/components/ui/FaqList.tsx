import type { Faq } from "@/content/types";
import { PlusIcon } from "./Icons";
import { cn } from "./cn";

/**
 * Native disclosure widgets in glass cards: keyboard and screen-reader
 * accessible without JavaScript, and the answers stay in the HTML for search
 * and AI crawlers. They open smoothly where the browser supports it.
 */
export function FaqList({ faqs, className }: { faqs: Faq[]; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {faqs.map((faq) => (
        <details key={faq.question} className="smooth group glass rounded-2xl open:bg-white/80">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 rounded-2xl px-5 py-5 text-left sm:px-7 sm:py-6 [&::-webkit-details-marker]:hidden">
            <h3 className="font-display text-lg leading-snug text-charcoal-900 sm:text-xl">{faq.question}</h3>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-charcoal-900/10 bg-white/70 text-brand-600 transition-all duration-300 group-open:rotate-45 group-open:border-brand-500 group-open:bg-brand-500 group-open:text-white">
              <PlusIcon className="size-4" />
            </span>
          </summary>
          <div className="max-w-2xl px-5 pb-6 text-[1.0625rem] leading-relaxed text-ink-muted sm:px-7 sm:pb-7">
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
