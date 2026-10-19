import Link from "next/link";
import { footerNav } from "@/content/navigation";
import { site } from "@/content/site";
import { EmailLink, PhoneLink } from "@/components/ui/ContactLinks";
import { Container } from "@/components/ui/Container";
import { Placeholder } from "@/components/ui/Placeholder";
import { paths } from "@/lib/routes";
import { Wordmark } from "./SiteHeader";

export function SiteFooter() {
  const { contact } = site;
  return (
    <footer className="bg-navy-950 text-navy-100">
      <Container className="py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link href={paths.home} aria-label={`${site.name} home`}>
              <Wordmark onDark />
            </Link>
            <p className="mt-6 max-w-sm leading-relaxed text-navy-100/75">{site.tagline}.</p>
            <address className="mt-8 space-y-2 text-sm not-italic text-navy-100/80">
              <p>{contact.phone ? <PhoneLink location="footer" className="hover:text-paper" /> : <Placeholder onDark>phone number</Placeholder>}</p>
              <p>{contact.email ? <EmailLink location="footer" className="hover:text-paper" /> : <Placeholder onDark>email address</Placeholder>}</p>
              <p>{contact.address ?? <Placeholder onDark>business address, if it will be published</Placeholder>}</p>
            </address>
          </div>
          <nav aria-label="Footer" className="grid gap-10 sm:grid-cols-3 lg:col-span-8">
            {footerNav.map((col) => (
              <div key={col.heading}>
                <h2 className="text-label text-copper-300">{col.heading}</h2>
                <ul className="mt-5 space-y-3 text-[0.95rem]">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-navy-100/80 transition-colors hover:text-paper">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="mt-16 flex flex-col gap-4 border-t border-paper/10 pt-8 text-sm text-navy-100/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.legalName ?? site.name}. Serving homeowners and property owners in the {site.region}.
          </p>
          <p>
            <Link href={paths.privacy} className="hover:text-paper">
              Privacy policy
            </Link>
          </p>
        </div>
        <p className="mt-6 max-w-3xl text-xs leading-relaxed text-navy-100/75">
          Information on this website is general guidance, not legal or code advice. Permit requirements are set by your municipality, which decides whether a permit is issued.
        </p>
      </Container>
    </footer>
  );
}
