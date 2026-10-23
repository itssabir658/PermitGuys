import { Contact } from "@/components/home/Contact";
import { Hero } from "@/components/home/Hero";
import { HomeMotion } from "@/components/home/HomeMotion";
import { Intro } from "@/components/home/Intro";
import { Services } from "@/components/home/Services";
import { Values } from "@/components/home/Values";
import { Works } from "@/components/home/Works";
import { JsonLd } from "@/components/ui/JsonLd";
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
 * The homepage, section by section: hero, intro orbit, works, values,
 * services, contact. HomeMotion drives all of it from the scroll engine,
 * including the page ground (stone under Works, dusk falling over the start
 * of Services).
 */
export default async function HomePage() {
  const reviews = await getGoogleReviews();
  return (
    <>
      <Hero />
      <Intro />
      <Works />
      <Values />
      <Services />
      <Contact reviews={reviews} />
      <HomeMotion />
      <JsonLd data={webPageSchema({ path: "/", name: `${site.name}: permit drawings and permit guidance in the GTA`, breadcrumb: false })} />
    </>
  );
}
