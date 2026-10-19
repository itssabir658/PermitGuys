import Link from "next/link";
import { primaryNav } from "@/content/navigation";
import { site } from "@/content/site";
import { Container } from "@/components/ui/Container";
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
        <rect x="1" y="1" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.5" className={onDark ? "text-paper" : "text-navy-900"} />
        <path d="M27 9V27H9Z" fill="#C77A45" />
        <path d="M1 19H9V27" fill="none" stroke="currentColor" strokeWidth="1" className={onDark ? "text-paper/50" : "text-navy-900/40"} />
      </svg>
      <span className={`font-display text-[1.5rem] leading-none tracking-[-0.015em] ${onDark ? "text-paper" : "text-navy-900"}`}>
        Permit<span className="italic">Guys</span>
      </span>
    </span>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper">
      <Container className="flex h-[4.5rem] items-center justify-between gap-6">
        <Link href={paths.home} className="shrink-0" aria-label={`${site.name} home`}>
          <Wordmark />
        </Link>
        <MainNav groups={primaryNav} ctaHref={paths.contact} />
      </Container>
    </header>
  );
}
