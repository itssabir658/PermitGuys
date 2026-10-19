import Image from "next/image";
import Link from "next/link";
import { primaryNav } from "@/content/navigation";
import { site } from "@/content/site";
import { paths } from "@/lib/routes";
import { MainNav } from "./MainNav";

/**
 * The PermitGuys logo as supplied: red "permit", charcoal "guys". On dark
 * grounds "guys" switches to white (permitguys-logo-on-dark.png).
 */
export function Logo({ onDark, className }: { onDark?: boolean; className?: string }) {
  return (
    <Image
      src={onDark ? "/brand/permitguys-logo-on-dark.png" : "/brand/permitguys-logo.png"}
      alt={site.name}
      width={327}
      height={61}
      unoptimized
      priority={!onDark}
      className={className ?? "h-7 w-auto"}
    />
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
          className="absolute inset-0 -z-10 rounded-2xl border border-white bg-white/75 shadow-[0_18px_40px_-24px_rgb(28_28_28/0.35)] ring-1 ring-charcoal-900/[0.06] backdrop-blur-xl backdrop-saturate-150"
        />
        <Link href={paths.home} className="shrink-0 rounded-lg" aria-label={`${site.name} home`}>
          <Logo />
        </Link>
        <MainNav groups={primaryNav} ctaHref={paths.contact} />
      </div>
    </header>
  );
}
