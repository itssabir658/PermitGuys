import { Education } from "@/components/home/Education";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { Hero } from "@/components/home/Hero";
import { HomeFaq } from "@/components/home/HomeFaq";
import { HowItWorks } from "@/components/home/HowItWorks";
import { ProjectProof } from "@/components/home/ProjectProof";
import { ServiceArea } from "@/components/home/ServiceArea";
import { ServiceIntro } from "@/components/home/ServiceIntro";
import { CtaPanel } from "@/components/ui/CtaPanel";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "PermitGuys | Permit Drawings and Permit Guidance in the GTA",
  absoluteTitle: true,
  description:
    "Permit drawings and permit process guidance for homeowners and property owners in the Greater Toronto Area: additions, basement apartments, decks, custom homes and commercial projects.",
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
    </>
  );
}
