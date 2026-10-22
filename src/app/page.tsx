import { Contact } from "@/components/home/Contact";
import { Hero } from "@/components/home/Hero";
import { HomeMotion } from "@/components/home/HomeMotion";
import { Intro } from "@/components/home/Intro";
import { Services } from "@/components/home/Services";
import { Values } from "@/components/home/Values";
import { Works } from "@/components/home/Works";
import { JsonLd } from "@/components/ui/JsonLd";
import { NotchClipDefs } from "@/components/ui/NotchClip";
import { site } from "@/content/site";
import { webPageSchema } from "@/lib/jsonld";
import { getGoogleReviews } from "@/lib/reviews";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "PermitGuys | Permit Drawings and Permit Guidance in the GTA",
  absoluteTitle: true,
  description:
    "Permit drawings and permit guidance for GTA homeowners and property owners: additions, legal basement apartments, decks, custom homes and commercial projects.",
  path: "/",
});

// Google reviews refresh once a day (REVIEWS_REVALIDATE_SECONDS in src/lib/reviews.ts).
export const revalidate = 86400;

/**
 * Follows the Studio Foundry homepage section by section, with its motion
 * (docs/MOTION.md): hero, intro orbit, works, values, the colour buffer that
 * turns the page to night, services, contact. HomeMotion drives all of it
 * from the scroll engine.
 */
export default async function HomePage() {
  const reviews = await getGoogleReviews();
  return (
    <>
      <Hero />
      <Intro />
      <Works />
      <Values />
      {/* Empty on purpose: scrolling through it turns the page ground from cream to night. */}
      <div data-color-buffer="" aria-hidden="true" className="h-[50vh]" />
      <Services />
      <Contact reviews={reviews} />
      <NotchClipDefs />
      <HomeMotion />
      <JsonLd data={webPageSchema({ path: "/", name: `${site.name}: permit drawings and permit guidance in the GTA`, breadcrumb: false })} />
    </>
  );
}
