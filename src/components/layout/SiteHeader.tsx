import { primaryNav, menuLinks } from "@/content/navigation";
import { services } from "@/content/services";
import { paths } from "@/lib/routes";
import { MainNav } from "./MainNav";

export { Logo } from "./Logo";

/**
 * A quiet, fixed bar. It sits transparent over the homepage photograph,
 * settles onto an ivory ground once the page scrolls, steps out of the way
 * while reading downwards and returns on the way back up. The full menu is
 * a separate full-screen panel (MainNav).
 */
export function SiteHeader() {
  return (
    <MainNav
      inline={primaryNav}
      menu={menuLinks}
      services={services.map((s) => ({ label: s.navLabel, href: paths.service(s.slug) }))}
      ctaHref={paths.contact}
    />
  );
}
