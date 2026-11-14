import Link from "next/link";
import { footerNav } from "@/content/navigation";
import { site } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { RollText } from "@/components/ui/RollText";
import { paths } from "@/lib/routes";
import { Logo } from "./Logo";
import { Wordmark } from "@/components/ui/Wordmark";

/*
 * The one dark band at the foot of every page, kept short: the logo, the
 * links that neither the header nor the homepage carries (footerNav), and
 * the closing line. Services, the firm, Contact and the phone, email,
 * address and hours are all in the header or on the homepage, so the
 * footer does not repeat them. The content rises out from under the sheet
 * above it (MotionRoot, footer module).
 */
export function SiteFooter() {
  return (
    <footer data-tone="dark" data-site-footer="" className="site-footer bg-charcoal-900 text-ivory">
      <Container className="site-footer__inner pt-14 pb-8 sm:pt-16 lg:pt-20">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-4 lg:col-span-5">
            <Link href={paths.home} aria-label={`${site.name} home`} className="inline-block">
              <Logo onDark className="h-8 w-auto sm:h-9" />
            </Link>
          </div>
          <nav aria-label="Footer" className="md:col-span-8 lg:col-span-7">
            <h2 className="text-label text-charcoal-300">Resources</h2>
            <ul className="mt-5 grid gap-x-8 gap-y-2.5 text-[0.9375rem] sm:grid-cols-2 lg:text-[0.875rem]">
              {footerNav.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-ivory/80 transition-colors hover:text-ivory">
                    <RollText>{link.label}</RollText>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 grid gap-3 border-t border-ivory/15 pt-6 text-sm text-charcoal-300 lg:mt-14 lg:grid-cols-12 lg:gap-8">
          <p className="lg:col-span-5">
            © {new Date().getFullYear()} {site.legalName ?? <Wordmark />}.{" "}
            <Link href={paths.privacy} className="link-rule text-ivory/80 hover:text-ivory">
              Privacy policy
            </Link>
          </p>
          <p className="text-xs leading-relaxed lg:col-span-7">
            Information on this website is general guidance, not legal or code advice. Permit requirements are set by your municipality, which decides whether a permit is issued. Images are renderings of client projects, except those captioned as rendered studies.
          </p>
        </div>
      </Container>
    </footer>
  );
}
