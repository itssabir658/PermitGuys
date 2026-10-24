import { Contact } from "@/components/home/Contact";
import { Hero } from "@/components/home/Hero";
import { HomeMotion } from "@/components/home/HomeMotion";
import { Intro } from "@/components/home/Intro";
import { Making } from "@/components/home/Making";
import { Services } from "@/components/home/Services";
import { Story } from "@/components/home/Story";
import { Values } from "@/components/home/Values";
import { Works } from "@/components/home/Works";
import { JsonLd } from "@/components/ui/JsonLd";
import { site } from "@/content/site";
import { webPageSchema } from "@/lib/jsonld";
import { getGoogleReviews } from "@/lib/reviews";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "PermitGuys | Architecture, Engineering and Permit Drawings in the GTA",
  absoluteTitle: true,
  description:
    "An architecture and engineering firm in Oakville: additions, custom homes, basement apartments, decks and commercial projects across the GTA, from idea to permit.",
  path: "/",
});

// Google reviews refresh once a day (REVIEWS_REVALIDATE_SECONDS in src/lib/reviews.ts).
export const revalidate = 86400;

/**
 * The homepage, section by section: hero, intro orbit, the story (one
 * house from idea to permit), works, the making of a house (one client
 * house from its site to its permit set), values, services, contact. HomeMotion drives all of it
 * from the scroll engine, including the page ground (stone under Works,
 * dusk falling over the start of Services).
 */
export default async function HomePage() {
  const reviews = await getGoogleReviews();
  return (
    <>
      <Hero />
      <Intro />
      <Story />
      <Works />
      <Making />
      <Values />
      <Services />
      <Contact reviews={reviews} />
      <HomeMotion />
      <JsonLd data={webPageSchema({ path: "/", name: `${site.name}: architecture, engineering and permit drawings in the GTA`, breadcrumb: false })} />
    </>
  );
}
