import { site } from "@/content/site";

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

/** Phone link when a verified number exists. Clicks are reported as click_to_call. */
export function PhoneLink({ location, className }: { location: string; className?: string }) {
  const phone = site.contact.phone;
  if (!phone) return null;
  return (
    <a href={telHref(phone)} data-track-location={location} className={className}>
      {phone}
    </a>
  );
}

/** Email link when a verified address exists. Clicks are reported as click_to_email. */
export function EmailLink({ location, className }: { location: string; className?: string }) {
  const email = site.contact.email;
  if (!email) return null;
  return (
    <a href={`mailto:${email}`} data-track-location={location} className={className}>
      {email}
    </a>
  );
}
