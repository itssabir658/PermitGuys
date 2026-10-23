import Link from "next/link";
import { footerNav } from "@/content/navigation";
import { site } from "@/content/site";
import { EmailLink, PhoneLink } from "@/components/ui/ContactLinks";
import { Container } from "@/components/ui/Container";
import { ArrowRight } from "@/components/ui/Icons";
import { Placeholder } from "@/components/ui/Placeholder";
import { RollText } from "@/components/ui/RollText";
import { paths } from "@/lib/routes";
import { Logo } from "./Logo";
import { OntarioOutline } from "./OntarioOutline";

/** "Greater Toronto Area, Ontario" → ["Ontario", "Greater Toronto Area"], as the preloader names the place. */
const [area, province = "Ontario"] = site.region.split(", ");

/*
 * The one dark band at the foot of every page. Pages close on paper (the
 * homepage's Contact, an inner page's CtaPanel, the contact form), so the
 * footer's own call to action shows only where none of those is on the
 * page (data-footer-cta, globals.css). In its place the Ontario outline
 * with the Greater Toronto Area marked draws itself as the footer comes up
 * (MotionRoot, footer module), a bookend to the preloader's drawing, and
 * the footer's content rises out from under the sheet above it.
 */
export function SiteFooter() {
  const { contact } = site;
  return (
    <footer data-tone="dark" data-site-footer="" className="site-footer bg-charcoal-900 text-ivory">
      <Container className="site-footer__inner pt-20 pb-10 sm:pt-28">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-8">
          <div className="min-w-0 lg:col-span-5">
            <div data-footer-cta="" className="mb-16">
              <p className="text-label text-charcoal-300">Have a project in mind?</p>
              <Link href={paths.contact} data-cube-host="" className="group mt-8 inline-flex items-center gap-5 font-display text-[clamp(1.75rem,0.25rem+2.75vw,3.6rem)] leading-[1.04] font-light tracking-[-0.036em] sm:gap-6">
                <span className="link-rule pb-2 sm:whitespace-nowrap">Start a conversation</span>
                {/* The site's one red fill: a square that turns a quarter on its cube, as the link buttons' icon cells do. */}
                <span aria-hidden="true" className="link-cube site-footer__cta-cell shrink-0">
                  <span className="link-button__cube">
                    <span className="link-button__face">
                      <ArrowRight className="size-5" />
                    </span>
                    <span className="link-button__face link-button__face--side">
                      <ArrowRight className="size-5" />
                    </span>
                  </span>
                </span>
              </Link>
            </div>
            <div className="site-footer__place">
              <OntarioOutline className="site-footer__map" />
              <p className="site-footer__region mt-6 text-label text-charcoal-300">
                <span>{province}</span>
                <span>{area}</span>
              </p>
            </div>
            <address className="mt-10 grid gap-2 text-[0.875rem] not-italic text-charcoal-300">
              <p>{contact.phone ? <PhoneLink location="footer" className="link-draw text-ivory" /> : <Placeholder onDark>phone number</Placeholder>}</p>
              <p>{contact.email ? <EmailLink location="footer" className="link-draw text-ivory" /> : <Placeholder onDark>email address</Placeholder>}</p>
              <p>{contact.address ?? <Placeholder onDark>business address, if it will be published</Placeholder>}</p>
              {contact.hours ? <p>{contact.hours}</p> : null}
            </address>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:col-span-7 lg:grid-cols-[1fr_1fr_auto] lg:gap-x-6 xl:grid-cols-3">
            {footerNav.map((col) => (
              <div key={col.heading}>
                <h2 className="text-label text-charcoal-300">{col.heading}</h2>
                <ul className="mt-6 space-y-3 text-[0.9375rem] lg:text-[0.875rem]">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-ivory/80 transition-colors hover:text-ivory">
                        <RollText>{link.label}</RollText>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-24 flex flex-col gap-10 border-t border-ivory/15 pt-10 lg:mt-32 lg:flex-row lg:items-end lg:justify-between">
          <Link href={paths.home} aria-label={`${site.name} home`} className="inline-block">
            <Logo onDark className="h-8 w-auto sm:h-10" />
          </Link>
          <div className="space-y-3 text-sm text-charcoal-300 lg:max-w-xl lg:text-right">
            <p>
              © {new Date().getFullYear()} {site.legalName ?? site.name}. Serving homeowners and property owners in the {site.region}.{" "}
              <Link href={paths.privacy} className="link-rule text-ivory/80 hover:text-ivory">
                Privacy policy
              </Link>
            </p>
            <p className="text-xs leading-relaxed">
              Information on this website is general guidance, not legal or code advice. Permit requirements are set by your municipality, which decides whether a permit is issued. Images are renderings of client projects, except those captioned as rendered studies.
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
