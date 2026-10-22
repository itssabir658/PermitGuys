import { Credibility } from "@/components/home/Credibility";
import { FinalCta } from "@/components/home/FinalCta";
import { Hero } from "@/components/home/Hero";
import { Insights } from "@/components/home/Insights";
import { Intro } from "@/components/home/Intro";
import { Principles } from "@/components/home/Principles";
import { Process } from "@/components/home/Process";
import { Regions } from "@/components/home/Regions";
import { Reviews } from "@/components/home/Reviews";
import { Services } from "@/components/home/Services";
import { Studies } from "@/components/home/Studies";
import { Container } from "@/components/ui/Container";
import { JsonLd } from "@/components/ui/JsonLd";
import { homeSteps } from "@/content/process";
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
      <Hero />
      <Credibility reviews={reviews} />
      <Intro />
      <Services />
      <Studies />
      <section aria-labelledby="process-heading" className="bg-ivory py-24 sm:py-32 lg:py-44">
        <Container>
          <Process steps={homeSteps} />
        </Container>
      </section>
      <Principles />
      <Regions />
      <Reviews reviews={reviews} />
      <Insights />
      <FinalCta />
      <JsonLd data={webPageSchema({ path: "/", name: `${site.name}: permit drawings and permit guidance in the GTA`, breadcrumb: false })} />
    </>
  );
}
