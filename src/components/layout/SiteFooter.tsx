import Link from "next/link";
import { footerNav } from "@/content/navigation";
import { site } from "@/content/site";
import { EmailLink, PhoneLink } from "@/components/ui/ContactLinks";
import { Container } from "@/components/ui/Container";
import { ArrowRight } from "@/components/ui/Icons";
import { Placeholder } from "@/components/ui/Placeholder";
import { paths } from "@/lib/routes";
import { Logo } from "./Logo";

export function SiteFooter() {
  const { contact } = site;
  return (
    <footer className="bg-charcoal-900 text-ivory">
      <Container className="pt-20 pb-10 sm:pt-28">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-6">
            <p className="text-label text-charcoal-300">Have a project in mind?</p>
            <Link href={paths.contact} className="group mt-8 inline-flex items-center gap-6 font-display text-display-lg font-light">
              <span className="link-rule pb-2">Start a conversation</span>
              <span aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white transition-transform duration-700 ease-out-expo group-hover:rotate-[-45deg]">
                <ArrowRight className="size-5" />
              </span>
            </Link>
            <address className="mt-12 grid gap-2 text-[0.9375rem] not-italic text-charcoal-300">
              <p>{contact.phone ? <PhoneLink location="footer" className="link-draw text-ivory" /> : <Placeholder onDark>phone number</Placeholder>}</p>
              <p>{contact.email ? <EmailLink location="footer" className="link-draw text-ivory" /> : <Placeholder onDark>email address</Placeholder>}</p>
              <p>{contact.address ?? <Placeholder onDark>business address, if it will be published</Placeholder>}</p>
            </address>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-6">
            {footerNav.map((col) => (
              <div key={col.heading}>
                <h2 className="text-label text-charcoal-300">{col.heading}</h2>
                <ul className="mt-6 space-y-3 text-[0.9375rem]">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="link-draw text-ivory/80 transition-colors hover:text-ivory">
                        {link.label}
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
              Information on this website is general guidance, not legal or code advice. Permit requirements are set by your municipality, which decides whether a permit is issued. Images are rendered studies, not client projects.
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
