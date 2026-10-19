import { Education } from "@/components/home/Education";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { Hero } from "@/components/home/Hero";
import { HomeFaq } from "@/components/home/HomeFaq";
import { HowItWorks } from "@/components/home/HowItWorks";
import { ProjectProof } from "@/components/home/ProjectProof";
import { ServiceArea } from "@/components/home/ServiceArea";
import { ServiceIntro } from "@/components/home/ServiceIntro";
import { CtaPanel } from "@/components/ui/CtaPanel";
import { JsonLd } from "@/components/ui/JsonLd";
import { site } from "@/content/site";
import { webPageSchema } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "PermitGuys | Permit Drawings and Permit Guidance in the GTA",
  absoluteTitle: true,
  description:
    "Permit drawings and permit guidance for GTA homeowners and property owners: additions, legal basement apartments, decks, custom homes and commercial projects.",
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServiceIntro />
      <HowItWorks />
      <FeaturedProjects />
      <Education />
      <ProjectProof />
      <ServiceArea />
      <HomeFaq />
      <CtaPanel />
      <JsonLd data={webPageSchema({ path: "/", name: `${site.name}: permit drawings and permit guidance in the GTA`, breadcrumb: false })} />
    </>
  );
}
