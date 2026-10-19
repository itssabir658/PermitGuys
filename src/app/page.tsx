import { Education } from "@/components/home/Education";
import { Hero } from "@/components/home/Hero";
import { HomeFaq } from "@/components/home/HomeFaq";
import { HowItWorks } from "@/components/home/HowItWorks";
import { ReviewsAndMap } from "@/components/home/ReviewsAndMap";
import { ServiceIntro } from "@/components/home/ServiceIntro";
import { CtaPanel } from "@/components/ui/CtaPanel";
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

export default async function HomePage() {
  const reviews = await getGoogleReviews();
  return (
    <>
      <Hero reviews={reviews} />
      <ServiceIntro />
      <HowItWorks />
      <ReviewsAndMap reviews={reviews} />
      <Education />
      <HomeFaq />
      <CtaPanel />
      <JsonLd data={webPageSchema({ path: "/", name: `${site.name}: permit drawings and permit guidance in the GTA`, breadcrumb: false })} />
    </>
  );
}
