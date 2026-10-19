import Link from "next/link";
import { primaryNav } from "@/content/navigation";
import { site } from "@/content/site";
import { paths } from "@/lib/routes";
import { MainNav } from "./MainNav";

/**
 * Wordmark placeholder: set in the display face until the logo is supplied.
 * The mark is a drawing title-block corner. The visible text still reads
 * "PermitGuys" for screen readers and search.
 * Replace the contents of <Wordmark> with the logo SVG when available.
 */
export function Wordmark({ onDark }: { onDark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3" data-placeholder-logo="">
      <svg viewBox="0 0 28 28" aria-hidden="true" className="size-7 shrink-0">
        <rect x="1" y="1" width="26" height="26" rx="5" fill="none" stroke="currentColor" strokeWidth="1.5" className={onDark ? "text-paper" : "text-navy-900"} />
        <path d="M27 11V22A5 5 0 0 1 22 27H11Z" fill="#C77A45" />
      </svg>
      <span className={`font-display text-[1.4rem] leading-none font-semibold tracking-[-0.03em] ${onDark ? "text-paper" : "text-navy-900"}`}>
        Permit<span className={onDark ? "text-copper-300" : "text-copper-600"}>Guys</span>
      </span>
    </span>
  );
}

/**
 * Floating glass bar. The blur sits on its own layer behind the content:
 * backdrop-filter on the bar itself would trap the fixed mobile menu inside it.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4">
      <div className="relative isolate mx-auto flex h-16 max-w-[84rem] items-center justify-between gap-6 pr-2 pl-4 sm:pl-6">
        <span
          aria-hidden="true"
          className="absolute inset-0 -z-10 rounded-2xl border border-white/10 bg-navy-950/70 shadow-[0_18px_40px_-24px_rgb(0_0_0/0.65)] backdrop-blur-xl backdrop-saturate-150"
        />
        <Link href={paths.home} className="shrink-0 rounded-lg" aria-label={`${site.name} home`}>
          <Wordmark onDark />
        </Link>
        <MainNav groups={primaryNav} ctaHref={paths.contact} />
      </div>
    </header>
  );
}
