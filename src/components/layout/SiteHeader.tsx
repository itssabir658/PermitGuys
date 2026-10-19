import Link from "next/link";
import { primaryNav } from "@/content/navigation";
import { site } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { paths } from "@/lib/routes";
import { MainNav } from "./MainNav";

/**
 * Wordmark placeholder: set in the display face until the logo is supplied.
 * Replace the contents of <Wordmark> with the logo SVG when available.
 */
export function Wordmark({ onDark }: { onDark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5" data-placeholder-logo="">
      <span aria-hidden="true" className="grid size-7 grid-cols-2 grid-rows-2 gap-[3px] p-[3px] ring-1 ring-copper-500">
        <span className="bg-copper-500" />
        <span className={onDark ? "bg-paper/80" : "bg-navy-900"} />
        <span className={onDark ? "bg-paper/80" : "bg-navy-900"} />
        <span className={onDark ? "bg-paper/25" : "bg-navy-900/25"} />
      </span>
      <span className={`font-display text-[1.45rem] leading-none tracking-[-0.01em] ${onDark ? "text-paper" : "text-navy-900"}`}>
        {site.name}
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
